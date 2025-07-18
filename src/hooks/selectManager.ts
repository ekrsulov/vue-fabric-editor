/*
 * @Author: GitHub Copilot
 * @Date: 2025-07-18
 * @Description: Gestor centralizado de eventos de selección para evitar memory leaks
 */

import { reactive } from 'vue';
import Editor, { EventType } from '@kuaitu/core';

const { SelectMode, SelectEvent } = EventType;

// Estado global compartido
const globalSelectState = reactive({
  mSelectMode: SelectMode.EMPTY,
  mSelectOneType: '',
  mSelectId: '' as any,
  mSelectIds: [] as any,
  mSelectActive: [] as fabric.Object[],
});

// Gestor de callbacks
const callbackManager = {
  callbacks: new Set<() => void>(),

  add(callback: () => void) {
    this.callbacks.add(callback);
  },

  remove(callback: () => void) {
    this.callbacks.delete(callback);
  },

  execute() {
    this.callbacks.forEach((callback) => callback());
  },
};

// Handlers de eventos únicos
const eventHandlers = {
  selectOne: (arr: fabric.Object[]) => {
    globalSelectState.mSelectMode = SelectMode.ONE;
    const [item] = arr;
    if (item) {
      globalSelectState.mSelectActive = [item];
      globalSelectState.mSelectId = item.id;
      globalSelectState.mSelectOneType = item.type;
      globalSelectState.mSelectIds = [item.id];
    }
    callbackManager.execute();
  },

  selectMulti: (arr: fabric.Object[]) => {
    globalSelectState.mSelectMode = SelectMode.MULTI;
    globalSelectState.mSelectId = '';
    globalSelectState.mSelectIds = arr.map((item) => item.id);
    callbackManager.execute();
  },

  selectCancel: () => {
    globalSelectState.mSelectId = '';
    globalSelectState.mSelectIds = [];
    globalSelectState.mSelectMode = SelectMode.EMPTY;
    globalSelectState.mSelectOneType = '';
    callbackManager.execute();
  },
};

// Gestor principal
class SelectManager {
  private static instance: SelectManager;
  private canvasEditor: Editor | null = null;
  private initialized = false;

  static getInstance() {
    if (!SelectManager.instance) {
      SelectManager.instance = new SelectManager();
    }
    return SelectManager.instance;
  }

  init(canvasEditor: Editor) {
    if (this.initialized || !canvasEditor) return;

    this.canvasEditor = canvasEditor;

    // Aumentar límite de listeners si es necesario
    if (canvasEditor.setMaxListeners) {
      canvasEditor.setMaxListeners(50);
    }

    // Registrar handlers únicos
    canvasEditor.on(SelectEvent.ONE, eventHandlers.selectOne);
    canvasEditor.on(SelectEvent.MULTI, eventHandlers.selectMulti);
    canvasEditor.on(SelectEvent.CANCEL, eventHandlers.selectCancel);

    this.initialized = true;
  }

  destroy() {
    if (!this.canvasEditor || !this.initialized) return;

    this.canvasEditor.off(SelectEvent.ONE, eventHandlers.selectOne);
    this.canvasEditor.off(SelectEvent.MULTI, eventHandlers.selectMulti);
    this.canvasEditor.off(SelectEvent.CANCEL, eventHandlers.selectCancel);

    this.canvasEditor = null;
    this.initialized = false;
    callbackManager.callbacks.clear();
  }

  getState() {
    return globalSelectState;
  }

  addCallback(callback: () => void) {
    callbackManager.add(callback);
  }

  removeCallback(callback: () => void) {
    callbackManager.remove(callback);
  }
}

export default SelectManager;
