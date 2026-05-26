import $ from "jquery";
import { getWidgetTag, getCustomWidgetDef } from "@wzhmi/widgets";
import { useEditorStore } from "../store/editorStore";
const store = useEditorStore;
const SNAP = 10;
let $outer;
let $canvas;
let $selectionBox;
function getScale() {
  return store.getState().canvasScale;
}
function screenToCanvas(pageX, pageY) {
  const rect = $canvas[0].getBoundingClientRect();
  const scale = getScale();
  return {
    x: Math.round((pageX - rect.left) / scale / SNAP) * SNAP,
    y: Math.round((pageY - rect.top) / scale / SNAP) * SNAP
  };
}
function recalcScale() {
  const { schema } = store.getState();
  const outerW = $outer[0].clientWidth;
  const outerH = $outer[0].clientHeight;
  if (!outerW || !outerH) return;
  const s = Math.max(0.05, Math.min(
    (outerW - 40) / schema.canvas.width,
    (outerH - 40) / schema.canvas.height
  ));
  store.getState().setCanvasScale(s);
  applyCanvasLayout();
}
function applyCanvasLayout() {
  const { schema, canvasScale: scale } = store.getState();
  const outerW = $outer[0].clientWidth;
  const outerH = $outer[0].clientHeight;
  const offsetX = Math.max(20, (outerW - schema.canvas.width * scale) / 2);
  const offsetY = Math.max(20, (outerH - schema.canvas.height * scale) / 2);
  $("#canvas-scaler").css({
    position: "absolute",
    left: offsetX,
    top: offsetY,
    width: schema.canvas.width,
    height: schema.canvas.height,
    transform: `scale(${scale})`,
    transformOrigin: "0 0"
  });
  $canvas.css({
    width: schema.canvas.width,
    height: schema.canvas.height,
    backgroundColor: schema.canvas.backgroundColor,
    backgroundImage: schema.canvas.backgroundImage ? `url(${schema.canvas.backgroundImage})` : "none",
    backgroundSize: schema.canvas.backgroundImageFit ?? "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  });
}
function renderWidgets() {
  const { schema, selectedId } = store.getState();
  $canvas.find(".widget-preview").remove();
  const sorted = [...schema.widgets].sort((a, b) => a.geometry.zIndex - b.geometry.zIndex);
  for (const w of sorted) {
    const $el = createWidgetPreview(w, w.id === selectedId);
    $canvas.append($el);
  }
  updateSelectionBox();
}
function createWidgetPreview(w, selected) {
  const tagName = getWidgetTag(w.type);
  const el = document.createElement(tagName ?? "div");
  el.classList.add("widget-preview");
  if (selected) el.classList.add("selected");
  el.dataset.id = w.id;
  el.style.cursor = "move";
  el.style.userSelect = "none";
  if (typeof el.configure === "function") el.configure(w);
  return $(el);
}
function updateSelectionBox() {
  const { schema, selectedId } = store.getState();
  if (!selectedId) {
    $selectionBox.hide();
    return;
  }
  const w = schema.widgets.find((x) => x.id === selectedId);
  if (!w) {
    $selectionBox.hide();
    return;
  }
  $selectionBox.css({
    display: "block",
    left: w.geometry.x - 3,
    top: w.geometry.y - 3,
    width: w.geometry.width + 6,
    height: w.geometry.height + 6
  });
}
function bindWidgetDrag() {
  let dragging = false;
  let dragId = "";
  let startMX = 0, startMY = 0;
  let startWX = 0, startWY = 0;
  $canvas.on("mousedown", ".widget-preview", function(e) {
    const $this = $(this);
    dragId = $this.data("id");
    dragging = true;
    startMX = e.pageX;
    startMY = e.pageY;
    const state = store.getState();
    const w = state.schema.widgets.find((x) => x.id === dragId);
    if (!w) return;
    startWX = w.geometry.x;
    startWY = w.geometry.y;
    store.getState().selectWidget(dragId);
    e.stopPropagation();
  });
  $(document).on("mousemove", (e) => {
    if (!dragging || !dragId) return;
    const scale = getScale();
    const dx = (e.pageX - startMX) / scale;
    const dy = (e.pageY - startMY) / scale;
    const nx = Math.round((startWX + dx) / SNAP) * SNAP;
    const ny = Math.round((startWY + dy) / SNAP) * SNAP;
    store.getState().moveWidget(dragId, nx, ny);
  });
  $(document).on("mouseup", () => {
    dragging = false;
    dragId = "";
  });
}
function bindDropZone() {
  $canvas.on("dragover", (e) => {
    e.preventDefault();
  });
  $canvas.on("drop", (e) => {
    e.preventDefault();
    const dt = e.originalEvent.dataTransfer;
    const type = dt?.getData("widget-type");
    if (!type) return;
    const pos = screenToCanvas(e.pageX ?? 0, e.pageY ?? 0);
    const customDef = type.startsWith("CUSTOM_") ? getCustomWidgetDef(type) : void 0;
    const customGeometry = customDef ? { width: customDef.defaultWidth, height: customDef.defaultHeight } : void 0;
    store.getState().addWidget(type, void 0, customGeometry);
    const { schema, selectedId } = store.getState();
    if (selectedId) {
      store.getState().moveWidget(selectedId, pos.x, pos.y);
    }
    void schema;
  });
}
function bindCanvasClick() {
  $canvas.on("mousedown", (e) => {
    const $t = $(e.target);
    if ($t.hasClass("widget-preview") || $t.closest(".widget-preview").length) return;
    if ($t.closest("#selection-handles").length) return;
    if ($t.closest("#line-handles-svg").length) return;
    store.getState().selectWidget(null);
  });
}
function bindKeyboard() {
  $(document).on("keydown", (e) => {
    const active = document.activeElement;
    if (active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)) return;
    const state = store.getState();
    if (e.ctrlKey && e.key === "z") {
      e.preventDefault();
      state.undo();
      return;
    }
    if (e.ctrlKey && (e.key === "y" || e.shiftKey && e.key === "z")) {
      e.preventDefault();
      state.redo();
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && state.selectedId) {
      e.preventDefault();
      state.removeWidget(state.selectedId);
      return;
    }
    if (e.key === "Escape") {
      state.selectWidget(null);
      return;
    }
    if (state.selectedId) {
      const step = e.shiftKey ? 10 : 1;
      const w = state.schema.widgets.find((x2) => x2.id === state.selectedId);
      if (!w) return;
      let { x, y } = w.geometry;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        x -= step;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        x += step;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        y -= step;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        y += step;
      }
      state.moveWidget(state.selectedId, x, y);
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const widgets = state.schema.widgets;
      if (widgets.length === 0) return;
      const idx = widgets.findIndex((w) => w.id === state.selectedId);
      const next = e.shiftKey ? idx <= 0 ? widgets.length - 1 : idx - 1 : idx >= widgets.length - 1 ? 0 : idx + 1;
      state.selectWidget(widgets[next].id);
    }
  });
}
function bindStoreSubscription() {
  store.subscribe(() => {
    applyCanvasLayout();
    renderWidgets();
  });
}
function initEditorCanvas() {
  $outer = $("#editor-canvas-outer");
  $canvas = $("#editor-canvas");
  $selectionBox = $("#selection-box");
  const resizeObserver = new ResizeObserver(recalcScale);
  resizeObserver.observe($outer[0]);
  bindWidgetDrag();
  bindDropZone();
  bindCanvasClick();
  bindKeyboard();
  bindStoreSubscription();
  recalcScale();
  renderWidgets();
}
export {
  initEditorCanvas
};
