<template>
  <div class="box attr-item-box" v-if="isOne && isPathType">
    <Divider plain orientation="left">
      <h4>{{ $t('pathData.title') }}</h4>
    </Divider>

    <div class="path-commands-container">
      <div class="path-commands-header">
        <span class="command-type-label">{{ $t('pathData.commandType') }}</span>
        <span class="coordinates-label">{{ $t('pathData.coordinates') }}</span>
      </div>

      <div class="path-commands-list">
        <div
          v-for="(command, index) in pathCommands"
          :key="index"
          class="path-command-item"
          :class="{ 'control-point': command.isControlPoint }"
        >
          <div class="command-type">
            <Badge :color="getCommandColor(command.type)" :text="command.type" />
          </div>
          <div class="command-coords">
            <span v-if="command.coords.length > 0">
              {{ formatCoordinates(command.coords) }}
            </span>
            <span v-else class="no-coords">{{ $t('pathData.noCoordinates') }}</span>
          </div>
          <div class="command-description">
            <Tooltip :content="getCommandDescription(command.type)" placement="left">
              <Icon type="ios-information-circle-outline" size="14" />
            </Tooltip>
          </div>
        </div>
      </div>

      <div class="path-stats" v-if="pathStats">
        <Row :gutter="10">
          <Col span="12">
            <div class="stat-item">
              <span class="stat-label">{{ $t('pathData.totalCommands') }}:</span>
              <span class="stat-value">{{ pathStats.totalCommands }}</span>
            </div>
          </Col>
          <Col span="12">
            <div class="stat-item">
              <span class="stat-label">{{ $t('pathData.totalPoints') }}:</span>
              <span class="stat-value">{{ pathStats.totalPoints }}</span>
            </div>
          </Col>
        </Row>
        <Row :gutter="10">
          <Col span="12">
            <div class="stat-item">
              <span class="stat-label">{{ $t('pathData.isClosed') }}:</span>
              <span class="stat-value">{{ pathStats.isClosed ? $t('yes') : $t('no') }}</span>
            </div>
          </Col>
          <Col span="12">
            <div class="stat-item">
              <span class="stat-label">{{ $t('pathData.length') }}:</span>
              <span class="stat-value">{{ Math.round(pathStats.pathLength) }}px</span>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  </div>
</template>

<script setup name="AttributePathData">
import useSelect from '@/hooks/select';

const update = getCurrentInstance();
const { canvasEditor, isOne } = useSelect();

const pathCommands = ref([]);
const pathStats = ref(null);
const isPathType = ref(false);

const checkIsPathType = (activeObject) => {
  if (!activeObject) {
    isPathType.value = false;
    return false;
  }

  const objType = activeObject.type;
  const hasPathData = activeObject.path || activeObject._path || activeObject.pathData;

  isPathType.value = objType === 'path' || objType === 'Path' || hasPathData;
  return isPathType.value;
};

