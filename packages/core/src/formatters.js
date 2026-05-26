const registry = {
  motorStatus: (v) => {
    const n = Number(v);
    if (n === 0) return "\uC815\uC9C0";
    if (n === 1) return "\uAC00\uB3D9";
    if (n === 2) return "\uC624\uB958";
    return String(v);
  },
  valveState: (v) => {
    const n = Number(v);
    if (n === 0) return "\uB2EB\uD798";
    if (n === 1) return "\uC5F4\uB9BC";
    return `${n}%`;
  },
  onOff: (v) => v ? "ON" : "OFF",
  yesNo: (v) => v ? "Yes" : "No",
  percent: (v) => `${Number(v).toFixed(1)}%`,
  temperature: (v) => `${Number(v).toFixed(1)}\xB0C`,
  pressure: (v) => `${Number(v).toFixed(2)} bar`,
  rpm: (v) => `${Number(v)} RPM`
};
function format(formatterName, value) {
  if (!formatterName) return String(value);
  const fn = registry[formatterName];
  if (fn) return fn(value);
  try {
    return new Function("value", `return \`${formatterName}\``)(value);
  } catch {
    return String(value);
  }
}
function registerFormatter(name, fn) {
  registry[name] = fn;
}
export {
  format,
  registerFormatter
};
