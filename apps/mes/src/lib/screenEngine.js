import $ from "jquery";
import { renderTemplate } from "./templateLoader";
function initScreenFromConfig($container, config) {
  const engine = window.__hmiEngine;
  const cleanups = [];
  for (const w of config.widgets ?? []) {
    const onValue = (value) => {
      $container.find(w.selector).text(String(value ?? ""));
    };
    engine?.subscribe(w.tag, onValue);
    cleanups.push(() => engine?.unsubscribe(w.tag, onValue));
  }
  for (const popup of config.popups ?? []) {
    const ns = `screen-engine-${popup.template}`;
    let $currentPopup = null;
    let liveUnsub = null;
    $container.on(`click.${ns}`, popup.trigger, function() {
      $currentPopup?.remove();
      liveUnsub?.();
      liveUnsub = null;
      const data = {};
      for (const [key, field] of Object.entries(popup.templateData)) {
        if (field.from.startsWith("data-")) {
          data[key] = String($(this).data(field.from.slice(5)) ?? "");
        } else {
          data[key] = $container.find(field.from).text();
        }
      }
      $currentPopup = renderTemplate(`#${popup.template}`, data);
      const rect = this.getBoundingClientRect();
      $currentPopup.css({
        position: "fixed",
        zIndex: 9999,
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
        transform: "translateY(-50%)"
      });
      if (popup.liveUpdate) {
        const { tag, selector, format } = popup.liveUpdate;
        const onLive = (value) => {
          $currentPopup?.find(selector).text(format.replace("{value}", String(value ?? "")));
        };
        engine?.subscribe(tag, onLive);
        liveUnsub = () => engine?.unsubscribe(tag, onLive);
      }
      $currentPopup.on("click", popup.closeSelector, () => {
        $currentPopup?.remove();
        $currentPopup = null;
        liveUnsub?.();
        liveUnsub = null;
      });
      $("body").append($currentPopup);
    });
    cleanups.push(() => {
      $container.off(`click.${ns}`);
      $currentPopup?.remove();
      $currentPopup = null;
      liveUnsub?.();
      liveUnsub = null;
    });
  }
  return () => cleanups.forEach((fn) => fn());
}
export {
  initScreenFromConfig
};
