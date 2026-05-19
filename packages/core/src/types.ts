export type WidgetType =
  | 'MOTOR'
  | 'VALVE'
  | 'GAUGE'
  | 'CONVEYOR'
  | 'TEXT_LABEL'
  | 'ALARM'
  | 'TANK'
  | 'LINE'
  | 'PIPE'
  | 'WORKSTATION'
  | 'HOPPER'
  | 'REACTOR'
  | 'WAREHOUSE'
  | 'OVEN'
  | 'METAL_DETECTOR'
  | 'XRAY'
  | `CUSTOM_${string}`;

export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type LineType = 'straight' | 'orthogonal' | 'curved';
export type LabelSide = 'top' | 'right' | 'bottom' | 'left';

export type DataType = 'INT' | 'FLOAT' | 'BOOL' | 'STRING';
export type AnimationEffect = 'blink' | 'static' | 'pulse' | 'flow';

export interface HmiCanvas {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundImageFit?: 'cover' | 'contain' | 'fill';
}

export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface Binding {
  tagId: string;
  dataType: DataType;
  refreshRate: number;
  formatter?: string;
}

export interface Animation {
  condition: string;
  property: string;
  value: string;
  effect: AnimationEffect;
}

export interface WidgetStyles {
  opacity: number;
  visible: boolean;
  baseColor: string;
  animations: Animation[];
}

export interface WidgetActions {
  onClick?: string;
  confirmRequired?: boolean;
  role?: UserRole;
}

export interface LineConnection {
  widgetId: string;
  point: 'top' | 'right' | 'bottom' | 'left';
}

export interface WidgetProperties {
  label?: string;
  labelSide?: LabelSide;
  labelVisibility?: Partial<Record<LabelSide, boolean>>;
  waypoints?: Array<{ x: number; y: number }>;
  shape?: 'rect' | 'rounded' | 'ellipse' | 'triangle' | 'diamond' | 'freeform';
  cornerRadius?: number;
  shapePoints?: string;
  remarks?: string;
  showTooltip?: boolean;
  showValue?: boolean;
  strokeWidth?: number;
  unit?: string;
  min?: number;
  max?: number;
  fontFamily?: string;
  fontSize?: number;
  labelColor?: string;
  previewValue?: string;
  // LINE 전용
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  lineWidth?: number;
  lineStyle?: LineStyle;
  lineType?: LineType;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  flowSpeed?: number;
  startConnection?: LineConnection;
  endConnection?: LineConnection;
  [key: string]: unknown;
}

export interface Widget {
  id: string;
  type: WidgetType;
  name: string;
  geometry: Geometry;
  binding: Binding;
  extraBindings?: Record<string, Binding>;
  styles: WidgetStyles;
  actions: WidgetActions;
  properties: WidgetProperties;
}

export interface HmiSchema {
  v: string;
  canvas: HmiCanvas;
  widgets: Widget[];
}

// 위젯 메타데이터 인터페이스들
export interface WidgetMetadata {
  type: WidgetType;
  label: string;
  image: string;
  description: string;
  component?: any;
  tag?: string;
}

export interface CustomWidgetMetadata extends WidgetMetadata {
  id: string;
  isBuiltin: boolean;
  imageData?: string;        // Base64 이미지 데이터
  imageUrl?: string;         // 이미지 URL
  createdAt: number;
  version: string;
  author?: string;
  defaultGeometry: {
    width: number;
    height: number;
  };
  supportedProperties: string[];
  animationSupport: boolean;
  bindingSupport: boolean;
}

export interface TagValue {
  tagId: string;
  value: number | string | boolean;
  timestamp: number;
}

export interface TagUpdate {
  type: 'tag_update';
  data: TagValue;
}

export type FormatterFn = (value: number | string | boolean) => string;

export type UserRole = 'VIEWER' | 'OPERATOR' | 'ADMIN';

// 역할 계층 — 높은 숫자일수록 상위 권한
export const ROLE_LEVEL: Record<UserRole, number> = {
  VIEWER: 0,
  OPERATOR: 1,
  ADMIN: 2,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}
