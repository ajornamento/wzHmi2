// 위젯 패키지의 공개 API 엔트리 포인트
export { BaseWidget } from './base/BaseWidget';
export { MotorWidget } from './MotorWidget';
export { ValveWidget } from './ValveWidget';
export { GaugeWidget } from './GaugeWidget';
export { ConveyorWidget } from './ConveyorWidget';
export { TankWidget } from './TankWidget';
export { AlarmWidget } from './AlarmWidget';
export { TextLabelWidget } from './TextLabelWidget';
export { LineWidget } from './LineWidget';
export { PipeWidget } from './PipeWidget';
export { WorkstationWidget } from './WorkstationWidget';
export { HopperWidget } from './HopperWidget';
export { ReactorWidget } from './ReactorWidget';
export { WarehouseWidget } from './WarehouseWidget';
export { OvenWidget } from './OvenWidget';
export { MetalDetectorWidget } from './MetalDetectorWidget';
export { XRayWidget } from './XRayWidget';

import type { WidgetType } from '@wzhmi/core';

export const WIDGET_TAG_MAP: Record<WidgetType, string> = {
  MOTOR: 'hmi-motor',
  VALVE: 'hmi-valve',
  GAUGE: 'hmi-gauge',
  CONVEYOR: 'hmi-conveyor',
  TANK: 'hmi-tank',
  ALARM: 'hmi-alarm',
  TEXT_LABEL: 'hmi-text-label',
  LINE: 'hmi-line',
  PIPE: 'hmi-pipe',
  WORKSTATION: 'hmi-workstation',
  HOPPER: 'hmi-hopper',
  REACTOR: 'hmi-reactor',
  WAREHOUSE: 'hmi-warehouse',
  OVEN: 'hmi-oven',
  METAL_DETECTOR: 'hmi-metal-detector',
  XRAY: 'hmi-xray',
};

export function registerAllWidgets() {
  import('./MotorWidget');
  import('./ValveWidget');
  import('./GaugeWidget');
  import('./ConveyorWidget');
  import('./TankWidget');
  import('./AlarmWidget');
  import('./TextLabelWidget');
  import('./LineWidget');
  import('./PipeWidget');
  import('./WorkstationWidget');
  import('./HopperWidget');
  import('./ReactorWidget');
  import('./WarehouseWidget');
  import('./OvenWidget');
  import('./MetalDetectorWidget');
  import('./XRayWidget');
}
