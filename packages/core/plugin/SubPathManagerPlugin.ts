import { fabric } from 'fabric';
import { v4 as uuid } from 'uuid';
import type { IEditor, IPluginTempl } from '@kuaitu/core';

interface SubPath {
  id: string;
  index: number;
  pathData: string;
  commands: PathCommand[];
  stats: SubPathStats;
  bounds: { left: number; top: number; width: number; height: number };
  isHighlighted: boolean;
  color: string;
}

interface PathCommand {
  type: string;
  coords: number[];
  isControlPoint: boolean;
  id?: string; // Unique identifier for command
}

interface EditablePoint {
  id: string;
  x: number;
  y: number;
  type: 'anchor' | 'control1' | 'control2';
  commandIndex: number;
  commandId: string;
  isVisible: boolean;
  linkedControlPoint?: string; // For synchronized control points
}

interface ControlPointPair {
  point1Id: string;
  point2Id: string;
  anchorPointId: string;
  isSynchronized: boolean;
}

interface SubPathStats {
  totalCommands: number;
  totalPoints: number;
  isClosed: boolean;
  pathLength: number;
}

interface SubPathState {
  subPaths: SubPath[];
  selectedSubPath: string | null;
  highlightVisible: boolean;
  originalObject: fabric.Path | null;
  highlightObjects: fabric.Path[];
  editingMode: boolean;
  editablePoints: EditablePoint[];
  controlPointPairs: ControlPointPair[];
  pointObjects: fabric.Circle[];
  selectedPoint: string | null;
}

type IPlugin = Pick<
  SubPathManagerPlugin,
  | 'extractSubPaths'
  | 'highlightSubPath'
  | 'selectSubPath'
  | 'clearHighlights'
  | 'getSubPaths'
  | 'toggleSubPathPanel'
  | 'moveSubPath'
  | 'deleteSubPath'
  | 'enablePointEditingMode'
  | 'disablePointEditingMode'
  | 'togglePointEditingMode'
  | 'selectEditablePoint'
  | 'moveEditablePoint'
  | 'updateControlPointPair'
>;

declare module '@kuaitu/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

export default class SubPathManagerPlugin implements IPluginTempl {
  static pluginName = 'SubPathManagerPlugin';
  static apis = [
    'extractSubPaths',
    'highlightSubPath',
    'selectSubPath',
    'clearHighlights',
    'getSubPaths',
    'toggleSubPathPanel',
    'moveSubPath',
    'deleteSubPath',
    'enablePointEditingMode',
    'disablePointEditingMode',
    'togglePointEditingMode',
    'selectEditablePoint',
    'moveEditablePoint',
    'updateControlPointPair',
  ];
  static events = [
    'subPathExtracted',
    'subPathSelected',
    'subPathHighlighted',
    'subPathCleared',
    'subPathMoved',
    'subPathDeleted',
    'pointEditingModeChanged',
    'editablePointSelected',
    'editablePointMoved',
    'controlPointPairUpdated',
  ];

  private state: SubPathState = {
    subPaths: [],
    selectedSubPath: null,
    highlightVisible: true,
    originalObject: null,
    highlightObjects: [],
    editingMode: false,
    editablePoints: [],
    controlPointPairs: [],
    pointObjects: [],
    selectedPoint: null,
  };

