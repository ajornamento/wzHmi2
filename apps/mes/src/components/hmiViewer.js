import $ from "jquery";
import { useViewerStore } from "@viewer/store/viewerStore";
import { loadScreenTemplate, loadScreenHtml } from "../lib/templateLoader";
import * as customLine1 from "../customizations/production-line-1";
import * as customLine2 from "../customizations/production-line-2";
const store = useViewerStore;
const HMI_API_BASE = "http://localhost:3001/api/hmi";
function isHtmlMode(c) {
  return typeof c.initScreen === "function";
}
const CUSTOM_MAP = {
  "production-line-1": customLine1,
  "production-line-2": customLine2
};
let prevCleanup = null;
async function loadHtmlScreen(screenId, initFn) {
  $("#hmi-canvas-outer").hide();
  const $container = $("#html-screen-container").show();
  prevCleanup?.();
  prevCleanup = null;
  await loadScreenHtml(screenId, $container);
  if (initFn) {
    prevCleanup = initFn($container);
  }
}
async function loadCanvasScreen(menuId, custom, schema) {
  prevCleanup?.();
  prevCleanup = null;
  $("#html-screen-container").hide();
  $("#hmi-canvas-outer").show();
  store.getState().setSchema(schema);
  await loadScreenTemplate(menuId);
  if (custom.actions) {
    for (const [name, fn] of Object.entries(custom.actions)) {
      window[name] = fn;
    }
  }
  if (typeof custom.fetchTagValues === "function") {
    store.getState().setCustomPollFn(custom.fetchTagValues);
  } else {
    store.getState().setCustomPollFn(null);
  }
}
async function loadScreen(menuId) {
  const custom = CUSTOM_MAP[menuId] ?? {};
  if (isHtmlMode(custom)) {
    await loadHtmlScreen(menuId, custom.initScreen);
    return;
  }
  let schema;
  try {
    const res = await fetch(`${HMI_API_BASE}/${menuId}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    schema = await res.json();
  } catch (e) {
    console.error(`[MES] \uC2A4\uD0A4\uB9C8 \uB85C\uB4DC \uC2E4\uD328 (${menuId}):`, e);
    return;
  }
  await loadCanvasScreen(menuId, custom, schema);
}
export {
  loadScreen
};
