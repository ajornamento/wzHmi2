function render(templateId, data) {
  const el = document.getElementById(templateId);
  if (!el) throw new Error(`Template not found: #${templateId}`);
  return el.innerHTML.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    const val = expr.trim().split(".").reduce(
      (obj, k) => obj?.[k],
      data
    );
    return val !== void 0 && val !== null ? String(val) : "";
  });
}
export {
  render
};