  private colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FECA57',
    '#FF9FF3',
    '#54A0FF',
    '#5F27CD',
    '#00D2D3',
    '#FF9F43',
  ];

  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this.bindEvents();
  }

  private bindEvents() {
    this.canvas.on('selection:created', this.handleSelection.bind(this));
    this.canvas.on('selection:updated', this.handleSelection.bind(this));
    this.canvas.on('selection:cleared', this.handleSelectionCleared.bind(this));
    this.canvas.on('object:modified', this.handleObjectModified.bind(this));
    this.canvas.on('object:scaling', this.handleObjectTransform.bind(this));
    this.canvas.on('object:rotating', this.handleObjectTransform.bind(this));
    this.canvas.on('object:moving', this.handleObjectTransform.bind(this));
  }

  private handleSelection(e: fabric.IEvent) {
    const activeObject = e.target as fabric.Path;
    if (this.isPathWithMultipleM(activeObject)) {
      this.extractSubPaths(activeObject);
    } else {
      this.clearState();
    }
  }

  private handleSelectionCleared() {
    this.clearState();
  }

  private handleObjectModified(e: fabric.IEvent) {
    if (e.target === this.state.originalObject && this.state.subPaths.length > 0) {
      // Update highlights when the original object is modified
      this.updateHighlights();
    }
  }

  private handleObjectTransform(e: fabric.IEvent) {
    if (e.target === this.state.originalObject && this.state.subPaths.length > 0) {
      // Update highlights in real-time during transformations
      this.updateHighlights();
    }
  }

  private updateHighlights() {
    if (!this.state.originalObject || this.state.highlightObjects.length === 0) return;

    const original = this.state.originalObject!;

    this.state.highlightObjects.forEach((highlightObj) => {
      highlightObj.set({
        left: original.left,
        top: original.top,
        scaleX: original.scaleX,
        scaleY: original.scaleY,
        angle: original.angle,
        flipX: original.flipX,
        flipY: original.flipY,
        skewX: original.skewX,
        skewY: original.skewY,
        originX: original.originX,
        originY: original.originY,
      });

      // Apply transformation matrix if it exists
      if (original.transformMatrix) {
        highlightObj.transformMatrix = [...original.transformMatrix];
      }
    });

    this.canvas.renderAll();
  }

  private isPathWithMultipleM(obj: any): boolean {
    if (!obj || obj.type !== 'path') return false;

    let pathData = '';
    if (obj.path && Array.isArray(obj.path)) {
      pathData = this.fabricPathToString(obj.path);
    } else if ((obj as any).pathData) {
      pathData = (obj as any).pathData;
    } else if ((obj as any)._path) {
      pathData = this.fabricPathToString((obj as any)._path);
    }

    const mCount = (pathData.match(/[Mm]/g) || []).length;
    return mCount > 1;
  }

  private fabricPathToString(pathArray: any[]): string {
    return pathArray
      .map((segment) => {
        if (Array.isArray(segment)) {
          return segment.join(' ');
        }
        return segment;
      })
      .join(' ');
  }

  extractSubPaths(pathObject: fabric.Path): SubPath[] {
    if (!this.isPathWithMultipleM(pathObject)) {
      return [];
    }

    this.state.originalObject = pathObject;
    let pathData = '';

    if (pathObject.path && Array.isArray(pathObject.path)) {
      pathData = this.fabricPathToString(pathObject.path);
    } else if ((pathObject as any).pathData) {
      pathData = (pathObject as any).pathData;
    } else if ((pathObject as any)._path) {
      pathData = this.fabricPathToString((pathObject as any)._path);
    }

    const subPaths = this.splitPathByM(pathData);
    this.state.subPaths = subPaths.map((pathSegment, index) => ({
      id: uuid(),
      index: index + 1,
      pathData: pathSegment,
      commands: this.parsePathData(pathSegment),
      stats: this.calculateSubPathStats(pathSegment),
      bounds: this.calculateSubPathBounds(pathSegment, pathObject),
      isHighlighted: false,
      color: this.colors[index % this.colors.length],
    }));

    this.editor.emit('subPathExtracted', {
      subPaths: this.state.subPaths,
      originalObject: pathObject,
    });

    return this.state.subPaths;
  }

  private splitPathByM(pathData: string): string[] {
    const subPaths: string[] = [];
    const commandRegex =
      /([MmLlHhVvCcSsQqTtAaZz])((?:\s*[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?\s*,?\s*)*)/g;

    let currentSubPath = '';
    let match;
    let isFirstM = true;

    while ((match = commandRegex.exec(pathData)) !== null) {
      const command = match[1];
      const coords = match[2];

      if (command.toLowerCase() === 'm') {
        if (!isFirstM && currentSubPath.trim()) {
          subPaths.push(currentSubPath.trim());
          currentSubPath = '';
        }
        isFirstM = false;
      }

      currentSubPath += command + coords + ' ';
    }

    if (currentSubPath.trim()) {
      subPaths.push(currentSubPath.trim());
    }

    return subPaths.filter((path) => path.length > 0);
  }

  private parsePathData(pathDataString: string): PathCommand[] {
    const commands: PathCommand[] = [];
    const commandRegex =
      /([MmLlHhVvCcSsQqTtAaZz])((?:\s*[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?\s*,?\s*)*)/g;

    let match;
    while ((match = commandRegex.exec(pathDataString)) !== null) {
      const type = match[1];
      const coordString = match[2].trim();

      let coords: number[] = [];
      if (coordString) {
        coords = coordString
          .split(/[\s,]+/)
          .filter((s) => s !== '')
          .map(Number);
      }

      commands.push({
        type,
        coords,
        isControlPoint: ['C', 'c', 'S', 's', 'Q', 'q', 'T', 't'].includes(type),
      });
    }

    return commands;
  }

  private calculateSubPathStats(pathData: string): SubPathStats {
    const commands = this.parsePathData(pathData);
    const stats: SubPathStats = {
      totalCommands: commands.length,
      totalPoints: 0,
      isClosed: false,
      pathLength: 0,
    };

    commands.forEach((cmd) => {
      stats.totalPoints += Math.floor(cmd.coords.length / 2);
    });

    const lastCommand = commands[commands.length - 1];
    stats.isClosed = lastCommand && (lastCommand.type === 'Z' || lastCommand.type === 'z');

    stats.pathLength = this.calculatePathLength(commands);

    return stats;
  }

  private calculatePathLength(commands: PathCommand[]): number {
    let totalLength = 0;
    let currentX = 0;
    let currentY = 0;

    const distance = (x1: number, y1: number, x2: number, y2: number) =>
      Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    commands.forEach((command) => {
      const { type, coords } = command;
      const isRelative = type === type.toLowerCase();

      switch (type.toLowerCase()) {
        case 'm':
          if (coords.length >= 2) {
            if (isRelative) {
              currentX += coords[0];
              currentY += coords[1];
            } else {
              currentX = coords[0];
              currentY = coords[1];
            }
          }
          break;

        case 'l':
          if (coords.length >= 2) {
            const targetX = isRelative ? currentX + coords[0] : coords[0];
            const targetY = isRelative ? currentY + coords[1] : coords[1];
            totalLength += distance(currentX, currentY, targetX, targetY);
            currentX = targetX;
            currentY = targetY;
          }
          break;

        case 'h':
          if (coords.length >= 1) {
            const targetX = isRelative ? currentX + coords[0] : coords[0];
            totalLength += Math.abs(targetX - currentX);
            currentX = targetX;
          }
          break;

        case 'v':
          if (coords.length >= 1) {
            const targetY = isRelative ? currentY + coords[0] : coords[0];
            totalLength += Math.abs(targetY - currentY);
            currentY = targetY;
          }
          break;
      }
    });

    return totalLength;
  }

  private calculateSubPathBounds(
    pathData: string,
    originalObject: fabric.Path
  ): { left: number; top: number; width: number; height: number } {
    // Simplified bounds calculation - in a real implementation, you'd want to calculate actual path bounds
    const objBounds = originalObject.getBoundingRect();
    return {
      left: objBounds.left,
      top: objBounds.top,
      width: objBounds.width,
      height: objBounds.height,
    };
  }

  highlightSubPath(subPathId: string, strokeWidth = 1): void {
    const subPath = this.state.subPaths.find((sp) => sp.id === subPathId);
    if (!subPath || !this.state.originalObject) return;

    this.clearHighlights();

    try {
      const original = this.state.originalObject!;

      // Clone the original object instead of creating from SVG string
      original.clone((clonedPath: fabric.Path) => {
        // Update the path data to show only the selected sub-path
        if (clonedPath.path && Array.isArray(clonedPath.path)) {
          // Convert sub-path string back to fabric path array
          const subPathCommands = this.parsePathDataToFabricPath(subPath.pathData);
          clonedPath.path = subPathCommands;
        }

        // Style the highlight
        clonedPath.set({
          stroke: subPath.color,
          strokeWidth: strokeWidth,
          fill: 'transparent',
          opacity: 0.8,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });

        // Ensure the cloned path maintains all transformations
        this.canvas.add(clonedPath);
        this.state.highlightObjects.push(clonedPath);
        this.canvas.renderAll();

        subPath.isHighlighted = true;
        this.state.selectedSubPath = subPathId;

        this.editor.emit('subPathHighlighted', { subPath, highlightObject: clonedPath });
      });
    } catch (error) {
      console.warn('Error creating highlight for sub-path:', error);
    }
  }

  private parsePathDataToFabricPath(pathDataString: string): any[] {
    const fabricPath: any[] = [];
    const commandRegex =
      /([MmLlHhVvCcSsQqTtAaZz])((?:\s*[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?\s*,?\s*)*)/g;

    let match;
    while ((match = commandRegex.exec(pathDataString)) !== null) {
      const command = match[1];
      const coordString = match[2].trim();

      let coords: number[] = [];
      if (coordString) {
        coords = coordString
          .split(/[\s,]+/)
          .filter((s) => s !== '')
          .map(Number);
      }

      // Convert SVG path commands to Fabric.js format
      switch (command.toLowerCase()) {
        case 'm':
          if (coords.length >= 2) {
            fabricPath.push([command, coords[0], coords[1]]);
            // Handle multiple coordinate pairs after M command (implicit L commands)
            for (let i = 2; i < coords.length; i += 2) {
              if (i + 1 < coords.length) {
                const implicitCommand = command === 'M' ? 'L' : 'l';
                fabricPath.push([implicitCommand, coords[i], coords[i + 1]]);
              }
            }
          }
          break;

        case 'l':
          if (coords.length >= 2) {
            for (let i = 0; i < coords.length; i += 2) {
              if (i + 1 < coords.length) {
                fabricPath.push([command, coords[i], coords[i + 1]]);
              }
            }
          }
          break;

        case 'h':
          if (coords.length >= 1) {
            for (const coord of coords) {
              fabricPath.push([command, coord]);
            }
          }
          break;

        case 'v':
          if (coords.length >= 1) {
            for (const coord of coords) {
              fabricPath.push([command, coord]);
            }
          }
          break;

        case 'c':
          if (coords.length >= 6) {
            for (let i = 0; i < coords.length; i += 6) {
              if (i + 5 < coords.length) {
                fabricPath.push([
                  command,
                  coords[i],
                  coords[i + 1],
                  coords[i + 2],
                  coords[i + 3],
                  coords[i + 4],
                  coords[i + 5],
                ]);
              }
            }
          }
          break;

        case 's':
          if (coords.length >= 4) {
            for (let i = 0; i < coords.length; i += 4) {
              if (i + 3 < coords.length) {
                fabricPath.push([command, coords[i], coords[i + 1], coords[i + 2], coords[i + 3]]);
              }
            }
          }
          break;

        case 'q':
          if (coords.length >= 4) {
            for (let i = 0; i < coords.length; i += 4) {
              if (i + 3 < coords.length) {
                fabricPath.push([command, coords[i], coords[i + 1], coords[i + 2], coords[i + 3]]);
              }
            }
          }
          break;

        case 't':
          if (coords.length >= 2) {
            for (let i = 0; i < coords.length; i += 2) {
              if (i + 1 < coords.length) {
                fabricPath.push([command, coords[i], coords[i + 1]]);
              }
            }
          }
          break;

        case 'a':
          if (coords.length >= 7) {
            for (let i = 0; i < coords.length; i += 7) {
              if (i + 6 < coords.length) {
                fabricPath.push([
                  command,
                  coords[i],
                  coords[i + 1],
                  coords[i + 2],
                  coords[i + 3],
                  coords[i + 4],
                  coords[i + 5],
                  coords[i + 6],
                ]);
              }
            }
          }
          break;

        case 'z':
          fabricPath.push([command]);
          break;

        default:
          console.warn(`Unknown path command: ${command}`);
          break;
      }
    }

    return fabricPath;
  }

  selectSubPath(subPathId: string, strokeWidth = 1): void {
    const subPath = this.state.subPaths.find((sp) => sp.id === subPathId);
    if (!subPath) return;

    this.highlightSubPath(subPathId, strokeWidth);
    this.editor.emit('subPathSelected', { subPath });
  }

  clearHighlights(): void {
    this.state.highlightObjects.forEach((obj) => {
      this.canvas.remove(obj);
    });
    this.state.highlightObjects = [];

    this.state.subPaths.forEach((subPath) => {
      subPath.isHighlighted = false;
    });

    this.state.selectedSubPath = null;
    this.canvas.renderAll();

    this.editor.emit('subPathCleared');
  }

  getSubPaths(): SubPath[] {
    return this.state.subPaths;
  }

  toggleSubPathPanel(): void {
    this.editor.emit('toggleSubPathPanel', {
      hasSubPaths: this.state.subPaths.length > 0,
      subPaths: this.state.subPaths,
    });
  }

  moveSubPath(subPathId: string, offsetX: number, offsetY: number): void {
    const subPath = this.state.subPaths.find((sp) => sp.id === subPathId);
    if (!subPath || !this.state.originalObject) return;

    try {
      // Move the sub-path data
      const movedPathData = this.translatePathData(subPath.pathData, offsetX, offsetY);
      subPath.pathData = movedPathData;

      // Recalculate stats and bounds
      subPath.stats = this.calculateSubPathStats(movedPathData);
      subPath.bounds = this.calculateSubPathBounds(movedPathData, this.state.originalObject);

      // Update the original object's path data
      this.updateOriginalObjectPath();

      // If this sub-path is currently highlighted, update the highlight
      if (this.state.selectedSubPath === subPathId) {
        this.highlightSubPath(subPathId, 1); // Use default stroke width
      }

      // Emit event for UI updates
      this.editor.emit('subPathMoved', { subPath, offsetX, offsetY });
    } catch (error) {
      console.warn('Error moving sub-path:', error);
    }
  }

  private translatePathData(pathData: string, offsetX: number, offsetY: number): string {
    const commandRegex =
      /([MmLlHhVvCcSsQqTtAaZz])((?:\s*[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?\s*,?\s*)*)/g;

    return pathData.replace(commandRegex, (match, command, coordString) => {
      if (!coordString.trim()) return match;

      const coords = coordString
        .trim()
        .split(/[\s,]+/)
        .filter((s) => s !== '')
        .map(Number);

      const isRelative = command === command.toLowerCase();
      const cmdLower = command.toLowerCase();

      // Only translate absolute coordinates for positioning commands
      if (!isRelative) {
        switch (cmdLower) {
          case 'm':
          case 'l':
            // Move and Line commands: translate x,y pairs
            for (let i = 0; i < coords.length; i += 2) {
              if (i + 1 < coords.length) {
                coords[i] += offsetX; // x coordinate
                coords[i + 1] += offsetY; // y coordinate
              }
            }
            break;

          case 'h':
            // Horizontal line: translate x coordinates
            for (let i = 0; i < coords.length; i++) {
              coords[i] += offsetX;
            }
            break;

          case 'v':
            // Vertical line: translate y coordinates
            for (let i = 0; i < coords.length; i++) {
              coords[i] += offsetY;
            }
            break;

          case 'c':
            // Cubic Bezier: translate all x,y pairs
            for (let i = 0; i < coords.length; i += 6) {
              if (i + 5 < coords.length) {
                coords[i] += offsetX; // x1
                coords[i + 1] += offsetY; // y1
                coords[i + 2] += offsetX; // x2
                coords[i + 3] += offsetY; // y2
                coords[i + 4] += offsetX; // x
                coords[i + 5] += offsetY; // y
              }
            }
            break;

          case 's':
            // Smooth Cubic Bezier: translate x2,y2,x,y pairs
            for (let i = 0; i < coords.length; i += 4) {
              if (i + 3 < coords.length) {
                coords[i] += offsetX; // x2
                coords[i + 1] += offsetY; // y2
                coords[i + 2] += offsetX; // x
                coords[i + 3] += offsetY; // y
              }
            }
            break;
        }
      }
      // For relative commands, we don't need to translate as they're relative to the current position

      return command + coords.join(' ');
    });
  }

  private updateOriginalObjectPath(): void {
    if (!this.state.originalObject || this.state.subPaths.length === 0) return;

    try {
      // Reconstruct the complete path data from all sub-paths
      const completePath = this.state.subPaths.map((sp) => sp.pathData).join(' ');

      // Store original position and transformations
      const originalLeft = this.state.originalObject.left;
      const originalTop = this.state.originalObject.top;
      const originalScaleX = this.state.originalObject.scaleX;
      const originalScaleY = this.state.originalObject.scaleY;
      const originalAngle = this.state.originalObject.angle;

      // Method 1: Try using the official Fabric.js method to update path
      if (typeof this.state.originalObject._setPath === 'function') {
        this.state.originalObject._setPath(completePath);
      }

      // Method 2: Update the path array directly
      const fabricPath = this.parsePathDataToFabricPath(completePath);
      this.state.originalObject.path = fabricPath;

      // Method 3: Update internal properties
      (this.state.originalObject as any).pathData = completePath;
      (this.state.originalObject as any)._path = fabricPath;

      // Force recalculation of path dimensions
      if (typeof this.state.originalObject._setPathDimensions === 'function') {
        (this.state.originalObject as any)._setPathDimensions();
      }

      // Restore original transformations
      this.state.originalObject.set({
        left: originalLeft,
        top: originalTop,
        scaleX: originalScaleX,
        scaleY: originalScaleY,
        angle: originalAngle,
      });

      // Update coordinates and mark as dirty
      this.state.originalObject.setCoords();
      this.state.originalObject.dirty = true;

      // Fire the modified event to notify the editor
      this.canvas.fire('path:changed', { target: this.state.originalObject });

      // Re-render the canvas
      this.canvas.requestRenderAll();

      console.log('Updated original path with:', completePath);
    } catch (error) {
      console.error('Error updating original object path:', error);
      // Fallback: try to force a complete re-render
      this.canvas.renderAll();
    }
  }

  deleteSubPath(subPathId: string): void {
    const subPathIndex = this.state.subPaths.findIndex((sp) => sp.id === subPathId);
    if (subPathIndex === -1) return;

    try {
      const deletedSubPath = this.state.subPaths[subPathIndex];

      // Clear highlight if the deleted sub-path was selected
      if (this.state.selectedSubPath === subPathId) {
        this.clearHighlights();
      }

      // Remove the sub-path from the array
      this.state.subPaths.splice(subPathIndex, 1);

      // If no sub-paths remain, clear everything
      if (this.state.subPaths.length === 0) {
        this.clearState();
        this.editor.emit('subPathDeleted', {
          deletedSubPath,
          remainingSubPaths: [],
          isEmpty: true,
        });
        return;
      }

      // Update indices of remaining sub-paths
      this.updateSubPathIndices();

      // Update the original object's path data
      this.updateOriginalObjectPath();

      // Emit event for UI updates
      this.editor.emit('subPathDeleted', {
        deletedSubPath,
        remainingSubPaths: this.state.subPaths,
        isEmpty: false,
      });

      console.log(
        'Deleted sub-path:',
        deletedSubPath.index,
        'Remaining:',
        this.state.subPaths.length
      );
    } catch (error) {
      console.error('Error deleting sub-path:', error);
    }
  }

  private updateSubPathIndices(): void {
    // Re-index all sub-paths to maintain sequential numbering
    this.state.subPaths.forEach((subPath, index) => {
      subPath.index = index + 1;
      // Update color based on new index
      subPath.color = this.colors[index % this.colors.length];
    });
  }

  private clearState(): void {
    this.clearHighlights();
    this.disablePointEditingMode();
    this.state.subPaths = [];
    this.state.originalObject = null;
  }

  // Point Editing Mode Methods
  enablePointEditingMode(subPathId?: string): void {
    if (!this.state.originalObject) return;

    this.state.editingMode = true;
    this.clearEditablePoints();

    // If specific subPath provided, create points for it
    // Otherwise, create points for currently selected subPath
    const targetSubPath = subPathId
      ? this.state.subPaths.find((sp) => sp.id === subPathId)
      : this.state.subPaths.find((sp) => sp.id === this.state.selectedSubPath);

    if (targetSubPath) {
      this.createEditablePointsForSubPath(targetSubPath);
    }

    this.editor.emit('pointEditingModeChanged', {
      enabled: true,
      subPathId: targetSubPath?.id,
    });
  }

  disablePointEditingMode(): void {
    this.state.editingMode = false;
    this.clearEditablePoints();
    this.editor.emit('pointEditingModeChanged', { enabled: false });
  }

  togglePointEditingMode(subPathId?: string): void {
    if (this.state.editingMode) {
      this.disablePointEditingMode();
    } else {
      this.enablePointEditingMode(subPathId);
    }
  }

  private clearEditablePoints(): void {
    // Remove point objects from canvas
    this.state.pointObjects.forEach((pointObj) => {
      this.canvas.remove(pointObj);
    });

    // Clear state
    this.state.editablePoints = [];
    this.state.controlPointPairs = [];
    this.state.pointObjects = [];
    this.state.selectedPoint = null;

    this.canvas.renderAll();
  }

  private createEditablePointsForSubPath(subPath: SubPath): void {
    this.clearEditablePoints();

    const points: EditablePoint[] = [];
    const controlPairs: ControlPointPair[] = [];

    // Get the original path coordinates (without transformations)
    const originalCoords = this.getOriginalPathCoordinates(subPath);

    subPath.commands.forEach((command, commandIndex) => {
      const commandId = command.id || `cmd_${commandIndex}`;
      command.id = commandId; // Ensure command has ID

      // Use original coordinates if available, otherwise fall back to command coords
      const coords = originalCoords[commandIndex] || command.coords;

      switch (command.type.toLowerCase()) {
        case 'm':
        case 'l':
          if (coords.length >= 2) {
            points.push({
              id: `${commandId}_anchor`,
              x: coords[0],
              y: coords[1],
              type: 'anchor',
              commandIndex,
              commandId,
              isVisible: true,
            });
          }
          break;

        case 'c':
          // Cubic Bézier curve: control1, control2, anchor
          if (coords.length >= 6) {
            const control1Id = `${commandId}_control1`;
            const control2Id = `${commandId}_control2`;
            const anchorId = `${commandId}_anchor`;

            points.push(
              {
                id: control1Id,
                x: coords[0],
                y: coords[1],
                type: 'control1',
                commandIndex,
                commandId,
                isVisible: true,
              },
              {
                id: control2Id,
                x: coords[2],
                y: coords[3],
                type: 'control2',
                commandIndex,
                commandId,
                isVisible: true,
              },
              {
                id: anchorId,
                x: coords[4],
                y: coords[5],
                type: 'anchor',
                commandIndex,
                commandId,
                isVisible: true,
              }
            );

            // Create synchronized control point pair
            controlPairs.push({
              point1Id: control1Id,
              point2Id: control2Id,
              anchorPointId: anchorId,
              isSynchronized: true,
            });
          }
          break;

        case 's':
          // Smooth cubic Bézier: control2, anchor
          if (coords.length >= 4) {
            const control2Id = `${commandId}_control2`;
            const anchorId = `${commandId}_anchor`;

            points.push(
              {
                id: control2Id,
                x: coords[0],
                y: coords[1],
                type: 'control2',
                commandIndex,
                commandId,
                isVisible: true,
              },
              {
                id: anchorId,
                x: coords[2],
                y: coords[3],
                type: 'anchor',
                commandIndex,
                commandId,
                isVisible: true,
              }
            );
          }
          break;

        case 'q':
          // Quadratic Bézier: control, anchor
          if (coords.length >= 4) {
            points.push(
              {
                id: `${commandId}_control1`,
                x: coords[0],
                y: coords[1],
                type: 'control1',
                commandIndex,
                commandId,
                isVisible: true,
              },
              {
                id: `${commandId}_anchor`,
                x: coords[2],
                y: coords[3],
                type: 'anchor',
                commandIndex,
                commandId,
                isVisible: true,
              }
            );
          }
          break;

        case 'h':
          if (coords.length >= 1) {
            // For horizontal line, we need to get Y from previous point
            const prevY = this.getPreviousY(subPath.commands, commandIndex, originalCoords);
            points.push({
              id: `${commandId}_anchor`,
              x: coords[0],
              y: prevY,
              type: 'anchor',
              commandIndex,
              commandId,
              isVisible: true,
            });
          }
          break;

        case 'v':
          if (coords.length >= 1) {
            // For vertical line, we need to get X from previous point
            const prevX = this.getPreviousX(subPath.commands, commandIndex, originalCoords);
            points.push({
              id: `${commandId}_anchor`,
              x: prevX,
              y: coords[0],
              type: 'anchor',
              commandIndex,
              commandId,
              isVisible: true,
            });
          }
          break;
      }
    });

    // Handle closed path synchronization
    if (subPath.stats.isClosed && points.length > 0) {
      this.handleClosedPathSynchronization(points, controlPairs);
    }

    this.state.editablePoints = points;
    this.state.controlPointPairs = controlPairs;

    // Create visual point objects on canvas
    this.createPointObjects();
  }

  private getOriginalPathCoordinates(subPath: SubPath): number[][] {
    // Use the subPath command coordinates directly
    // These are already the correct path coordinates without object transformations
    return subPath.commands.map((cmd) => cmd.coords);
  }

  private getPreviousY(
    commands: PathCommand[],
    currentIndex: number,
    originalCoords?: number[][]
  ): number {
    // Find the previous command that has Y coordinate
    for (let i = currentIndex - 1; i >= 0; i--) {
      const cmd = commands[i];
      const coords = originalCoords?.[i] || cmd.coords;

      switch (cmd.type.toLowerCase()) {
        case 'm':
        case 'l':
          if (coords.length >= 2) return coords[1];
          break;
        case 'c':
          if (coords.length >= 6) return coords[5];
          break;
        case 's':
        case 'q':
          if (coords.length >= 4) return coords[3];
          break;
        case 'v':
          if (coords.length >= 1) return coords[0];
          break;
      }
    }
    return 0; // fallback
  }

  private getPreviousX(
    commands: PathCommand[],
    currentIndex: number,
    originalCoords?: number[][]
  ): number {
    // Find the previous command that has X coordinate
    for (let i = currentIndex - 1; i >= 0; i--) {
      const cmd = commands[i];
      const coords = originalCoords?.[i] || cmd.coords;

      switch (cmd.type.toLowerCase()) {
        case 'm':
        case 'l':
          if (coords.length >= 2) return coords[0];
          break;
        case 'c':
          if (coords.length >= 6) return coords[4];
          break;
        case 's':
        case 'q':
          if (coords.length >= 4) return coords[2];
          break;
        case 'h':
          if (coords.length >= 1) return coords[0];
          break;
      }
    }
    return 0; // fallback
  }

  private handleClosedPathSynchronization(
    points: EditablePoint[],
    controlPairs: ControlPointPair[]
  ): void {
    if (points.length === 0) return;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    // If first and last points are at same position (closed path)
    if (
      firstPoint.type === 'anchor' &&
      lastPoint.type === 'anchor' &&
      Math.abs(firstPoint.x - lastPoint.x) < 0.1 &&
      Math.abs(firstPoint.y - lastPoint.y) < 0.1
    ) {
      // Link first and last anchor points
      firstPoint.linkedControlPoint = lastPoint.id;
      lastPoint.linkedControlPoint = firstPoint.id;

      // Find control points adjacent to first and last anchors
      const firstControlPoints = points.filter(
        (p) => p.commandIndex === firstPoint.commandIndex && p.type !== 'anchor'
      );
      const lastControlPoints = points.filter(
        (p) => p.commandIndex === lastPoint.commandIndex && p.type !== 'anchor'
      );

      // Create synchronization between control points across the closure
      if (firstControlPoints.length > 0 && lastControlPoints.length > 0) {
        controlPairs.push({
          point1Id: firstControlPoints[0].id,
          point2Id: lastControlPoints[lastControlPoints.length - 1].id,
          anchorPointId: firstPoint.id,
          isSynchronized: true,
        });
      }
    }
  }

  private createPointObjects(): void {
    const originalObj = this.state.originalObject;
    if (!originalObj) return;

    console.log('Creating points for object:', {
      left: originalObj.left,
      top: originalObj.top,
      width: originalObj.width,
      height: originalObj.height,
      scaleX: originalObj.scaleX,
      scaleY: originalObj.scaleY,
      angle: originalObj.angle,
      originX: originalObj.originX,
      originY: originalObj.originY,
    });

    this.state.editablePoints.forEach((point, index) => {
      console.log(`Point ${index}:`, { id: point.id, x: point.x, y: point.y, type: point.type });

      // Transform point coordinates according to original object's transformation
      const transformedCoords = this.transformPointCoordinates(point.x, point.y, originalObj);

      console.log(`Transformed to:`, transformedCoords);

      const pointObj = new fabric.Circle({
        left: transformedCoords.x,
        top: transformedCoords.y,
        radius: point.type === 'anchor' ? 6 : 4,
        fill: this.getPointColor(point.type),
        stroke: point.type === 'anchor' ? '#1890ff' : '#ff7875',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        originX: 'center',
        originY: 'center',
        excludeFromExport: true,
        hoverCursor: 'move',
        moveCursor: 'move',
      });

      // Store reference to the point data
      (pointObj as any).editablePointId = point.id;

      // Add event listeners for point interaction
      pointObj.on('mousedown', () => {
        this.selectEditablePoint(point.id);
      });

      pointObj.on('moving', (e) => {
        const obj = e.target as fabric.Circle;
        this.handlePointMove(point.id, obj.left!, obj.top!);
      });

      // Ensure point coordinates are properly set
      pointObj.setCoords();

      this.canvas.add(pointObj);
      this.state.pointObjects.push(pointObj);
    });

    this.canvas.renderAll();
  }

  private transformPointCoordinates(
    x: number,
    y: number,
    originalObj: fabric.Path
  ): { x: number; y: number } {
    // ENFOQUE SIMPLE: Aplicar transformaciones básicas directamente
    console.log(`SIMPLE TRANSFORM: Path coords: (${x}, ${y})`);
    console.log(`Object: left=${originalObj.left}, top=${originalObj.top}, scale=${originalObj.scaleX}x${originalObj.scaleY}, angle=${originalObj.angle}`);
    
    // Obtener las dimensiones del objeto original
    const objWidth = originalObj.width || 0;
    const objHeight = originalObj.height || 0;
    
    console.log(`Object dimensions: ${objWidth}x${objHeight}`);
    
    // Convertir coordenadas del path a coordenadas relativas al centro del objeto
    // Las coordenadas del path están en el sistema de coordenadas del path original
    // Las necesitamos convertir a coordenadas relativas al centro
    const relativeX = x - objWidth / 2;
    const relativeY = y - objHeight / 2;
    
    console.log(`Relative to object center: (${relativeX}, ${relativeY})`);
    
    // Aplicar escala
    const scaleX = originalObj.scaleX || 1;
    const scaleY = originalObj.scaleY || 1;
    
    let transformedX = relativeX * scaleX;
    let transformedY = relativeY * scaleY;
    
    console.log(`After scaling: (${transformedX}, ${transformedY})`);
    
    // Aplicar rotación si existe
    const angle = originalObj.angle || 0;
    if (angle !== 0) {
      const rad = fabric.util.degreesToRadians(angle);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      const rotatedX = transformedX * cos - transformedY * sin;
      const rotatedY = transformedX * sin + transformedY * cos;
      
      transformedX = rotatedX;
      transformedY = rotatedY;
      
      console.log(`After rotation: (${transformedX}, ${transformedY})`);
    }
    
    // Trasladar a la posición final del objeto en el canvas
    const finalX = transformedX + (originalObj.left || 0);
    const finalY = transformedY + (originalObj.top || 0);
    
    console.log(`Final coords: (${finalX}, ${finalY})`);
    
    return {
      x: finalX,
      y: finalY,
    };
  }

  private getPointColor(pointType: 'anchor' | 'control1' | 'control2'): string {
    switch (pointType) {
      case 'anchor':
        return '#fff';
      case 'control1':
        return '#ffe7e7';
      case 'control2':
        return '#ffe7e7';
      default:
        return '#fff';
    }
  }

  selectEditablePoint(pointId: string): void {
    const point = this.state.editablePoints.find((p) => p.id === pointId);
    if (!point) return;

    // Update selection state
    const prevSelected = this.state.selectedPoint;
    this.state.selectedPoint = pointId;

    // Update visual appearance of point objects
    this.state.pointObjects.forEach((obj) => {
      const objPointId = (obj as any).editablePointId;
      const isSelected = objPointId === pointId;
      const wasSelected = objPointId === prevSelected;

      if (isSelected || wasSelected) {
        obj.set({
          strokeWidth: isSelected ? 3 : 2,
          stroke: isSelected ? '#1890ff' : point.type === 'anchor' ? '#1890ff' : '#ff7875',
        });
      }
    });

    this.canvas.renderAll();

    this.editor.emit('editablePointSelected', { point, pointId });
  }

  moveEditablePoint(pointId: string, newX: number, newY: number): void {
    const point = this.state.editablePoints.find((p) => p.id === pointId);
    if (!point) return;

    const oldX = point.x;
    const oldY = point.y;

    // Update point coordinates
    point.x = newX;
    point.y = newY;

    // Handle synchronized control points
    this.handleControlPointSynchronization(point, newX - oldX, newY - oldY);

    // Update the corresponding command in the sub-path
    this.updateCommandFromPoint(point);

    // Update path data and original object
    this.updateSubPathFromPoints(point.commandId);

    this.editor.emit('editablePointMoved', { point, oldX, oldY, newX, newY });
  }

  private handlePointMove(pointId: string, canvasX: number, canvasY: number): void {
    const originalObj = this.state.originalObject;
    if (!originalObj) return;

    // Convert canvas coordinates back to path coordinates
    const pathCoords = this.inverseTransformPointCoordinates(canvasX, canvasY, originalObj);

    this.moveEditablePoint(pointId, pathCoords.x, pathCoords.y);
  }

  private inverseTransformPointCoordinates(
    x: number,
    y: number,
    originalObj: fabric.Path
  ): { x: number; y: number } {
    // ENFOQUE SIMPLE INVERSO: de coordenadas del canvas a coordenadas del path
    console.log(`INVERSE TRANSFORM: Canvas coords: (${x}, ${y})`);

    // Paso 1: Quitar la traslación del objeto
    let localX = x - (originalObj.left || 0);
    let localY = y - (originalObj.top || 0);

    console.log(`After removing translation: (${localX}, ${localY})`);

    // Paso 2: Quitar rotación si existe
    const angle = originalObj.angle || 0;
    if (angle !== 0) {
      const rad = fabric.util.degreesToRadians(-angle); // ángulo negativo para inversión
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const unrotatedX = localX * cos - localY * sin;
      const unrotatedY = localX * sin + localY * cos;

      localX = unrotatedX;
      localY = unrotatedY;

      console.log(`After removing rotation: (${localX}, ${localY})`);
    }

    // Paso 3: Quitar escala
    const scaleX = originalObj.scaleX || 1;
    const scaleY = originalObj.scaleY || 1;

    localX = localX / scaleX;
    localY = localY / scaleY;

    console.log(`After removing scaling: (${localX}, ${localY})`);

    // Paso 4: Convertir de coordenadas relativas al centro a coordenadas absolutas del path
    const objWidth = originalObj.width || 0;
    const objHeight = originalObj.height || 0;

    const pathX = localX + objWidth / 2;
    const pathY = localY + objHeight / 2;

    console.log(`Final path coords: (${pathX}, ${pathY})`);

    return {
      x: pathX,
      y: pathY,
    };
  }

  private handleControlPointSynchronization(
    movedPoint: EditablePoint,
    deltaX: number,
    deltaY: number
  ): void {
    if (movedPoint.type === 'anchor') {
      // When anchor moves, move all attached control points
      const relatedPoints = this.state.editablePoints.filter(
        (p) => p.commandId === movedPoint.commandId && p.type !== 'anchor'
      );

      relatedPoints.forEach((controlPoint) => {
        controlPoint.x += deltaX;
        controlPoint.y += deltaY;
        this.updatePointObjectPosition(controlPoint);
      });
    } else {
      // Handle synchronized control point pairs (Figma-style)
      const controlPair = this.state.controlPointPairs.find(
        (pair) =>
          (pair.point1Id === movedPoint.id || pair.point2Id === movedPoint.id) &&
          pair.isSynchronized
      );

      if (controlPair) {
        const otherPointId =
          controlPair.point1Id === movedPoint.id ? controlPair.point2Id : controlPair.point1Id;
        const otherPoint = this.state.editablePoints.find((p) => p.id === otherPointId);
        const anchorPoint = this.state.editablePoints.find(
          (p) => p.id === controlPair.anchorPointId
        );

        if (otherPoint && anchorPoint) {
          // Calculate symmetric position for the other control point
          const anchorX = anchorPoint.x;
          const anchorY = anchorPoint.y;

          // Vector from anchor to moved point
          const movedVectorX = movedPoint.x - anchorX;
          const movedVectorY = movedPoint.y - anchorY;

          // Place other point in opposite direction with same distance
          otherPoint.x = anchorX - movedVectorX;
          otherPoint.y = anchorY - movedVectorY;

          this.updatePointObjectPosition(otherPoint);
          this.updateCommandFromPoint(otherPoint);
        }
      }
    }
  }

  private updatePointObjectPosition(point: EditablePoint): void {
    const originalObj = this.state.originalObject;
    if (!originalObj) return;

    const pointObj = this.state.pointObjects.find(
      (obj) => (obj as any).editablePointId === point.id
    );

    if (pointObj) {
      const transformedCoords = this.transformPointCoordinates(point.x, point.y, originalObj);

      pointObj.set({
        left: transformedCoords.x,
        top: transformedCoords.y,
      });

      // Force render update for the specific point
      pointObj.setCoords();
    }

    this.canvas.renderAll();
  }

  private updateCommandFromPoint(point: EditablePoint): void {
    const subPath = this.state.subPaths.find((sp) =>
      sp.commands.some((cmd) => cmd.id === point.commandId)
    );

    if (!subPath) return;

    const command = subPath.commands[point.commandIndex];
    if (!command) return;

    // Update command coordinates based on point type and command type
    switch (command.type.toLowerCase()) {
      case 'm':
      case 'l':
        if (point.type === 'anchor') {
          command.coords[0] = point.x;
          command.coords[1] = point.y;
        }
        break;

      case 'c':
        if (point.type === 'control1') {
          command.coords[0] = point.x;
          command.coords[1] = point.y;
        } else if (point.type === 'control2') {
          command.coords[2] = point.x;
          command.coords[3] = point.y;
        } else if (point.type === 'anchor') {
          command.coords[4] = point.x;
          command.coords[5] = point.y;
        }
        break;

      case 's':
        if (point.type === 'control2') {
          command.coords[0] = point.x;
          command.coords[1] = point.y;
        } else if (point.type === 'anchor') {
          command.coords[2] = point.x;
          command.coords[3] = point.y;
        }
        break;

      case 'q':
        if (point.type === 'control1') {
          command.coords[0] = point.x;
          command.coords[1] = point.y;
        } else if (point.type === 'anchor') {
          command.coords[2] = point.x;
          command.coords[3] = point.y;
        }
        break;

      case 'h':
        if (point.type === 'anchor') {
          command.coords[0] = point.x;
        }
        break;

      case 'v':
        if (point.type === 'anchor') {
          command.coords[0] = point.y;
        }
        break;
    }
  }

  private updateSubPathFromPoints(commandId: string): void {
    const subPath = this.state.subPaths.find((sp) =>
      sp.commands.some((cmd) => cmd.id === commandId)
    );

    if (!subPath) return;

    // Regenerate path data string from updated commands
    subPath.pathData = this.commandsToPathData(subPath.commands);

    // Recalculate stats and bounds
    subPath.stats = this.calculateSubPathStats(subPath.pathData);
    subPath.bounds = this.calculateSubPathBounds(subPath.pathData, this.state.originalObject!);

    // Update original object path
    this.updateOriginalObjectPath();

    // Update highlight if this sub-path is selected
    if (this.state.selectedSubPath === subPath.id) {
      this.highlightSubPath(subPath.id, 1);
    }
  }

  private commandsToPathData(commands: PathCommand[]): string {
    return commands
      .map((cmd) => {
        if (cmd.coords.length === 0) {
          return cmd.type;
        }
        return `${cmd.type}${cmd.coords.join(' ')}`;
      })
      .join(' ');
  }

  updateControlPointPair(pairId: string, isSynchronized: boolean): void {
    // This method allows toggling synchronization of control point pairs
    const pair = this.state.controlPointPairs.find((p) => `${p.point1Id}_${p.point2Id}` === pairId);

    if (pair) {
      pair.isSynchronized = isSynchronized;
      this.editor.emit('controlPointPairUpdated', { pair, isSynchronized });
    }
  }

  destroy(): void {
    this.canvas.off('selection:created', this.handleSelection);
    this.canvas.off('selection:updated', this.handleSelection);
    this.canvas.off('selection:cleared', this.handleSelectionCleared);
    this.canvas.off('object:modified', this.handleObjectModified);
    this.canvas.off('object:scaling', this.handleObjectTransform);
    this.canvas.off('object:rotating', this.handleObjectTransform);
    this.canvas.off('object:moving', this.handleObjectTransform);
    this.clearState();
  }
}
