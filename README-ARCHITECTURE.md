# Vue Fabric Editor - Architecture Guide

## Overview

Vue Fabric Editor is a graphic editor based on Vue 3, TypeScript and Fabric.js that allows creating and editing designs interactively. This document establishes the architecture guidelines for project development and maintenance.

## Project Architecture

### Main Technology Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite
- **Canvas Library**: Fabric.js
- **UI Framework**: View UI Plus
- **Internationalization**: Vue I18n
- **State Management**: Reactive state management with Composition API
- **Routing**: Vue Router 4

### Folder Structure

```
vue-fabric-editor/
├── packages/                     # Monorepo packages
│   └── core/                     # Core editor functionality
│       ├── Editor.ts             # Main editor class
│       ├── plugin/               # Editor plugins
│       ├── objects/              # Custom fabric objects
│       └── utils/                # Core utilities
├── src/                          # Main application
│   ├── components/               # Vue components
│   ├── views/                    # Page-level components
│   ├── hooks/                    # Composition API hooks
│   ├── api/                      # API services
│   ├── language/                 # Internationalization
│   ├── router/                   # Vue Router configuration
│   ├── styles/                   # Global styles
│   ├── utils/                    # Application utilities
│   └── config/                   # Configuration files
├── public/                       # Static assets
└── typings/                      # TypeScript declarations
```

## Architectural Principles

### 1. Separation of Concerns

#### Core Editor (packages/core)
- **Purpose**: Central editor logic independent of Vue
- **Responsibilities**:
  - Fabric.js canvas management
  - Plugin system
  - Editing operations
  - Editor events

#### Application Layer (src)
- **Purpose**: User interface and Vue integration
- **Responsibilities**:
  - UI components
  - Application state
  - Core integration
  - Routing and navigation

### 2. Plugin System

The editor uses an extensible plugin system based on the Observer pattern that allows adding functionality without modifying the core:

#### Complete Plugin Structure

```typescript
export default class ExamplePlugin implements IPluginTempl {
  // 1. Required static properties
  static pluginName = 'ExamplePlugin';           // Unique plugin name
  static apis = ['methodName1', 'methodName2'];  // Methods exposed to editor
  static events = ['eventName1', 'eventName2'];  // Events the plugin can emit

  // 2. Instance properties
  public canvas: fabric.Canvas;                   // Canvas reference
  public editor: IEditor;                         // Editor reference
  public hotkeys: string[] = ['ctrl+z'];         // Keyboard shortcuts

  // 3. Constructor
  constructor(canvas: fabric.Canvas, editor: IEditor, options?: IPluginOption) {
    this.canvas = canvas;
    this.editor = editor;
    // Initial plugin configuration
  }

  // 4. Lifecycle hooks (optional)
  hookImportBefore?(data: any): Promise<any>;    // Before importing data
  hookImportAfter?(data: any): Promise<any>;     // After importing data
  hookSaveBefore?(data: any): Promise<any>;      // Before saving
  hookSaveAfter?(data: any): Promise<any>;       // After saving
  hookTransform?(data: any): Promise<any>;       // During transformations

  // 5. Keyboard event handling (optional)
  hotkeyEvent?(eventName: string, e: KeyboardEvent): void;

  // 6. Context menu (optional)
  contextMenu?(): IPluginMenu[];

  // 7. Public methods (APIs)
  publicMethod() {
    // Method logic
  }

  // 8. Private methods
  private _privateMethod() {
    // Internal logic
  }

  // 9. Required cleanup
  destroy() {
    // Remove listeners, clean resources
  }
}
```

#### Detailed Plugin Properties

##### 1. Static Properties

**`pluginName`** (string, required)
- Unique plugin identifier
- Used for registration and reference
- Convention: PascalCase + "Plugin"

**`apis`** (string[], optional)
- List of public methods to be exposed in the editor
- Allows direct access: `editor.methodName()`
- Useful for main plugin functionality

**`events`** (string[], optional)
- Custom events the plugin can emit
- Used with `this.editor.emit('eventName', data)`
- Enable communication between plugins

##### 2. Instance Properties

**`hotkeys`** (string[], optional)
- Key combinations the plugin handles
- hotkeys-js format: 'ctrl+z', 'alt+d', 'shift+del'
- Supports multiple platforms: '⌘+z' (Mac), 'ctrl+z' (PC)

