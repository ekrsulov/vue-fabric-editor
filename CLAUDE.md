# Claude AI Agent Guidelines - Vue Fabric Editor

## Project Context

Vue Fabric Editor is an advanced graphic editor built with Vue 3, TypeScript and Fabric.js. As an AI agent working on this project, you need to understand the architecture, patterns and specific conventions to provide effective assistance.

## Critical Project Information

### Main Technologies
- **Vue 3** with Composition API (NO Options API)
- **TypeScript** in strict mode
- **Fabric.js** for canvas manipulation
- **Vite** as build tool
- **View UI Plus** as UI framework
- **pnpm** as package manager

### Key Architectural Structure

#### Monorepo Structure
```
packages/core/     # Editor engine independent of Vue
src/              # Vue application layer
```

#### Separation of Responsibilities
- **Core**: Editor logic, plugins, Fabric.js objects
- **App**: Vue components, UI, application state

## Patterns and Conventions

### 1. Vue Components

**ALWAYS use `<script setup lang="ts">`** - DO NOT use Options API:

```vue
<template>
  <!-- Template -->
</template>

<script setup lang="ts">
// Correct: Composition API with setup
import { reactive, computed, inject } from 'vue';

const props = defineProps<{
  // define typed props
}>();

const emit = defineEmits<{
  // define typed emits
}>();
</script>
```

### 2. State Management

**Use reactive() and computed()** for local state:

```typescript
const state = reactive({
  isLoading: false,
  selectedItems: []
});

const hasSelection = computed(() => state.selectedItems.length > 0);
```

### 3. Dependency Injection

**Main injected services:**

```typescript
const canvasEditor = inject('canvasEditor') as Editor;
const fabric = inject('fabric');
```

### 4. Internationalization

**ALWAYS use existing translation keys:**

```typescript
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// Use existing keys in es.json, en.json, zh.json
const label = t('save.save_as_picture');
```

### 5. Editor Plugins

The plugin system is the heart of editor extensibility. Each plugin must follow the specific structure:

#### Complete Required Structure:

```typescript
export default class PluginName implements IPluginTempl {
  // 1. STATIC PROPERTIES (required)
  static pluginName = 'PluginName';              // Unique name
  static apis = ['method1', 'method2'];          // Public methods
  static events = ['event1', 'event2'];          // Events it emits

  // 2. INSTANCE PROPERTIES
  public canvas: fabric.Canvas;                   // Fabric.js canvas
  public editor: IEditor;                         // Editor instance
  public hotkeys: string[] = ['ctrl+key'];       // Keyboard shortcuts

  // 3. CONSTRUCTOR
  constructor(canvas: fabric.Canvas, editor: IEditor, options?: IPluginOption) {
    this.canvas = canvas;
    this.editor = editor;
    // Specific initialization
  }

  // 4. LIFECYCLE HOOKS (optional)
  async hookImportBefore(data: any): Promise<any> {
    // Before importing JSON - validation/transformation
    return data;
  }

  async hookImportAfter(data: any): Promise<any> {
    // After importing - post-load configuration
    return data;
  }

  async hookSaveBefore(data: any): Promise<any> {
    // Before saving - modify export data
    return data;
  }

  async hookSaveAfter(data: any): Promise<any> {
    // After saving - post-processing
    return data;
  }

  async hookTransform(data: any): Promise<any> {
    // During transformations - automatic validations
    return data;
  }

  // 5. HOTKEY HANDLING (optional)
  hotkeyEvent(eventName: string, e: KeyboardEvent): void {
    const { type } = e; // 'keydown' | 'keyup'
    
    if (eventName === 'ctrl+key' && type === 'keydown') {
      this.executeAction();
    }
  }

  // 6. CONTEXT MENU (optional)
  contextMenu(): IPluginMenu[] {
    const selectedMode = this.editor.getSelectMode();
    
    if (selectedMode === SelectMode.ONE) {
      return [
        {
          text: 'Main Action',
          onclick: () => this.mainAction(),
          hotkey: 'Ctrl+M'
        },
        null, // Separator
        {
          text: 'Submenu',
          hotkey: '❯',
          subitems: [
            {
              text: 'Sub-action',
              onclick: () => this.subAction()
            }
          ]
        }
      ];
    }
    return [];
  }

  // 7. PUBLIC METHODS (APIs)
  method1(param: any) {
    // Public method logic
    this.editor.emit('event1', { param });
  }

  // 8. PRIVATE METHODS
  private _internalMethod() {
    // Plugin internal logic
  }

  // 9. REQUIRED CLEANUP
  destroy() {
    // CRITICAL: Remove listeners, clean resources
    this.canvas.off('event', this.handler);
  }
}
```

