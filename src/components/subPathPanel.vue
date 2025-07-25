<template>
  <div class="box" v-if="subPaths.length > 0">
    <Divider plain orientation="left">
      <h4>{{ $t('subPaths.title') }}</h4>
    </Divider>

    <div class="sub-path-header">
      <div class="header-info">
        <span class="total-count">{{ $t('subPaths.totalFound', { count: subPaths.length }) }}</span>
      </div>
      <div class="highlight-controls">
        <div class="stroke-width-control">
          <span class="control-label">Grosor:</span>
          <Slider
            v-model="state.highlightStrokeWidth"
            :min="1"
            :max="10"
            :step="0.5"
            show-tooltip="always"
            style="width: 80px; margin: 0 8px"
            @on-change="updateStrokeWidth"
          />
          <span class="control-value">{{ state.highlightStrokeWidth }}px</span>
        </div>
      </div>
    </div>

    <div class="sub-path-list">
      <div
        v-for="subPath in subPaths"
        :key="subPath.id"
        class="sub-path-item"
        :class="{
          active: selectedSubPath === subPath.id,
        }"
        @click="selectSubPath(subPath.id)"
      >
        <div class="sub-path-header-item">
          <div class="sub-path-index">
            <Badge :color="getSubPathColor(subPath.color)" :text="`${subPath.index}`" />
          </div>
          <div class="sub-path-preview">
            <svg
              class="preview-svg"
              :viewBox="getSubPathViewBox(subPath)"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                :d="subPath.pathData"
                stroke="#1890ff"
                stroke-width="1"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div class="sub-path-title">
            <span class="title-text">
              {{ $t('subPaths.subPathTitle', { index: subPath.index }) }}
            </span>
            <div class="sub-path-stats-mini">
              <span class="stat-mini">
                {{ subPath.stats.totalCommands }}{{ $t('subPaths.commands') }}
              </span>
              <span class="stat-mini">
                {{ subPath.stats.totalPoints }}{{ $t('subPaths.points') }}
              </span>
            </div>
          </div>
          <div class="sub-path-joystick">
            <div class="joystick-container">
              <button
                class="joystick-btn joystick-up"
                @click.stop.prevent="moveSubPath(subPath.id, 0, -1)"
                @mousedown.stop.prevent
                title="Mover arriba"
              >
                <Icon type="ios-arrow-up" />
              </button>
              <div class="joystick-middle">
                <button
                  class="joystick-btn joystick-left"
                  @click.stop.prevent="moveSubPath(subPath.id, -1, 0)"
                  @mousedown.stop.prevent
                  title="Mover izquierda"
                >
                  <Icon type="ios-arrow-back" />
                </button>
                <button
                  class="joystick-btn joystick-right"
                  @click.stop.prevent="moveSubPath(subPath.id, 1, 0)"
                  @mousedown.stop.prevent
                  title="Mover derecha"
                >
                  <Icon type="ios-arrow-forward" />
                </button>
              </div>
              <button
                class="joystick-btn joystick-down"
                @click.stop.prevent="moveSubPath(subPath.id, 0, 1)"
                @mousedown.stop.prevent
                title="Mover abajo"
              >
                <Icon type="ios-arrow-down" />
              </button>
            </div>
          </div>
        </div>

        <div class="sub-path-details" v-if="selectedSubPath === subPath.id">
          <div class="detail-stats">
            <Row :gutter="8">
              <Col span="12">
                <div class="detail-stat">
                  <span class="stat-label">{{ $t('subPaths.commands') }}:</span>
                  <span class="stat-value">{{ subPath.stats.totalCommands }}</span>
                </div>
              </Col>
              <Col span="12">
                <div class="detail-stat">
                  <span class="stat-label">{{ $t('subPaths.points') }}:</span>
                  <span class="stat-value">{{ subPath.stats.totalPoints }}</span>
                </div>
              </Col>
            </Row>
            <Row :gutter="8">
              <Col span="12">
                <div class="detail-stat">
                  <span class="stat-label">{{ $t('subPaths.closed') }}:</span>
                  <span class="stat-value">
                    {{ subPath.stats.isClosed ? $t('yes') : $t('no') }}
                  </span>
                </div>
              </Col>
              <Col span="12">
                <div class="detail-stat">
                  <span class="stat-label">{{ $t('subPaths.length') }}:</span>
                  <span class="stat-value">{{ Math.round(subPath.stats.pathLength) }}px</span>
                </div>
              </Col>
            </Row>
          </div>

          <div class="detail-path-preview">
            <div class="path-preview-header">
              <span class="preview-label">{{ $t('subPaths.pathData') }}:</span>
              <Button
                type="text"
                size="small"
                @click="copyPathData(subPath.pathData)"
                icon="md-copy"
              >
                {{ $t('copy') }}
              </Button>
            </div>
            <div class="path-data-preview">
              <code>{{ truncatePathData(subPath.pathData) }}</code>
            </div>
          </div>

          <div class="detail-actions">
            <ButtonGroup size="small">
              <Button @click="exportSubPath(subPath)" icon="md-download">
                {{ $t('export') }}
              </Button>
              <Button @click="duplicateSubPath(subPath)" icon="md-copy">
                {{ $t('duplicate') }}
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="SubPathPanel">
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { fabric } from 'fabric';
import useSelect from '@/hooks/select';

