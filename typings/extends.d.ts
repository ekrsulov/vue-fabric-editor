declare namespace fabric {
  export interface Canvas {
    contextTop: CanvasRenderingContext2D;
    lowerCanvasEl: HTMLElement;
    wrapperEl: HTMLElement;
    isDragging: boolean;
    historyProcessing: boolean;
    _currentTransform: unknown;
    extraProps: any;
    refreshHistory(): void;
    clearHistory(boolean?): void;
    clearUndo(): void;
    _historyNext(): void;
    _historyInit(): void;
    offHistory(): void;
    _centerObject: (obj: fabric.Object, center: fabric.Point) => fabric.Canvas;
    _setupCurrentTransform(e: Event, target: fabric.Object, alreadySelected: boolean): void;
  }

  export interface Control {
    rotate: number;
  }

  export interface Image {
    extensionType?: string;
    extension: any;
  }

  export interface Object {
    extensionType?: string;
    extension: any;
    type: string;
    height: number;
    top: number;
    left: number;
    lockMovementX: boolean;
    lockMovementY: boolean;
    lockRotation: boolean;
    lockScalingX: boolean;
    lockScalingY: boolean;
    forEachObject?: ICollection.forEachObject;
    fontFamily?: string;
    _objects?: ICollection.Object[];
    aCoords?: any;
    [string]?: any;
  }
  export interface Group {
    _objects: ICollection.Object[];
  }
  export interface IObjectOptions {
    /**
     * 标识
     */
    id?: string | undefined;
  }

  export interface IUtil {
    findScaleToFit: (
      source: Record<string, unknown> | fabric.Object,
      destination: Record<string, unknown> | fabric.Object
    ) => number;
  }

  function ControlMouseEventHandler(
    eventData: MouseEvent,
    transformData: Transform,
    x: number,
    y: number
  ): boolean;
  function ControlStringHandler(
    eventData: MouseEvent,
    control: fabric.Control,
    fabricObject: fabric.Object
  ): string;
  export const controlsUtils: {
    rotationWithSnapping: ControlMouseEventHandler;
    scalingEqually: ControlMouseEventHandler;
    scalingYOrSkewingX: ControlMouseEventHandler;
    scalingXOrSkewingY: ControlMouseEventHandler;

    scaleCursorStyleHandler: ControlStringHandler;
    scaleSkewCursorStyleHandler: ControlStringHandler;
    scaleOrSkewActionName: ControlStringHandler;
    rotationStyleHandler: ControlStringHandler;
  };

  type EventNameExt = 'removed' | EventName;

  export interface IObservable<T> {
    on(
      eventName: 'guideline:moving' | 'guideline:mouseup',
      handler: (event: { e: Event; target: fabric.GuideLine }) => void
    ): T;
    on(events: { [key: EventName]: (event: { e: Event; target: fabric.GuideLine }) => void }): T;
  }

  export interface IGuideLineOptions extends ILineOptions {
    axis: 'horizontal' | 'vertical';
  }

  export interface IGuideLineClassOptions extends IGuideLineOptions {
    canvas: {
      setActiveObject(object: fabric.Object | fabric.GuideLine, e?: Event): Canvas;
      remove<T>(...object: (fabric.Object | fabric.GuideLine)[]): T;
    } & Canvas;
    activeOn: 'down' | 'up';
    initialize(xy: number, objObjects: IGuideLineOptions): void;
    callSuper(methodName: string, ...args: unknown[]): any;
    getBoundingRect(absolute?: boolean, calculate?: boolean): Rect;
    on(eventName: EventNameExt, handler: (e: IEvent<MouseEvent>) => void): void;
    off(eventName: EventNameExt, handler?: (e: IEvent<MouseEvent>) => void): void;
    fire<T>(eventName: EventNameExt, options?: any): T;
    isPointOnRuler(e: MouseEvent): 'horizontal' | 'vertical' | false;
    bringToFront(): fabric.Object;
    isHorizontal(): boolean;
  }

  export interface GuideLine extends Line, IGuideLineClassOptions {}

  export class GuideLine extends Line {
    constructor(xy: number, objObjects?: IGuideLineOptions);
    static fromObject(object: any, callback: any): void;
  }

  export interface StaticCanvas {
    ruler: InstanceType<typeof CanvasRuler>;
  }
}

// Declaraciones de módulos para TypeScript
declare module 'fabric' {
  export const fabric: typeof fabric;
}

declare module '@kuaitu/core' {
  export default class Editor {
    init(canvas: any): void;
    use(plugin: any, options?: any): Editor;
    rulerEnable(): void;
    rulerDisable(): void;
    destory(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
    getSelectMode(): any;
    [key: string]: any;
  }

  export interface IEditor extends Editor {
    canvas: any;
  }

  export interface IPluginTempl {
    pluginName: string;
    render?: any;
    init?: (editor: IEditor) => void;
    destroy?: () => void;
    [key: string]: any;
  }

  export interface IPluginMenu {
    text: string;
    onclick: () => void;
    [key: string]: any;
  }

  export interface IPluginClass {
    new (...args: any[]): any;
    [key: string]: any;
  }

  export interface IPluginOption {
    [key: string]: any;
  }

  export interface IEditorHooksType {
    [key: string]: any;
  }

  export const DringPlugin: any;
  export const AlignGuidLinePlugin: any;
  export const ControlsPlugin: any;
  export const CenterAlignPlugin: any;
  export const LayerPlugin: any;
  export const CopyPlugin: any;
  export const MoveHotKeyPlugin: any;
  export const DeleteHotKeyPlugin: any;
  export const GroupPlugin: any;
  export const DrawLinePlugin: any;
  export const GroupTextEditorPlugin: any;
  export const GroupAlignPlugin: any;
  export const WorkspacePlugin: any;
  export const HistoryPlugin: any;
  export const FlipPlugin: any;
  export const RulerPlugin: any;
  export const MaterialPlugin: any;
  export const WaterMarkPlugin: any;
  export const FontPlugin: any;
  export const PolygonModifyPlugin: any;
  export const DrawPolygonPlugin: any;
  export const FreeDrawPlugin: any;
  export const PathTextPlugin: any;
  export const PsdPlugin: any;
  export const SimpleClipImagePlugin: any;
  export const BarCodePlugin: any;
  export const QrCodePlugin: any;
  export const ImageStroke: any;
  export const ResizePlugin: any;
  export const LockPlugin: any;
  export const AddBaseTypePlugin: any;
  export const MaskPlugin: any;

  export const EventType: {
    SelectMode: {
      EMPTY: string;
      ONE: string;
      MULTI: string;
    };
    SelectEvent: {
      ONE: string;
      MULTI: string;
      CANCEL: string;
    };
  };
}