#### Critical Details for Each Section:

##### **Static Properties (REQUIRED)**

**`pluginName`**: 
- Unique identifier in PascalCase + "Plugin"
- Used for internal registration and debugging

**`apis`**: 
- Array of strings with public method names
- These methods are exposed directly in the editor: `editor.methodName()`
- Only include methods that should be externally accessible

**`events`**: 
- Array of custom events the plugin can emit
- Used with: `this.editor.emit('eventName', data)`
- Enable communication between plugins

##### **Hotkeys (Specific Format)**

```typescript
public hotkeys = [
  'ctrl+z',        // PC
  '⌘+z',          // Mac  
  'shift+del',     // Multiple modifiers
  'backspace',     // Special keys
  'space'          // Common keys
];
```

##### **Lifecycle Hooks (ASYNC)**

All hooks MUST return Promise:

```typescript
// ✅ CORRECT
async hookImportBefore(data: any): Promise<any> {
  // Process data
  return modifiedData;
}

// ❌ INCORRECT
hookImportBefore(data: any) {
  // Without async/Promise
  return data;
}
```

##### **Communication Between Plugins**

```typescript
// Emit event
this.editor.emit('customEvent', { 
  source: this.constructor.name,
  data: someData 
});

// Listen to event from another plugin
this.editor.on('otherPluginEvent', (data) => {
  this.handleOtherPluginEvent(data);
});
```

##### **Automatic API Registration**

When you define `static apis = ['myMethod']`, automatically:

```typescript
// In the editor this is created:
editor.myMethod = plugin.myMethod.bind(plugin);

// Usage from Vue components:
const canvasEditor = inject('canvasEditor') as Editor;
canvasEditor.myMethod(parameters);
```

##### **TypeScript Type Extension**

```typescript
// For TypeScript to recognize new APIs:
type IMyPlugin = Pick<MyPlugin, 'method1' | 'method2'>;

declare module '@kuaitu/core' {
  interface IEditor extends IMyPlugin {}
}
```

#### Specific Recommended Patterns:

##### **Plugin with Configuration**
```typescript
interface PluginConfig {
  apiUrl: string;
  timeout: number;
}

constructor(
  public canvas: fabric.Canvas, 
  public editor: IEditor,
  private config: PluginConfig = { apiUrl: '', timeout: 5000 }
) {
  // Use this.config in methods
}
```

##### **Plugin with Internal State**
```typescript
private state = reactive({
  isActive: false,
  selectedItems: [] as fabric.Object[]
});

// Methods to manage state
updateState(changes: Partial<typeof this.state>) {
  Object.assign(this.state, changes);
  this.editor.emit('pluginStateChanged', this.state);
}
```

##### **Performance Optimized Plugin**
```typescript
import { debounce } from 'lodash-es';

constructor(canvas: fabric.Canvas, editor: IEditor) {
  // Debounce for frequent events
  this.onCanvasChange = debounce(this.onCanvasChange.bind(this), 100);
  this.canvas.on('object:modified', this.onCanvasChange);
}

destroy() {
  // CRITICAL: Clean listeners
  this.canvas.off('object:modified', this.onCanvasChange);
}
```

## Specific Guidelines for AI

### 1. Code Analysis

**Before modifying code:**
- Read related files to understand context
- Check existing patterns in similar components
- Identify if it's core or UI functionality

### 2. Component Creation

**Recommended order:**
1. Analyze existing similar components
2. Identify reusable composables in `src/hooks/`
3. Use established patterns
4. Implement internationalization from the start

### 3. Modifying Existing Functionality

**Required process:**
1. Read existing code completely
2. Identify dependencies and side effects
3. Maintain compatibility with existing plugins
4. Preserve the event system

### 4. Working with Canvas

**Important considerations:**
- Fabric.js is globally injected
- Use editor methods instead of manipulating canvas directly
- Consider performance in massive operations
- Handle selection events correctly

## Critical Files to Know

### Core Files
- `packages/core/Editor.ts` - Main editor class
- `packages/core/plugin/` - Plugin system
- `packages/core/eventType.ts` - Event types