const parsePathData = (pathDataString) => {
  if (!pathDataString) return [];

  const commands = [];
  const pathString = typeof pathDataString === 'string' ? pathDataString : '';

  const commandRegex =
    /([MmLlHhVvCcSsQqTtAaZz])((?:\s*[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?\s*,?\s*)*)/g;

  let match;
  while ((match = commandRegex.exec(pathString)) !== null) {
    const type = match[1];
    const coordString = match[2].trim();

    let coords = [];
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
};

const parseFabricPath = (pathArray) => {
  if (!Array.isArray(pathArray)) return [];

  const commands = [];

  pathArray.forEach((segment) => {
    if (Array.isArray(segment) && segment.length > 0) {
      const type = segment[0];
      const coords = segment.slice(1);

      commands.push({
        type,
        coords,
        isControlPoint: ['C', 'c', 'S', 's', 'Q', 'q', 'T', 't'].includes(type),
      });
    }
  });

  return commands;
};

const calculateActualPathLength = (commands) => {
  if (!commands || commands.length === 0) return 0;

  let totalLength = 0;
  let currentX = 0;
  let currentY = 0;
  let pathStartX = 0;
  let pathStartY = 0;

  const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  const approximateCubicBezierLength = (x1, y1, cx1, cy1, cx2, cy2, x2, y2, segments = 20) => {
    let length = 0;
    let prevX = x1;
    let prevY = y1;

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      const x = mt3 * x1 + 3 * mt2 * t * cx1 + 3 * mt * t2 * cx2 + t3 * x2;
      const y = mt3 * y1 + 3 * mt2 * t * cy1 + 3 * mt * t2 * cy2 + t3 * y2;

      length += distance(prevX, prevY, x, y);
      prevX = x;
      prevY = y;
    }

    return length;
  };

  const approximateQuadraticBezierLength = (x1, y1, cx, cy, x2, y2, segments = 15) => {
    let length = 0;
    let prevX = x1;
    let prevY = y1;

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const t2 = t * t;
      const mt = 1 - t;
      const mt2 = mt * mt;

      const x = mt2 * x1 + 2 * mt * t * cx + t2 * x2;
      const y = mt2 * y1 + 2 * mt * t * cy + t2 * y2;

      length += distance(prevX, prevY, x, y);
      prevX = x;
      prevY = y;
    }

    return length;
  };

  commands.forEach((command) => {
    const { type, coords } = command;
    const isRelative = type === type.toLowerCase();

    switch (type.toLowerCase()) {
      case 'm': // Move to
        if (coords.length >= 2) {
          if (isRelative) {
            currentX += coords[0];
            currentY += coords[1];
          } else {
            currentX = coords[0];
            currentY = coords[1];
          }
          pathStartX = currentX;
          pathStartY = currentY;
        }
        break;

      case 'l': // Line to
        if (coords.length >= 2) {
          const targetX = isRelative ? currentX + coords[0] : coords[0];
          const targetY = isRelative ? currentY + coords[1] : coords[1];
          totalLength += distance(currentX, currentY, targetX, targetY);
          currentX = targetX;
          currentY = targetY;
        }
        break;

      case 'h': // Horizontal line
        if (coords.length >= 1) {
          const targetX = isRelative ? currentX + coords[0] : coords[0];
          totalLength += Math.abs(targetX - currentX);
          currentX = targetX;
        }
        break;

      case 'v': // Vertical line
        if (coords.length >= 1) {
          const targetY = isRelative ? currentY + coords[0] : coords[0];
          totalLength += Math.abs(targetY - currentY);
          currentY = targetY;
        }
        break;

      case 'c': // Cubic Bezier curve
        if (coords.length >= 6) {
          const cx1 = isRelative ? currentX + coords[0] : coords[0];
          const cy1 = isRelative ? currentY + coords[1] : coords[1];
          const cx2 = isRelative ? currentX + coords[2] : coords[2];
          const cy2 = isRelative ? currentY + coords[3] : coords[3];
          const x2 = isRelative ? currentX + coords[4] : coords[4];
          const y2 = isRelative ? currentY + coords[5] : coords[5];

          totalLength += approximateCubicBezierLength(
            currentX,
            currentY,
            cx1,
            cy1,
            cx2,
            cy2,
            x2,
            y2
          );
          currentX = x2;
          currentY = y2;
        }
        break;

      case 's': // Smooth cubic Bezier curve
        if (coords.length >= 4) {
          const cx2 = isRelative ? currentX + coords[0] : coords[0];
          const cy2 = isRelative ? currentY + coords[1] : coords[1];
          const x2 = isRelative ? currentX + coords[2] : coords[2];
          const y2 = isRelative ? currentY + coords[3] : coords[3];

          // For S command, we need to reflect the previous control point
          // For simplicity, we'll approximate it as a cubic curve
          totalLength += approximateCubicBezierLength(
            currentX,
            currentY,
            currentX,
            currentY,
            cx2,
            cy2,
            x2,
            y2
          );
          currentX = x2;
          currentY = y2;
        }
        break;

      case 'q': // Quadratic Bezier curve
        if (coords.length >= 4) {
          const cx = isRelative ? currentX + coords[0] : coords[0];
          const cy = isRelative ? currentY + coords[1] : coords[1];
          const x2 = isRelative ? currentX + coords[2] : coords[2];
          const y2 = isRelative ? currentY + coords[3] : coords[3];

          totalLength += approximateQuadraticBezierLength(currentX, currentY, cx, cy, x2, y2);
          currentX = x2;
          currentY = y2;
        }
        break;

      case 't': // Smooth quadratic Bezier curve
        if (coords.length >= 2) {
          const x2 = isRelative ? currentX + coords[0] : coords[0];
          const y2 = isRelative ? currentY + coords[1] : coords[1];

          // For T command, we approximate as a straight line for simplicity
          totalLength += distance(currentX, currentY, x2, y2);
          currentX = x2;
          currentY = y2;
        }
        break;

      case 'a': // Elliptical arc
        if (coords.length >= 7) {
          const x2 = isRelative ? currentX + coords[5] : coords[5];
          const y2 = isRelative ? currentY + coords[6] : coords[6];

          // For arc approximation, we'll use the chord length as a simple estimate
          // This is not perfectly accurate but provides a reasonable approximation
          totalLength += distance(currentX, currentY, x2, y2);
          currentX = x2;
          currentY = y2;
        }
        break;

      case 'z': // Close path
        totalLength += distance(currentX, currentY, pathStartX, pathStartY);
        currentX = pathStartX;
        currentY = pathStartY;
        break;
    }
  });

  return totalLength;
};

