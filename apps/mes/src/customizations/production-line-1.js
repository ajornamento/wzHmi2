import $ from "jquery";
import { renderTemplate } from "../lib/templateLoader";
async function fetchTagValues(tagIds) {
  const res = await fetch("http://localhost:3001/api/tags/values", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tagIds })
  });
  if (!res.ok) return [];
  return res.json();
}
const actions = {
  Tank1Click: (widget) => {
    const engine = window.__hmiEngine;
    document.getElementById("__tank1-popup")?.remove();
    const $popup = renderTemplate("#tpl-tank1-popup", {
      label: widget.properties?.label ?? widget.name,
      level: "-"
    });
    const widgetEl = document.querySelector(`[data-widget-id="${widget.id}"]`);
    if (widgetEl) {
      const rect = widgetEl.getBoundingClientRect();
      $popup.css({
        position: "fixed",
        zIndex: 9999,
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
        transform: "translateY(-50%)"
      });
    } else {
      $popup.css({ position: "fixed", zIndex: 9999, top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
    }
    let unsub = null;
    if (engine && widget.binding?.tagId) {
      const onValue = (value) => {
        $popup.find(".tank1-popup-level").text(`\uD0F1\uD06C\uB808\uBCA8: ${value}`);
      };
      engine.subscribe(widget.binding.tagId, onValue);
      unsub = () => engine.unsubscribe(widget.binding.tagId, onValue);
    }
    $popup.find(".tank1-popup-close").on("click", () => {
      $popup.remove();
      unsub?.();
    });
    $("body").append($popup);
  }
};
export {
  actions,
  fetchTagValues
};