### App Files
- `src/views/home/index.vue` - Main editor view
- `src/hooks/select.ts` - Selection management
- `src/language/index.ts` - i18n configuration

### Configuration
- `vite.config.ts` - Build configuration
- `package.json` - Dependencies and scripts
- `.eslintrc.js` - Linting rules

## Important Commands

```bash
pnpm dev              # Local development
pnpm build            # Production build
pnpm build:sdk        # Build core package only
pnpm test             # Core tests
```

## Common Problem Resolution

### 1. TypeScript Errors
- Check correct type imports
- Use `@ts-ignore` only as last resort
- Prefer type casting: `as Editor`

### 2. Fabric.js Problems
- Verify canvas is initialized
- Use editor methods instead of direct Fabric
- Handle object disposal correctly

### 3. State Problems
- Check dependency injection
- Use reactive() for complex objects
- Avoid direct mutations in computed

## Anti-Patterns (DO NOT DO)

### ❌ Incorrect
```vue
<script>
export default {
  // DO NOT use Options API
}
</script>
```

```typescript
// DO NOT manipulate canvas directly
canvas.add(object);

// DO NOT hardcode strings
const message = "Save as picture";
```

### ✅ Correct
```vue
<script setup lang="ts">
// Use Composition API
</script>
```

```typescript
// Use editor methods
canvasEditor.add(object);

// Use internationalization
const message = t('save.save_as_picture');
```

## Debugging and Testing

### Useful Logs
```typescript
console.log('Canvas objects:', canvasEditor.getObjects());
console.log('Selection:', canvasEditor.getActiveObject());
```

### Testing Considerations
- Unit tests in `packages/core/__tests__/`
- Use Vitest for tests
- Mock Fabric.js in tests

### Plugin-Specific Debugging

#### Structured Logging for Plugins
```typescript
class DebuggablePlugin implements IPluginTempl {
  static pluginName = 'DebuggablePlugin';
  
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${this.constructor.name}] ${message}`, data);
  }
  
  someMethod() {
    this.log('info', 'Method started', { args: arguments });
    
    try {
      // Method logic
      this.log('info', 'Method completed successfully');
    } catch (error) {
      this.log('error', 'Method failed', error);
      throw error;
    }
  }
}
```

#### Plugin Testing
```typescript
// packages/core/__tests__/plugin/MyPlugin.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fabric } from 'fabric';
import Editor from '../../Editor';
import MyPlugin from '../../plugin/MyPlugin';

describe('MyPlugin', () => {
  let canvas: fabric.Canvas;
  let editor: Editor;
  let plugin: MyPlugin;
  
  beforeEach(() => {
    // Setup canvas mock
    canvas = new fabric.Canvas(document.createElement('canvas'));
    editor = new Editor();
    plugin = new MyPlugin(canvas, editor);
  });
  
  it('should expose APIs correctly', () => {
    expect(plugin.myMethod).toBeDefined();
    expect(typeof plugin.myMethod).toBe('function');
  });
  
  it('should handle hotkeys', () => {
    const event = new KeyboardEvent('keydown');
    const spy = vi.spyOn(plugin, 'myMethod');
    
    plugin.hotkeyEvent('ctrl+m', event);
    expect(spy).toHaveBeenCalled();
  });
  
  it('should emit events correctly', () => {
    const spy = vi.spyOn(editor, 'emit');
    
    plugin.triggerEvent();
    expect(spy).toHaveBeenCalledWith('myEvent', expect.any(Object));
  });
  
  it('should cleanup properly', () => {
    const spy = vi.spyOn(canvas, 'off');
    
    plugin.destroy();
    expect(spy).toHaveBeenCalled();
  });
});
```

#### Runtime Plugin Verification
```typescript
// To verify a plugin is registered correctly:
console.log('Registered plugins:', Object.keys(editor.pluginMap));
console.log('Available APIs:', Object.getOwnPropertyNames(editor).filter(name => 
  typeof editor[name] === 'function' && !name.startsWith('_')
));

// To verify registered hotkeys:
console.log('Registered hotkeys:', editor.getAllHotkeys());

// To verify active events:
console.log('Active events:', editor.getEventListeners());
```

## View UI Plus Integration

### Main Components
- `Button`, `Modal`, `Tooltip`, `Input`
- Use View UI Plus props consistently
- Check theme and styles

### Usage Example
```vue
<template>
  <Button type="primary" @click="handleSave">
    {{ t('save.save_as_picture') }}
  </Button>