##### 3. Lifecycle Hooks

**`hookImportBefore(data: any): Promise<any>`**
- Executed before importing JSON data
- Useful for validation or data transformation
- Must return a Promise

**`hookImportAfter(data: any): Promise<any>`**
- Executed after importing data
- Useful for post-import configurations
- Access to objects already created on canvas

**`hookSaveBefore(data: any): Promise<any>`**
- Executed before serializing canvas
- Allows modifying data before saving
- Useful for adding metadata

**`hookSaveAfter(data: any): Promise<any>`**
- Executed after serialization
- Useful for post-processing operations
- Data is ready for export

**`hookTransform(data: any): Promise<any>`**
- Executed during object transformations
- Useful for validations or automatic adjustments

##### 4. Keyboard Events

```typescript
hotkeyEvent(eventName: string, event: KeyboardEvent): void {
  const { type } = event; // 'keydown' | 'keyup'
  
  if (eventName === 'ctrl+z' && type === 'keydown') {
    this.undo();
  }
}
```

##### 5. Context Menu

```typescript
contextMenu(): IPluginMenu[] {
  const selectedMode = this.editor.getSelectMode();
  
  if (selectedMode === SelectMode.ONE) {
    return [
      {
        text: 'Main Action',
        onclick: () => this.mainAction(),
        hotkey: 'Ctrl+A'
      },
      null, // Separator
      {
        text: 'Submenu',
        hotkey: '❯',
        subitems: [
          {
            text: 'Sub-action 1',
            onclick: () => this.subAction1()
          }
        ]
      }
    ];
  }
  return [];
}
```

#### Recommended Plugin Types

##### 1. Core Functionality Plugins
- **Purpose**: Extend basic editor capabilities
- **Location**: `packages/core/plugin/`
- **Examples**: HistoryPlugin, GroupPlugin, AlignPlugin

##### 2. UI/Tools Plugins
- **Purpose**: Add interface tools
- **Location**: `packages/core/plugin/`
- **Examples**: FontPlugin, ColorPlugin, FilterPlugin

##### 3. Format/Export Plugins
- **Purpose**: Handle import/export
- **Location**: `packages/core/plugin/`
- **Examples**: PsdPlugin, WaterMarkPlugin

#### Plugin Registration

```typescript
// In Editor.ts
import ExamplePlugin from './plugin/ExamplePlugin';

class Editor {
  constructor() {
    // Automatic plugin registration
    this.use(ExamplePlugin, { options });
  }
  
  use(PluginClass: IPluginClass, options?: IPluginOption) {
    const plugin = new PluginClass(this.canvas, this, options);
    this.pluginMap[PluginClass.pluginName] = plugin;
    
    // Register APIs
    PluginClass.apis?.forEach(api => {
      this[api] = plugin[api].bind(plugin);
    });
    
    // Register hotkeys
    plugin.hotkeys?.forEach(hotkey => {
      this.registerHotkey(hotkey, plugin);
    });
  }
}
```

#### Plugin Development Guidelines

##### Best Practices:
- **Independence**: Each plugin should work autonomously
- **Cleanup**: Always implement the `destroy()` method
- **Performance**: Use debounce for frequent events
- **Typing**: Define appropriate TypeScript interfaces
- **Testing**: Include unit tests for critical functionality

##### Communication Between Plugins:
```typescript
// Emit event
this.editor.emit('customEvent', data);

// Listen to event
this.editor.on('customEvent', (data) => {
  // Handle event
});
```

##### API Extension:
```typescript
// Declare type extension
declare module '@kuaitu/core' {
  interface IEditor {
    myCustomMethod(): void;
  }
}
```

### 3. State Management

#### Reactive State with Composition API
```typescript
// Recommended pattern for component state
export default function useComponentState() {
  const state = reactive({
    // reactive properties
  });
  
  const computedValue = computed(() => {
    // computed logic
  });
  
  return {
    state,
    computedValue,
    // methods
  };
}
```

#### Dependency Injection
```typescript
// In child components
const canvasEditor = inject('canvasEditor') as Editor;
const fabric = inject('fabric');
```

### 4. Internationalization

