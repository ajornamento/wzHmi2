const STORAGE_KEY = "hmi-custom-widgets";
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function save(defs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defs));
}
function getAllCustomWidgets() {
  return load();
}
function getCustomWidgetDef(type) {
  return load().find((d) => d.type === type);
}
function registerCustomWidget(def) {
  const defs = load();
  const idx = defs.findIndex((d) => d.type === def.type);
  const full = { ...def, createdAt: Date.now() };
  if (idx >= 0) defs[idx] = full;
  else defs.push(full);
  save(defs);
  return full;
}
function removeCustomWidget(type) {
  save(load().filter((d) => d.type !== type));
}
export {
  getAllCustomWidgets,
  getCustomWidgetDef,
  registerCustomWidget,
  removeCustomWidget
};
