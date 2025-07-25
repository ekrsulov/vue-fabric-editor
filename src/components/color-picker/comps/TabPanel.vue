<template>
  <div class="tab-panel" :style="rootStyle">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'TabPanel',
};
</script>

<script setup>
import { computed, getCurrentInstance, ref, nextTick, onMounted } from 'vue';

const vm = getCurrentInstance();

// Safely register with parent tabs component
onMounted(async () => {
  await nextTick();
  try {
    if (vm.parent && vm.parent.exposed && vm.parent.exposed.tabs) {
      vm.parent.exposed.tabs.value.push(vm);
    }
  } catch (error) {
    console.warn('Failed to register tab panel with parent:', error);
  }
});

defineProps({
  // Tabs 会用到 label
  label: {
    type: String,
    required: true,
  },
});

const active = ref(false);
const rootStyle = computed(() => ({
  display: active.value ? 'block' : 'none',
}));

function changeActive(value) {
  active.value = value;
}

defineExpose({
  changeActive,
});
</script>