</template>
```

## Performance Considerations

### Canvas Performance
- Use `canvas.renderAll()` judiciously
- Implement debounce for frequent events
- Consider `requestAnimationFrame` for animations

### Bundle Size
- Specific imports: `import { reactive } from 'vue'`
- Lazy loading for large components
- Automatic tree shaking with Vite

## Extensibility

### Adding New Functionality
1. **Determine location**: Core or App layer?
2. **Plugin vs Component**: Editor logic or UI?
3. **Internationalization**: Add translations
4. **Testing**: Implement appropriate tests

### Modifying Existing Functionality
1. **Analyze impact**: Does it affect other components?
2. **Backward compatibility**: Does it break existing APIs?
3. **Documentation**: Does it require updating docs?

## Reference Resources

- **Fabric.js Docs**: http://fabricjs.com/docs/
- **Vue 3 Composition API**: https://vuejs.org/guide/
- **View UI Plus**: https://www.iviewui.com/
- **Vite**: https://vitejs.dev/

## Pull Request Checklist

- [ ] Code follows established patterns
- [ ] TypeScript without errors
- [ ] Internationalization implemented
- [ ] Performance considered
- [ ] Cleanup implemented (destroy methods)
- [ ] Tests added if necessary
- [ ] Documentation updated

---

## Notes for AI Agent

1. **Always read before writing**: Analyze existing code before proposing changes
2. **Maintain consistency**: Use established patterns in the project
3. **Think about scalability**: Consider future impact of changes
4. **Prioritize readability**: Clear code is better than "clever" code
5. **Test locally**: Suggest commands to verify changes

This document should be your primary reference when working on Vue Fabric Editor.

---

## Practical Plugin Examples

### Example 1: Auto Alignment Plugin
```typescript
export default class AutoAlignPlugin implements IPluginTempl {
  static pluginName = 'AutoAlignPlugin';
  static apis = ['autoAlign', 'snapToGrid'];
  static events = ['objectAligned'];
  
  public hotkeys = ['alt+a'];
  
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    // Listen to object movements
    this.canvas.on('object:moving', this.handleObjectMoving.bind(this));
  }
  
  autoAlign(alignment: 'left' | 'center' | 'right') {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;
    
    const canvasWidth = this.canvas.getWidth();
    
    switch (alignment) {
      case 'left':
        activeObject.set('left', 0);
        break;
      case 'center':
        activeObject.set('left', canvasWidth / 2);
        break;
      case 'right':
        activeObject.set('left', canvasWidth);
        break;
    }
    
    this.canvas.renderAll();
    this.editor.emit('objectAligned', { object: activeObject, alignment });
  }
  
  snapToGrid(gridSize: number = 10) {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;
    
    const left = Math.round(activeObject.left! / gridSize) * gridSize;
    const top = Math.round(activeObject.top! / gridSize) * gridSize;
    
    activeObject.set({ left, top });
    this.canvas.renderAll();
  }
  
  hotkeyEvent(eventName: string, e: KeyboardEvent) {
    if (eventName === 'alt+a' && e.type === 'keydown') {
      this.autoAlign('center');
    }
  }
  
  contextMenu() {
    return [
      {
        text: 'Align Left',
        onclick: () => this.autoAlign('left')
      },
      {
        text: 'Center',
        onclick: () => this.autoAlign('center')
      },
      {
        text: 'Align Right',
        onclick: () => this.autoAlign('right')
      }
    ];
  }
  
  private handleObjectMoving(e: fabric.IEvent) {
    // Auto-snap during movement
    if (e.target) {
      this.snapToGrid(10);
    }
  }
  
  destroy() {
    this.canvas.off('object:moving', this.handleObjectMoving);
  }
}
```

### Example 2: Data Validation Plugin
```typescript
export default class ValidationPlugin implements IPluginTempl {
  static pluginName = 'ValidationPlugin';
  static apis = ['validateCanvas', 'getValidationErrors'];
  static events = ['validationCompleted', 'validationFailed'];
  