#### Translation Structure
- Files by language: `en.json`, `zh.json`, `es.json`
- Hierarchical structure for organization
- Integration with View UI Plus locales

#### Usage in Components
```typescript
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
// Use: t('key.subkey')
```

## Development Guidelines

### 1. Vue Components

#### Recommended Structure
```vue
<template>
  <!-- Clean and semantic template -->
</template>

<script setup lang="ts">
// Imports
// Props/Emits
// Composition functions
// State management
// Lifecycle hooks
</script>

<style lang="less" scoped>
/* Component-specific styles */
</style>
```

#### Best Practices:
- Use `<script setup>` for new components
- Define TypeScript types for props and emits
- Use composables for reusable logic
- Keep components small and focused

### 2. Custom Hooks (Composables)

#### Naming Conventions:
- `use` prefix for composables
- Descriptive names: `useSelect`, `useCalculate`

#### Structure:
```typescript
export default function useFeatureName() {
  // Reactive state
  const state = reactive({});
  
  // Methods
  const method = () => {};
  
  // Lifecycle
  onMounted(() => {});
  
  // Public return
  return {
    state,
    method
  };
}
```

### 3. API Management

#### Service Structure:
```typescript
// api/moduleName.ts
export class ModuleAPI {
  static async getData() {
    // implementation
  }
}
```

### 4. Editor Plugins

#### Creating New Plugins:

##### Step 1: Define the Plugin
```typescript
// packages/core/plugin/MyNewPlugin.ts
export default class MyNewPlugin implements IPluginTempl {
  static pluginName = 'MyNewPlugin';
  static apis = ['newFeature', 'anotherMethod'];
  static events = ['featureActivated', 'featureCompleted'];
  
  public hotkeys = ['ctrl+shift+n'];
  
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    this._initialize();
  }
  
  // Main functionality
  newFeature(options?: any) {
    // Implementation
    this.editor.emit('featureActivated', { options });
  }
  
  // Import hook
  async hookImportAfter(data: any) {
    // Process data after import
    return data;
  }
  
  // Hotkey handling
  hotkeyEvent(eventName: string, e: KeyboardEvent) {
    if (eventName === 'ctrl+shift+n' && e.type === 'keydown') {
      this.newFeature();
    }
  }
  
  // Context menu
  contextMenu() {
    return [{
      text: 'New Feature',
      onclick: () => this.newFeature()
    }];
  }
  
  // Private initialization
  private _initialize() {
    // Initial configuration
  }
  
  // Required cleanup
  destroy() {
    // Remove listeners, clean resources
  }
}
```

##### Step 2: Register in Editor
```typescript
// packages/core/Editor.ts
import MyNewPlugin from './plugin/MyNewPlugin';

class Editor {
  constructor() {
    // Plugin registration
    this.use(MyNewPlugin);
  }
}
```

##### Step 3: TypeScript Typing (if exposing APIs)
```typescript
// If plugin exposes public APIs
type IMyNewPlugin = Pick<MyNewPlugin, 'newFeature' | 'anotherMethod'>;

declare module '@kuaitu/core' {
  interface IEditor extends IMyNewPlugin {}
}
```

#### Advanced Plugin Patterns

##### Plugin with External Configuration
```typescript
interface MyPluginConfig {
  apiUrl: string;
  timeout: number;
  enableFeature: boolean;
}

export default class ConfigurablePlugin implements IPluginTempl {
  static pluginName = 'ConfigurablePlugin';
  
  private config: MyPluginConfig;
  
  constructor(
    public canvas: fabric.Canvas, 
    public editor: IEditor, 
    options: MyPluginConfig
  ) {
    this.config = {
      apiUrl: 'default-url',
      timeout: 5000,
      enableFeature: true,
      ...options
    };
  }
}
```

##### Plugin with Shared State
```typescript
export default class StatefulPlugin implements IPluginTempl {
  static pluginName = 'StatefulPlugin';
  
  private state = {
    isActive: false,
    data: null
  };
  
  // Share state with other plugins
  getState() {
    return { ...this.state };
  }
  
  setState(newState: Partial<typeof this.state>) {
    this.state = { ...this.state, ...newState };
    this.editor.emit('stateChanged', this.state);
  }
}
```

#### Plugin Testing