interface SubPath {
  id: string;
  index: number;
  pathData: string;
  commands: any[];
  stats: {
    totalCommands: number;
    totalPoints: number;
    isClosed: boolean;
    pathLength: number;
  };
  bounds: { left: number; top: number; width: number; height: number };
  isHighlighted: boolean;
  color: string;
}

const { canvasEditor } = useSelect();

const state = reactive({
  subPaths: [] as SubPath[],
  selectedSubPath: null as string | null,
  isVisible: false,
  originalObject: null as any,
  highlightStrokeWidth: 1,
});

const subPaths = computed(() => state.subPaths);
const selectedSubPath = computed(() => state.selectedSubPath);

const selectSubPath = (subPathId: string) => {
  if (state.selectedSubPath === subPathId) {
    state.selectedSubPath = null;
    canvasEditor.clearHighlights();
  } else {
    state.selectedSubPath = subPathId;
    canvasEditor.selectSubPath(subPathId, state.highlightStrokeWidth);
  }
};

// Handle stroke width changes
const updateStrokeWidth = (newWidth: number) => {
  state.highlightStrokeWidth = newWidth;

  // If there's a selected sub-path, update its highlight with the new width
  if (state.selectedSubPath) {
    canvasEditor.selectSubPath(state.selectedSubPath, newWidth);
  }
};

// Move sub-path by specified offset
const moveSubPath = (subPathId: string, offsetX: number, offsetY: number) => {
  canvasEditor.moveSubPath(subPathId, offsetX, offsetY);
};

const getSubPathColor = (color: string) => {
  // Convert hex color to ViewUI color name or return custom color
  const colorMap: Record<string, string> = {
    '#FF6B6B': 'error',
    '#4ECDC4': 'success',
    '#45B7D1': 'primary',
    '#96CEB4': 'success',
    '#FECA57': 'warning',
  };
  return colorMap[color] || 'default';
};

// Calculate viewBox for SVG preview of sub-path
const getSubPathViewBox = (subPath: SubPath) => {
  try {
    // Parse the path data to get bounds
    const bounds = calculatePathBounds(subPath.pathData);

    if (!bounds || bounds.width === 0 || bounds.height === 0) {
      return '0 0 100 100'; // fallback viewBox
    }

    // Add some padding around the path
    const padding = Math.max(bounds.width, bounds.height) * 0.1;
    const x = bounds.minX - padding;
    const y = bounds.minY - padding;
    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;

    return `${x} ${y} ${width} ${height}`;
  } catch (error) {
    console.warn('Error calculating viewBox for sub-path:', error);
    return '0 0 100 100'; // fallback viewBox
  }
};

