/*
 * @Author: GitHub Copilot
 * @Date: 2025-07-18
 * @Description: Hook de selección mejorado que evita memory leaks
 */

import { inject, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Editor from '@kuaitu/core';
import SelectManager from './selectManager';

export default function useSelectImproved(matchType?: Array<string>) {
  const { t } = useI18n();
  const fabric = inject('fabric');
  const canvasEditor = inject('canvasEditor') as Editor;

  const selectManager = SelectManager.getInstance();

  // Inicializar el manager si no está inicializado
  if (canvasEditor) {
    selectManager.init(canvasEditor);
  }

  const state = selectManager.getState();

  let callBack = () => {
    // Empty callback function
  };

  const getObjectAttr = (cb: any) => {
    callBack = cb;
    selectManager.addCallback(cb);
  };

  onMounted(() => {
    // El manager ya maneja los listeners, solo agregamos nuestro callback si existe
    if (callBack !== getObjectAttr) {
      selectManager.addCallback(callBack);
    }
  });
  onUnmounted(() => {
    // Solo removemos nuestro callback
    selectManager.removeCallback(callBack);
  });

  let isMatchType;
  if (matchType) {
    isMatchType = computed(() => matchType.includes(state.mSelectOneType));
  }

  const isOne = computed(() => state.mSelectMode === 'one');
  const isMultiple = computed(() => state.mSelectMode === 'multiple');
  const isGroup = computed(() => state.mSelectMode === 'one' && state.mSelectOneType === 'group');
  const isSelect = computed(() => state.mSelectMode);
  const selectType = computed(() => state.mSelectOneType);

  const matchTypeHander = (types: string[]) => {
    return computed(() => types.includes(state.mSelectOneType));
  };

  return {
    fabric,
    canvasEditor,
    mixinState: state,
    selectType,
    isSelect,
    isGroup,
    isOne,
    isMultiple,
    isMatchType,
    matchTypeHander,
    getObjectAttr,
    t,
  };
}