##### Test Structure
```typescript
// packages/core/__tests__/plugin/MyNewPlugin.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { fabric } from 'fabric';
import Editor from '../../Editor';
import MyNewPlugin from '../../plugin/MyNewPlugin';

describe('MyNewPlugin', () => {
  let canvas: fabric.Canvas;
  let editor: Editor;
  let plugin: MyNewPlugin;
  
  beforeEach(() => {
    canvas = new fabric.Canvas();
    editor = new Editor();
    plugin = new MyNewPlugin(canvas, editor);
  });
  
  it('should register APIs correctly', () => {
    expect(typeof plugin.newFeature).toBe('function');
  });
  
  it('should handle hotkeys', () => {
    const mockEvent = new KeyboardEvent('keydown');
    plugin.hotkeyEvent('ctrl+shift+n', mockEvent);
    // Verify behavior
  });
});
```

#### Plugin Debugging

##### Structured Logging
```typescript
export default class DebuggablePlugin implements IPluginTempl {
  static pluginName = 'DebuggablePlugin';
  
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    console[level](`[${this.constructor.name}] ${message}`, data);
  }
  
  someMethod() {
    this.log('info', 'Method called', { timestamp: Date.now() });
    
    try {
      // Method logic
    } catch (error) {
      this.log('error', 'Method failed', error);
      throw error;
    }
  }
}
```

#### Performance Optimization

##### Debounce for Frequent Events
```typescript
import { debounce } from 'lodash-es';

export default class OptimizedPlugin implements IPluginTempl {
  static pluginName = 'OptimizedPlugin';
  
  constructor(public canvas: fabric.Canvas, public editor: IEditor) {
    // Debounce frequent events
    this.handleCanvasChange = debounce(this.handleCanvasChange.bind(this), 100);
    
    this.canvas.on('object:modified', this.handleCanvasChange);
  }
  
  private handleCanvasChange() {
    // Optimized logic
  }
  
  destroy() {
    this.canvas.off('object:modified', this.handleCanvasChange);
  }
}
```

### 5. Styling and Theming

#### Organization:
- Global variables in `styles/variable.less`
- Base styles in `styles/index.less`
- Components with scoped styles
- Use of View UI Plus theme system

## Implemented Design Patterns

### 1. Plugin Architecture
- Extensibility through plugins
- Inversion of control
- Loose coupling

### 2. Observer Pattern
- Editor event system
- Lifecycle hooks
- Reactive state management

### 3. Dependency Injection
- Provide/inject for services
- Improved testability

### 4. Command Pattern
- Editor actions (undo/redo)
- Command history

## Guidelines for New Features

### 1. Prior Analysis
- Identify if it's core or UI functionality
- Evaluate impact on existing architecture
- Consider future extensibility

### 2. Implementation

#### For Core Functionality:
1. Create plugin in `packages/core/plugin/`
2. Implement unit tests
3. Document API

#### For UI Functionality:
1. Create component in appropriate directory
2. Use existing composables
3. Implement internationalization
4. Follow style guides

### 3. Testing
- Unit tests for core logic
- Component tests for UI
- Integration tests for complete flows

### 4. Documentation
- JSDoc comments for public APIs
- README for complex plugins
- Update this guide if necessary

## Environment Configuration

### Development Tools
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Husky + lint-staged
- **Commits**: Conventional commits

### Available Scripts
```bash
pnpm dev              # Development
pnpm build            # Production build
pnpm build:sdk        # Build core package only
pnpm test             # Tests
pnpm preview          # Preview build
```

## Performance Considerations

### 1. Bundle Optimization
- Code splitting by routes
- Lazy loading of components
- Automatic tree shaking

### 2. Canvas Performance
- Debounce for frequent events
- Rendering optimization
- Efficient object management

### 3. Memory Management
- Cleanup listeners on unmount
- Dispose Fabric.js objects
- Image management

## Migration and Updates

### Versioning
- Semantic versioning
- Documented breaking changes
- Migration guides

### Dependencies
- Regular updates
- Thorough testing post-update
- Deprecation warnings

---

## Conclusion

This guide should be consulted before implementing new features or modifying existing ones. Maintaining architectural consistency is crucial for project scalability and maintainability.

For questions or suggestions about the architecture, please create an issue in the repository.
