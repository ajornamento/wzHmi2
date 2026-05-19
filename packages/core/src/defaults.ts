import type { Widget, HmiSchema } from './types';

const LINE_PAD = 8;

export function defaultWidget(type: Widget['type'], id: string): Widget {
  if (type === 'LINE') {
    const x1 = 150, y1 = 200, x2 = 350, y2 = 200;
    return {
      id,
      type,
      name: `LINE-${id}`,
      geometry: {
        x: Math.min(x1, x2) - LINE_PAD,
        y: Math.min(y1, y2) - LINE_PAD,
        width: Math.abs(x2 - x1) + LINE_PAD * 2,
        height: Math.abs(y2 - y1) + LINE_PAD * 2,
        rotation: 0,
        zIndex: 1,
      },
      binding: { tagId: '', dataType: 'INT', refreshRate: 500 },
      styles: { opacity: 1, visible: true, baseColor: '#888888', animations: [] },
      actions: {},
      properties: {
        label: '', showTooltip: false,
        x1, y1, x2, y2,
        lineWidth: 2, lineStyle: 'solid', lineType: 'straight',
        arrowEnd: true, arrowStart: false,
      },
    };
  }
  if (type === 'PIPE') {
    return {
      id,
      type,
      name: `PIPE-${id}`,
      geometry: { x: 100, y: 100, width: 160, height: 40, rotation: 0, zIndex: 1 },
      binding: { tagId: '', dataType: 'INT', refreshRate: 500 },
      styles: { opacity: 1, visible: true, baseColor: '#4488aa', animations: [] },
      actions: { confirmRequired: false },
      properties: {
        label: '', showTooltip: false,
        orientation: 'horizontal',
        flanges: true,
        flangeSize: 8,
        flowSpeed: 3,
      },
    };
  }
  if (type === 'WORKSTATION') {
    return {
      id, type, name: `WORKSTATION-${id}`,
      geometry: { x: 100, y: 100, width: 100, height: 100, rotation: 0, zIndex: 1 },
      binding: { tagId: '', dataType: 'INT', refreshRate: 500 },
      styles: { opacity: 1, visible: true, baseColor: '#5577bb', animations: [] },
      actions: { confirmRequired: false },
      properties: { label: '', showTooltip: false },
    };
  }
  if (type === 'HOPPER') {
    return {
      id, type, name: `HOPPER-${id}`,
      geometry: { x: 100, y: 100, width: 80, height: 120, rotation: 0, zIndex: 1 },
      binding: { tagId: '', dataType: 'FLOAT', refreshRate: 500 },
      styles: { opacity: 1, visible: true, baseColor: '#cc6622', animations: [] },
      actions: { confirmRequired: false },
      properties: { label: '', showTooltip: false, min: 0, max: 100 },
    };
  }
  if (type === 'REACTOR') {
    return {
      id, type, name: `REACTOR-${id}`,
      geometry: { x: 100, y: 100, width: 80, height: 120, rotation: 0, zIndex: 1 },
      binding: { tagId: '', dataType: 'INT', refreshRate: 500 },
      styles: { opacity: 1, visible: true, baseColor: '#228899', animations: [] },
      actions: { confirmRequired: false },
      properties: { label: '', showTooltip: false },
    };
  }
  if (type === 'WAREHOUSE') {
    return {
      id, type, name: `WAREHOUSE-${id}`,
      geometry: { x: 100, y: 100, width: 120, height: 100, rotation: 0, zIndex: 1 },
      binding: { tagId: '', dataType: 'FLOAT', refreshRate: 500 },
      styles: { opacity: 1, visible: true, baseColor: '#667755', animations: [] },
      actions: { confirmRequired: false },
      properties: { label: '', showTooltip: false, min: 0, max: 100 },
    };
  }
  if (type === 'OVEN') {
    return {
      id, type, name: `OVEN-${id}`,
      geometry: { x: 100, y: 100, width: 80, height: 100, rotation: 0, zIndex: 1 },
      binding: { tagId: '', dataType: 'FLOAT', refreshRate: 1000 },
      styles: { opacity: 1, visible: true, baseColor: '#556677', animations: [] },
      actions: { confirmRequired: false },
      properties: { label: '', showTooltip: false, unit: '°C', runtimeUnit: 'min' },
    };
  }
  if (type === 'METAL_DETECTOR') {
    return {
      id, type, name: `METAL_DETECTOR-${id}`,
      geometry: { x: 100, y: 100, width: 120, height: 100, rotation: 0, zIndex: 1 },
      binding: { tagId: '', dataType: 'INT', refreshRate: 500 },
      styles: { opacity: 1, visible: true, baseColor: '#dd4422', animations: [] },
      actions: { confirmRequired: false },
      properties: { label: '', showTooltip: false },
    };
  }
  if (type === 'XRAY') {
    return {
      id, type, name: `XRAY-${id}`,
      geometry: { x: 100, y: 100, width: 140, height: 100, rotation: 0, zIndex: 1 },
      binding: { tagId: '', dataType: 'INT', refreshRate: 500 },
      styles: { opacity: 1, visible: true, baseColor: '#0077cc', animations: [] },
      actions: { confirmRequired: false },
      properties: { label: '', showTooltip: false },
    };
  }
  return {
    id,
    type,
    name: `${type}-${id}`,
    geometry: { x: 100, y: 100, width: 120, height: 120, rotation: 0, zIndex: 1 },
    binding: { tagId: '', dataType: 'INT', refreshRate: 500 },
    styles: { opacity: 1, visible: true, baseColor: '#808080', animations: [] },
    actions: { confirmRequired: false },
    properties: { label: type, showTooltip: true },
  };
}

export { LINE_PAD };

export function emptySchema(): HmiSchema {
  return {
    v: '1.0.0',
    canvas: { width: 1920, height: 1080, backgroundColor: '#1a1a1a' },
    widgets: [],
  };
}