  private validationRules: ValidationRule[] = [];
  
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this.setupDefaultRules();
  }
  
  async hookSaveBefore(data: any): Promise<any> {
    const errors = this.validateCanvas();
    
    if (errors.length > 0) {
      this.editor.emit('validationFailed', { errors });
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    this.editor.emit('validationCompleted');
    return data;
  }
  
  validateCanvas(): string[] {
    const errors: string[] = [];
    const objects = this.canvas.getObjects();
    
    for (const rule of this.validationRules) {
      const ruleErrors = rule.validate(objects);
      errors.push(...ruleErrors);
    }
    
    return errors;
  }
  
  getValidationErrors() {
    return this.validateCanvas();
  }
  
  addValidationRule(rule: ValidationRule) {
    this.validationRules.push(rule);
  }
  
  private setupDefaultRules() {
    // Rule: No objects outside canvas
    this.addValidationRule({
      name: 'bounds-check',
      validate: (objects) => {
        const errors: string[] = [];
        const canvasBounds = {
          width: this.canvas.getWidth(),
          height: this.canvas.getHeight()
        };
        
        objects.forEach(obj => {
          if (obj.left! < 0 || obj.top! < 0 || 
              obj.left! > canvasBounds.width || 
              obj.top! > canvasBounds.height) {
            errors.push(`Object "${obj.name || 'Unnamed'}" is outside canvas bounds`);
          }
        });
        
        return errors;
      }
    });
  }
  
  destroy() {
    this.validationRules = [];
  }
}

interface ValidationRule {
  name: string;
  validate: (objects: fabric.Object[]) => string[];
}
```

### Example 3: Advanced Export Plugin
```typescript
export default class AdvancedExportPlugin implements IPluginTempl {
  static pluginName = 'AdvancedExportPlugin';
  static apis = ['exportToPDF', 'exportWithWatermark', 'exportMultipleFormats'];
  
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {}
  
  async exportToPDF(options: PDFExportOptions = {}): Promise<Blob> {
    const dataURL = this.canvas.toDataURL({
      format: 'png',
      quality: options.quality || 1,
      multiplier: options.scale || 1
    });
    
    // Simulate PDF conversion (in practice you would use jsPDF)
    const response = await fetch('/api/convert-to-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageData: dataURL,
        options 
      })
    });
    
    return response.blob();
  }
  
  async exportWithWatermark(watermarkText: string): Promise<string> {
    // Create temporary canvas with watermark
    const tempCanvas = new fabric.Canvas(document.createElement('canvas'));
    tempCanvas.setDimensions({
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight()
    });
    
    // Copy existing objects
    const objects = this.canvas.getObjects();
    const clonedObjects = await Promise.all(
      objects.map(obj => this.cloneObject(obj))
    );
    
    clonedObjects.forEach(obj => tempCanvas.add(obj));
    
    // Add watermark
    const watermark = new fabric.Text(watermarkText, {
      left: tempCanvas.getWidth() - 150,
      top: tempCanvas.getHeight() - 50,
      fontSize: 20,
      opacity: 0.5,
      fontFamily: 'Arial'
    });
    
    tempCanvas.add(watermark);
    tempCanvas.renderAll();
    
    const dataURL = tempCanvas.toDataURL();
    tempCanvas.dispose();
    
    return dataURL;
  }
  
  async exportMultipleFormats(): Promise<ExportResults> {
    const results: ExportResults = {};
    
    // PNG
    results.png = this.canvas.toDataURL({ format: 'png' });
    
    // JPEG
    results.jpeg = this.canvas.toDataURL({ format: 'jpeg', quality: 0.8 });
    
    // SVG
    results.svg = this.canvas.toSVG();
    
    // JSON
    results.json = JSON.stringify(this.canvas.toJSON());
    
    // PDF
    results.pdf = await this.exportToPDF();
    
    return results;
  }
  
  async hookSaveAfter(data: any): Promise<any> {
    // Auto-backup in multiple formats after saving
    const exports = await this.exportMultipleFormats();
    
    // Send to backup service
    fetch('/api/backup', {
      method: 'POST',
      body: JSON.stringify({ 
        timestamp: Date.now(),
        exports 
      })
    });
    
    return data;
  }
  
  private async cloneObject(obj: fabric.Object): Promise<fabric.Object> {
    return new Promise(resolve => {
      obj.clone(resolve);
    });
  }
  
  destroy() {
    // Cleanup if necessary
  }
}

interface PDFExportOptions {
  quality?: number;
  scale?: number;
  pageSize?: 'A4' | 'Letter' | 'Custom';
}

interface ExportResults {
  png?: string;
  jpeg?: string;
  svg?: string;
  json?: string;
  pdf?: Blob;
}
```