const calculatePathStats = (commands) => {
  const stats = {
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

  // Calculate actual path length by iterating through commands
  stats.pathLength = calculateActualPathLength(commands);

  return stats;
};

const getCommandColor = (type) => {
  const colorMap = {
    M: 'success',
    m: 'success',
    L: 'primary',
    l: 'primary',
    H: 'primary',
    h: 'primary',
    V: 'primary',
    v: 'primary',
    C: 'warning',
    c: 'warning',
    S: 'warning',
    s: 'warning',
    Q: 'orange',
    q: 'orange',
    T: 'orange',
    t: 'orange',
    A: 'purple',
    a: 'purple',
    Z: 'error',
    z: 'error',
  };

  return colorMap[type] || 'default';
};

const getCommandDescription = (type) => {
  const descriptions = {
    M: 'Move to (absolute)',
    m: 'Move to (relative)',
    L: 'Line to (absolute)',
    l: 'Line to (relative)',
    H: 'Horizontal line to (absolute)',
    h: 'Horizontal line to (relative)',
    V: 'Vertical line to (absolute)',
    v: 'Vertical line to (relative)',
    C: 'Cubic Bézier curve (absolute)',
    c: 'Cubic Bézier curve (relative)',
    S: 'Smooth cubic Bézier curve (absolute)',
    s: 'Smooth cubic Bézier curve (relative)',
    Q: 'Quadratic Bézier curve (absolute)',
    q: 'Quadratic Bézier curve (relative)',
    T: 'Smooth quadratic Bézier curve (absolute)',
    t: 'Smooth quadratic Bézier curve (relative)',
    A: 'Elliptical arc (absolute)',
    a: 'Elliptical arc (relative)',
    Z: 'Close path',
    z: 'Close path',
  };

  return descriptions[type] || 'Unknown command';
};

const formatCoordinates = (coords) => {
  if (!coords || coords.length === 0) return '';

  const formatted = coords.map((coord) => (typeof coord === 'number' ? coord.toFixed(1) : coord));

  const pairs = [];
  for (let i = 0; i < formatted.length; i += 2) {
    if (i + 1 < formatted.length) {
      pairs.push(`(${formatted[i]}, ${formatted[i + 1]})`);
    } else {
      pairs.push(formatted[i]);
    }
  }

  return pairs.join(' ');
};

const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject();

  if (e && e.target && e.target !== activeObject) return;

  if (!checkIsPathType(activeObject)) {
    pathCommands.value = [];
    pathStats.value = null;
    return;
  }

  if (activeObject.path) {
    pathCommands.value = parseFabricPath(activeObject.path);
  } else if (activeObject._path) {
    pathCommands.value = parseFabricPath(activeObject._path);
  } else if (activeObject.pathData) {
    pathCommands.value = parsePathData(activeObject.pathData);
  } else if (activeObject.getSvgSrc && typeof activeObject.getSvgSrc === 'function') {
    try {
      const svgSrc = activeObject.getSvgSrc();
      const pathMatch = svgSrc.match(/\sd="([^"]+)"/);
      if (pathMatch) {
        pathCommands.value = parsePathData(pathMatch[1]);
      }
    } catch (e) {
      console.warn('Could not extract path data from SVG source:', e);
      pathCommands.value = [];
    }
  } else {
    pathCommands.value = [];
  }

  if (pathCommands.value.length > 0) {
    pathStats.value = calculatePathStats(pathCommands.value);
  } else {
    pathStats.value = null;
  }
};

const selectCancel = () => {
  isPathType.value = false;
  pathCommands.value = [];
  pathStats.value = null;
  update?.proxy?.$forceUpdate();
};

onMounted(() => {
  getObjectAttr();
  canvasEditor.on('selectCancel', selectCancel);
  canvasEditor.on('selectOne', getObjectAttr);
  canvasEditor.canvas.on('object:modified', getObjectAttr);
});

onBeforeUnmount(() => {
  canvasEditor.off('selectCancel', selectCancel);
  canvasEditor.off('selectOne', getObjectAttr);
  canvasEditor.canvas.off('object:modified', getObjectAttr);
});
</script>

<style scoped lang="less">
.path-commands-container {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
}

.path-commands-header {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e1e5e9;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
}

.path-commands-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.path-command-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &.control-point {
    background-color: #fff3cd;
    border-radius: 3px;
    padding: 6px 4px;
    margin: 2px 0;
  }
}

.command-type {
  width: 60px;
  flex-shrink: 0;
}

.command-coords {
  flex: 1;
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #495057;
  padding: 0 8px;

  .no-coords {
    color: #adb5bd;
    font-style: italic;
  }
}

.command-description {
  width: 20px;
  flex-shrink: 0;
  text-align: center;
}

.path-stats {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 8px;

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 0;
    font-size: 12px;

    .stat-label {
      color: #6c757d;
    }

    .stat-value {
      font-weight: 600;
      color: #495057;
    }
  }
}

:deep(.ivu-badge) {
  font-size: 10px;
  line-height: 16px;
  padding: 2px 6px;
}

.path-commands-list::-webkit-scrollbar {
  width: 4px;
}

.path-commands-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.path-commands-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.path-commands-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
