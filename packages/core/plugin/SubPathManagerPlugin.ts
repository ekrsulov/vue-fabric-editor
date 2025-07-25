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
  ];
  static events = ['subPathExtracted', 'subPathSelected', 'subPathHighlighted', 'subPathCleared', 'subPathMoved', 'subPathDeleted'];

  private state: SubPathState = {
    subPaths: [],
    selectedSubPath: null,
    highlightVisible: true,
    originalObject: null,
    highlightObjects: [],
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

  highlightSubPath(subPathId: string, strokeWidth: number = 1): void {
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
    const commandRegex = /([MmLlHhVvCcSsQqTtAaZz])((?:\s*[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?\s*,?\s*)*)/g;

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

  selectSubPath(subPathId: string, strokeWidth: number = 1): void {
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
    const commandRegex = /([MmLlHhVvCcSsQqTtAaZz])((?:\s*[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?\s*,?\s*)*)/g;
    
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
                coords[i] += offsetX;     // x coordinate
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
                coords[i] += offsetX;     // x1
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
                coords[i] += offsetX;     // x2
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
      const completePath = this.state.subPaths.map(sp => sp.pathData).join(' ');
      
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
        angle: originalAngle
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
          isEmpty: true 
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
        isEmpty: false
      });

      console.log('Deleted sub-path:', deletedSubPath.index, 'Remaining:', this.state.subPaths.length);
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
    this.state.subPaths = [];
    this.state.originalObject = null;
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
