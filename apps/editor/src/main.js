import "@wzhmi/widgets";
import $ from "jquery";
import { initToolbar } from "./components/toolbar";
import { initWidgetPalette } from "./components/widgetPalette";
import { initLayerPanel } from "./components/layerPanel";
import { initEditorCanvas } from "./components/editorCanvas";
import { initSelectionHandles } from "./components/selectionHandles";
import { initLineHandles } from "./components/lineHandles";
import { initPropertyPanel } from "./components/propertyPanel";
import { initCanvasSettings } from "./components/canvasSettings";
import { useEditorStore } from "./store/editorStore";
const store = useEditorStore;
function updateRightPanel() {
  const { selectedId, schema } = store.getState();
  if (!selectedId) {
    $("#canvas-settings-panel").show();
    $("#property-panel-wrapper").hide();
  } else {
    const w = schema.widgets.find((x) => x.id === selectedId);
    if (w) {
      $("#canvas-settings-panel").hide();
      $("#property-panel-wrapper").show();
    }
  }
}
$(document).ready(() => {
  initToolbar();
  initWidgetPalette();
  initLayerPanel();
  initEditorCanvas();
  initSelectionHandles();
  initLineHandles();
  initPropertyPanel();
  initCanvasSettings();
  store.subscribe(() => updateRightPanel());
  updateRightPanel();
});
