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

const calculatePathStats = (commands, activeObject) => {
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

  if (activeObject && typeof activeObject.getTotalLength === 'function') {
    try {
      stats.pathLength = activeObject.getTotalLength();
    } catch (e) {
      const bounds = activeObject.getBoundingRect();
      stats.pathLength = (bounds.width + bounds.height) * 2;
    }
  }

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
    pathStats.value = calculatePathStats(pathCommands.value, activeObject);
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
