import { BaseWidget } from "./base/BaseWidget";
import { MotorWidget } from "./MotorWidget";
import { ValveWidget } from "./ValveWidget";
import { GaugeWidget } from "./GaugeWidget";
import { ConveyorWidget } from "./ConveyorWidget";
import { TankWidget } from "./TankWidget";
import { AlarmWidget } from "./AlarmWidget";
import { TextLabelWidget } from "./TextLabelWidget";
import { LineWidget } from "./LineWidget";
import { PipeWidget } from "./PipeWidget";
import { WorkstationWidget } from "./WorkstationWidget";
import { HopperWidget } from "./HopperWidget";
import { ReactorWidget } from "./ReactorWidget";
import { WarehouseWidget } from "./WarehouseWidget";
import { OvenWidget } from "./OvenWidget";
import { MetalDetectorWidget } from "./MetalDetectorWidget";
import { XRayWidget } from "./XRayWidget";
import { CustomImageWidget } from "./CustomImageWidget";
import { getAllCustomWidgets, getCustomWidgetDef, registerCustomWidget, removeCustomWidget } from "./customWidgetRegistry";
const WIDGET_TAG_MAP = {
  MOTOR: "hmi-motor",
  VALVE: "hmi-valve",
  GAUGE: "hmi-gauge",
  CONVEYOR: "hmi-conveyor",
  TANK: "hmi-tank",
  ALARM: "hmi-alarm",
  TEXT_LABEL: "hmi-text-label",
  LINE: "hmi-line",
  PIPE: "hmi-pipe",
  WORKSTATION: "hmi-workstation",
  HOPPER: "hmi-hopper",
  REACTOR: "hmi-reactor",
  WAREHOUSE: "hmi-warehouse",
  OVEN: "hmi-oven",
  METAL_DETECTOR: "hmi-metal-detector",
  XRAY: "hmi-xray"
};
function getWidgetTag(type) {
  if (type in WIDGET_TAG_MAP) return WIDGET_TAG_MAP[type];
  if (type.startsWith("CUSTOM_")) return "hmi-custom-image";
  return void 0;
}
function registerAllWidgets() {
  import("./MotorWidget");
  import("./ValveWidget");
  import("./GaugeWidget");
  import("./ConveyorWidget");
  import("./TankWidget");
  import("./AlarmWidget");
  import("./TextLabelWidget");
  import("./LineWidget");
  import("./PipeWidget");
  import("./WorkstationWidget");
  import("./HopperWidget");
  import("./ReactorWidget");
  import("./WarehouseWidget");
  import("./OvenWidget");
  import("./MetalDetectorWidget");
  import("./XRayWidget");
  import("./CustomImageWidget");
}
export {
  AlarmWidget,
  BaseWidget,
  ConveyorWidget,
  CustomImageWidget,
  GaugeWidget,
  HopperWidget,
  LineWidget,
  MetalDetectorWidget,
  MotorWidget,
  OvenWidget,
  PipeWidget,
  ReactorWidget,
  TankWidget,
  TextLabelWidget,
  ValveWidget,
  WIDGET_TAG_MAP,
  WarehouseWidget,
  WorkstationWidget,
  XRayWidget,
  getAllCustomWidgets,
  getCustomWidgetDef,
  getWidgetTag,
  registerAllWidgets,
  registerCustomWidget,
  removeCustomWidget
};
