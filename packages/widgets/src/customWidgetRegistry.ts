// 커스텀 위젯 정의를 localStorage에 저장/조회하는 레지스트리

export interface CustomWidgetDef {
  type: string;          // 'CUSTOM_이름'
  label: string;
  imageData: string;     // data URL (base64)
  defaultWidth: number;
  defaultHeight: number;
  createdAt: number;
}

const STORAGE_KEY = 'hmi-custom-widgets';

function load(): CustomWidgetDef[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(defs: CustomWidgetDef[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defs));
}

export function getAllCustomWidgets(): CustomWidgetDef[] {
  return load();
}

export function getCustomWidgetDef(type: string): CustomWidgetDef | undefined {
  return load().find(d => d.type === type);
}

export function registerCustomWidget(def: Omit<CustomWidgetDef, 'createdAt'>): CustomWidgetDef {
  const defs = load();
  const idx = defs.findIndex(d => d.type === def.type);
  const full: CustomWidgetDef = { ...def, createdAt: Date.now() };
  if (idx >= 0) defs[idx] = full; else defs.push(full);
  save(defs);
  return full;
}

export function removeCustomWidget(type: string) {
  save(load().filter(d => d.type !== type));
}
