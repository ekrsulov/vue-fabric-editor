<!--
 * @Author: 秦少卫
 * @Date: 2024-05-21 09:53:33
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-10-07 17:33:27
 * @Description: file content
-->

<template>
  <div class="box attr-item-box" v-if="isOne">
    <!-- <h3>数据</h3> -->
    <Divider plain orientation="left">
      <h4>{{ $t('data') }}</h4>
    </Divider>

    <Form :label-width="40" class="form-wrap">
      <FormItem :label="$t('type')">
        <div class="readonly-field">{{ baseAttr.type }}</div>
      </FormItem>

      <FormItem>
        <div class="field-label">{{ $t('attributes.id') }}</div>
        <Input
          v-model="baseAttr.id"
          @on-change="changeCommon('id', baseAttr.id)"
          size="small"
        ></Input>
      </FormItem>
    </Form>

    <Row :gutter="10">
      <Col flex="1">
        <Select
          v-model="baseAttr.linkData[0]"
          filterable
          allow-create
          @on-change="changeCommon('linkData', baseAttr.linkData)"
        >
          <Option value="src"></Option>
          <Option value="text"></Option>
        </Select>
      </Col>
      <Col flex="1">
        <Input v-model="baseAttr.linkData[1]" :placeholder="$t('pleaseEnter')" />
      </Col>
    </Row>

    <!-- <Divider plain></Divider> -->
  </div>
</template>

<script setup name="AttrBute">
import useSelect from '@/hooks/select';

const update = getCurrentInstance();
const { canvasEditor, isOne } = useSelect();

// 属性值
const baseAttr = reactive({
  id: 0,
  type: '',
  linkData: ['', ''],
});

// 属性获取
const getObjectAttr = (e) => {
  const activeObject = canvasEditor.canvas.getActiveObject();
  // 不是当前obj，跳过
  if (e && e.target && e.target !== activeObject) return;
  if (activeObject) {
    baseAttr.id = activeObject.get('id');
    baseAttr.type = activeObject.type || activeObject.get('type') || '';
    baseAttr.linkData = activeObject.get('linkData') || ['', ''];
  }
};

// 通用属性改变
const changeCommon = (key, value) => {
  const activeObject = canvasEditor.canvas.getActiveObjects()[0];
  if (activeObject) {
    activeObject && activeObject.set(key, value);
    canvasEditor.canvas.renderAll();
  }
};

const selectCancel = () => {
  update?.proxy?.$forceUpdate();
};

onMounted(() => {
  // 获取字体数据
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
:deep(.ivu-input-number) {
  display: block;
  width: 100%;
}

.ivu-form-item {
  background: #f6f7f9;
  border-radius: 5px;
  padding: 0 5px;
  margin-bottom: 10px;
}

.ivu-row {
  margin-bottom: 10px;
}

.readonly-field {
  padding: 4px 8px;
  background: #f8f8f9;
  border: 1px solid #dcdee2;
  border-radius: 4px;
  color: #515a6e;
  font-size: 12px;
  min-height: 24px;
  display: flex;
  align-items: center;
}

.field-label {
  font-size: 12px;
  color: #515a6e;
  margin-bottom: 4px;
  font-weight: 500;
}
</style>
