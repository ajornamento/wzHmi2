import $ from "jquery";
import { useEditorStore } from "../store/editorStore";
const store = useEditorStore;
const PRESETS = [
  { label: "1920\xD71080 (16:9)", w: 1920, h: 1080 },
  { label: "1280\xD7720 (16:9)", w: 1280, h: 720 },
  { label: "1024\xD7768 (4:3)", w: 1024, h: 768 },
  { label: "800\xD7600 (4:3)", w: 800, h: 600 },
  { label: "2560\xD71080 (21:9)", w: 2560, h: 1080 },
  { label: "3840\xD72160 (4K)", w: 3840, h: 2160 }
];
function renderPanel() {
  const { schema } = store.getState();
  const c = schema.canvas;
  $("#canvas-width").val(c.width);
  $("#canvas-height").val(c.height);
  $("#canvas-bg-color").val(c.backgroundColor);
  $("#canvas-bg-image").val(c.backgroundImage ?? "");
  $("#canvas-bg-fit").val(c.backgroundImageFit ?? "cover");
}
function initCanvasSettings() {
  const $presets = $("#canvas-presets").empty();
  PRESETS.forEach((p) => {
    $presets.append(`<option value="${p.w}x${p.h}">${p.label}</option>`);
  });
  $presets.prepend('<option value="">\uD574\uC0C1\uB3C4 \uD504\uB9AC\uC14B...</option>');
  $presets.on("change", function() {
    const val = $(this).val();
    if (!val) return;
    const [w, h] = val.split("x").map(Number);
    store.getState().setCanvas({ width: w, height: h });
    $(this).val("");
  });
  $("#canvas-width").on("change", function() {
    const v = Math.max(100, Math.min(7680, Number($(this).val())));
    store.getState().setCanvas({ width: v });
  });
  $("#canvas-height").on("change", function() {
    const v = Math.max(100, Math.min(7680, Number($(this).val())));
    store.getState().setCanvas({ height: v });
  });
  $("#canvas-bg-color").on("input", function() {
    store.getState().setCanvas({ backgroundColor: $(this).val() });
  });
  $("#canvas-bg-image").on("change", function() {
    store.getState().setCanvas({ backgroundImage: $(this).val() || void 0 });
  });
  $("#canvas-bg-upload").on("change", function() {
    const file = this.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result;
      store.getState().setCanvas({ backgroundImage: url });
      $("#canvas-bg-image").val(url);
    };
    reader.readAsDataURL(file);
    this.value = "";
  });
  $("#canvas-bg-fit").on("change", function() {
    store.getState().setCanvas({ backgroundImageFit: $(this).val() });
  });
  $("#btn-clear-bg").on("click", () => {
    store.getState().setCanvas({ backgroundImage: void 0 });
    $("#canvas-bg-image").val("");
  });
  store.subscribe(() => renderPanel());
  renderPanel();
}
export {
  initCanvasSettings
};
