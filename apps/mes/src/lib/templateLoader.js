import $ from "jquery";
async function loadScreenTemplate(screenId) {
  document.querySelectorAll("[data-screen-template]").forEach((el) => el.remove());
  try {
    const res = await fetch(`/${screenId}.html`);
    if (!res.ok) return;
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    doc.querySelectorAll('script[type="text/x-template"]').forEach((script) => {
      const clone = script.cloneNode(true);
      clone.dataset.screenTemplate = screenId;
      document.body.appendChild(clone);
    });
    doc.querySelectorAll("style").forEach((style) => {
      const clone = style.cloneNode(true);
      clone.dataset.screenTemplate = screenId;
      document.head.appendChild(clone);
    });
  } catch (e) {
    console.warn(`[MES] \uD654\uBA74 \uD15C\uD50C\uB9BF \uB85C\uB4DC \uC2E4\uD328: ${screenId}`, e);
  }
}
async function loadScreenHtml(screenId, $container) {
  $container.empty();
  document.querySelectorAll("[data-screen-template]").forEach((el) => el.remove());
  try {
    const res = await fetch(`/customizations/${screenId}.html`);
    if (!res.ok) {
      console.warn(`[MES] HTML \uD654\uBA74 \uD30C\uC77C \uC5C6\uC74C: /customizations/${screenId}.html`);
      return;
    }
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    doc.querySelectorAll("style").forEach((el) => {
      const clone = el.cloneNode(true);
      clone.dataset.screenTemplate = screenId;
      document.head.appendChild(clone);
    });
    doc.querySelectorAll('script[type="text/x-template"]').forEach((el) => {
      const clone = el.cloneNode(true);
      clone.dataset.screenTemplate = screenId;
      document.body.appendChild(clone);
    });
    Array.from(doc.body.children).forEach((el) => {
      if (el.tagName === "STYLE" || el.tagName === "SCRIPT") return;
      $container.append(el.cloneNode(true));
    });
  } catch (e) {
    console.warn(`[MES] HTML \uD654\uBA74 \uB85C\uB4DC \uC2E4\uD328: ${screenId}`, e);
  }
}
function renderTemplate(templateId, o) {
  const raw = $(templateId).html() ?? "";
  const html = raw.replace(/\{%=o\.(\w+)%\}/g, (_, key) => String(o[key] ?? ""));
  return $(html.trim());
}
export {
  loadScreenHtml,
  loadScreenTemplate,
  renderTemplate
};