// Calculate bounding box for a path data string
const calculatePathBounds = (pathData: string) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let currentX = 0;
  let currentY = 0;

  const commandRegex =
    /([MmLlHhVvCcSsQqTtAaZz])((?:\s*[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?\s*,?\s*)*)/g;

  let match;
  while ((match = commandRegex.exec(pathData)) !== null) {
    const command = match[1];
    const coordString = match[2].trim();

    let coords: number[] = [];
    if (coordString) {
      coords = coordString
        .split(/[\s,]+/)
        .filter((s) => s !== '')
        .map(Number);
    }

    const isRelative = command === command.toLowerCase();

    switch (command.toLowerCase()) {
      case 'm':
        if (coords.length >= 2) {
          if (isRelative) {
            currentX += coords[0];
            currentY += coords[1];
          } else {
            currentX = coords[0];
            currentY = coords[1];
          }
          updateBounds(currentX, currentY);
        }
        break;

      case 'l':
        if (coords.length >= 2) {
          for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              if (isRelative) {
                currentX += coords[i];
                currentY += coords[i + 1];
              } else {
                currentX = coords[i];
                currentY = coords[i + 1];
              }
              updateBounds(currentX, currentY);
            }
          }
        }
        break;

      case 'h':
        if (coords.length >= 1) {
          for (const coord of coords) {
            if (isRelative) {
              currentX += coord;
            } else {
              currentX = coord;
            }
            updateBounds(currentX, currentY);
          }
        }
        break;

      case 'v':
        if (coords.length >= 1) {
          for (const coord of coords) {
            if (isRelative) {
              currentY += coord;
            } else {
              currentY = coord;
            }
            updateBounds(currentX, currentY);
          }
        }
        break;

      case 'c':
        if (coords.length >= 6) {
          for (let i = 0; i < coords.length; i += 6) {
            if (i + 5 < coords.length) {
              // For curves, we should ideally check control points too, but for simplicity
              // we'll just check the end point
              if (isRelative) {
                currentX += coords[i + 4];
                currentY += coords[i + 5];
              } else {
                currentX = coords[i + 4];
                currentY = coords[i + 5];
              }
              updateBounds(currentX, currentY);
            }
          }
        }
        break;
    }
  }

  function updateBounds(x: number, y: number) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (minX === Infinity || minY === Infinity) {
    return null;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

const truncatePathData = (pathData: string) => {
  if (pathData.length <= 50) return pathData;
  return pathData.substring(0, 50) + '...';
};

const copyPathData = (pathData: string) => {
  navigator.clipboard.writeText(pathData).then(() => {
    // Show toast notification
    console.log('Path data copied to clipboard');
  });
};

const exportSubPath = (subPath: SubPath) => {
  // Create SVG string for the sub-path
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path d="${subPath.pathData}" stroke="${subPath.color}" stroke-width="2" fill="none"/>
  </svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `subpath-${subPath.index}.svg`;
  link.click();
  URL.revokeObjectURL(url);
};

const duplicateSubPath = (subPath: SubPath) => {
  // Create a new path object from the sub-path
  try {
    fabric.loadSVGFromString(`<svg><path d="${subPath.pathData}"/></svg>`, (objects: any[]) => {
      if (objects && objects.length > 0) {
        const newPath = objects[0];
        const original = state.originalObject;

        if (original) {
          // Apply transformations from original object
          newPath.set({
            left: (original.left || 0) + 20,
            top: (original.top || 0) + 20,
            scaleX: original.scaleX,
            scaleY: original.scaleY,
            angle: original.angle,
            flipX: original.flipX,
            flipY: original.flipY,
            skewX: original.skewX,
            skewY: original.skewY,
            originX: original.originX,
            originY: original.originY,
            stroke: subPath.color,
            strokeWidth: 2,
            fill: 'transparent',
          });

          // Apply transformation matrix if it exists
          if (original.transformMatrix) {
            newPath.transformMatrix = [...original.transformMatrix];
          }
        } else {
          // Fallback if no original object
          newPath.set({
            left: (newPath.left || 0) + 20,
            top: (newPath.top || 0) + 20,
            stroke: subPath.color,
            strokeWidth: 2,
            fill: 'transparent',
          });
        }

        canvasEditor.canvas.add(newPath);
        canvasEditor.canvas.renderAll();
      }
    });
  } catch (error) {
    console.error('Error duplicating sub-path:', error);
  }
};

// Event handlers
const handleSubPathExtracted = (data: { subPaths: SubPath[]; originalObject: any }) => {
  state.subPaths = data.subPaths;
  state.originalObject = data.originalObject;
  state.isVisible = true;
};

const handleSubPathSelected = (data: { subPath: SubPath }) => {
  state.selectedSubPath = data.subPath.id;
};

const handleSubPathHighlighted = () => {
  // Highlighting is now handled automatically by selection
};

const handleSubPathCleared = () => {
  state.selectedSubPath = null;
};

const handleSelectionCleared = () => {
  state.subPaths = [];
  state.selectedSubPath = null;
  state.originalObject = null;
  state.isVisible = false;
};

const handleSubPathMoved = (data: { subPath: SubPath; offsetX: number; offsetY: number }) => {
  // Update the sub-path in our local state
  const index = state.subPaths.findIndex((sp) => sp.id === data.subPath.id);
  if (index !== -1) {
    state.subPaths[index] = { ...data.subPath };
  }
};

onMounted(() => {
  canvasEditor.on('subPathExtracted', handleSubPathExtracted);
  canvasEditor.on('subPathSelected', handleSubPathSelected);
  canvasEditor.on('subPathHighlighted', handleSubPathHighlighted);
  canvasEditor.on('subPathCleared', handleSubPathCleared);
  canvasEditor.on('subPathMoved', handleSubPathMoved);
  canvasEditor.on('selectCancel', handleSelectionCleared);
});

onBeforeUnmount(() => {
  canvasEditor.off('subPathExtracted', handleSubPathExtracted);
  canvasEditor.off('subPathSelected', handleSubPathSelected);
  canvasEditor.off('subPathHighlighted', handleSubPathHighlighted);
  canvasEditor.off('subPathCleared', handleSubPathCleared);
  canvasEditor.off('subPathMoved', handleSubPathMoved);
  canvasEditor.off('selectCancel', handleSelectionCleared);
});
</script>

<style scoped lang="less">
.sub-path-header {
  margin-bottom: 12px;

  .header-info {
    padding: 8px 0;
    margin-bottom: 8px;

    .total-count {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
  }

  .highlight-controls {
    padding: 8px 0;
    border-top: 1px solid #f0f0f0;

    .stroke-width-control {
      display: flex;
      align-items: center;
      font-size: 12px;

      .control-label {
        color: #666;
        font-weight: 500;
        margin-right: 8px;
      }

      .control-value {
        color: #333;
        font-weight: 500;
        min-width: 30px;
        text-align: center;
      }
    }
  }
}

.sub-path-list {
  max-height: 400px;
  overflow-y: auto;
}

.sub-path-item {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #d9d9d9;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: #1890ff;
    background-color: #f6ffed;
  }
}

.sub-path-header-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;

  .sub-path-index {
    margin-right: 10px;
    flex-shrink: 0;
  }

  .sub-path-preview {
    margin-right: 12px;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    padding: 4px;
    background: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;

    .preview-svg {
      width: 100%;
      height: 100%;
      max-width: 32px;
      max-height: 32px;
    }
  }

  .sub-path-title {
    flex: 1;

    .title-text {
      font-size: 13px;
      font-weight: 500;
      color: #333;
      display: block;
      margin-bottom: 4px;
    }

    .sub-path-stats-mini {
      display: flex;
      gap: 8px;

      .stat-mini {
        font-size: 11px;
        color: #999;
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 10px;
      }
    }
  }

  .sub-path-joystick {
    margin-left: 8px;
    flex-shrink: 0;

    .joystick-container {
      display: grid;
      grid-template-rows: 1fr 1fr 1fr;
      grid-template-columns: 1fr;
      gap: 1px;
      width: 24px;
      height: 60px;

      .joystick-btn {
        width: 24px;
        height: 18px;
        border: 1px solid #d9d9d9;
        background: #fff;
        border-radius: 3px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: #666;
        transition: all 0.2s ease;

        &:hover {
          background: #f0f0f0;
          border-color: #bfbfbf;
          color: #333;
        }

        &:active {
          background: #e6f7ff;
          border-color: #1890ff;
          color: #1890ff;
        }
      }

      .joystick-middle {
        display: flex;
        gap: 1px;

        .joystick-btn {
          width: 11px;
          height: 18px;
        }
      }

      .joystick-up,
      .joystick-down {
        justify-self: center;
      }
    }
  }
}

.sub-path-details {
  border-top: 1px solid #f0f0f0;
  padding: 12px;
  background: #fafafa;

  .detail-stats {
    margin-bottom: 12px;

    .detail-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 12px;

      .stat-label {
        color: #666;
      }

      .stat-value {
        font-weight: 500;
        color: #333;
      }
    }
  }

  .detail-path-preview {
    margin-bottom: 12px;

    .path-preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .preview-label {
        font-size: 12px;
        color: #666;
        font-weight: 500;
      }
    }

    .path-data-preview {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 4px;
      padding: 8px;

      code {
        font-size: 11px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        color: #666;
        word-break: break-all;
      }
    }
  }

  .detail-actions {
    text-align: center;
  }
}

// Scrollbar styling
.sub-path-list::-webkit-scrollbar {
  width: 4px;
}

.sub-path-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.sub-path-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.sub-path-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

:deep(.ivu-badge) {
  font-size: 10px;
  line-height: 16px;
  padding: 2px 6px;
}
</style>
