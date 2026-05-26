import $ from "jquery";
import { useEditorStore } from "../store/editorStore";
const store = useEditorStore;
const WIDGET_LABELS = {
  MOTOR: "\uBAA8\uD130",
  VALVE: "\uBC38\uBE0C",
  GAUGE: "\uAC8C\uC774\uC9C0",
  TANK: "\uD0F1\uD06C",
  CONVEYOR: "\uCEE8\uBCA0\uC774\uC5B4",
  ALARM: "\uC54C\uB78C",
  TEXT_LABEL: "\uD14D\uC2A4\uD2B8",
  LINE: "\uB77C\uC778",
  PIPE: "\uD30C\uC774\uD504",
  WORKSTATION: "\uC791\uC5C5\uB300",
  HOPPER: "\uD638\uD37C",
  REACTOR: "\uBC18\uC751\uAE30",
  WAREHOUSE: "\uCC3D\uACE0",
  OVEN: "\uC624\uBE10",
  METAL_DETECTOR: "\uAE08\uC18D\uAC80\uCD9C\uAE30",
  XRAY: "X-Ray"
};
function renderLayerPanel() {
  const { schema, selectedId } = store.getState();
  const $list = $("#layer-list").empty();
  const sorted = [...schema.widgets].sort((a, b) => b.geometry.zIndex - a.geometry.zIndex);
  sorted.forEach((widget) => {
    const isSelected = widget.id === selectedId;
    const typeLabel = WIDGET_LABELS[widget.type] ?? widget.type;
    const $item = $(`
      <div class="layer-item${isSelected ? " selected" : ""}" data-id="${widget.id}">
        <span class="layer-type">${typeLabel}</span>
        <span class="layer-name">${widget.name}</span>
        <div class="layer-actions">
          <button class="layer-btn js-bring-fwd" data-id="${widget.id}" title="\uC55E\uC73C\uB85C">\u2191</button>
          <button class="layer-btn js-send-bwd" data-id="${widget.id}" title="\uB4A4\uB85C">\u2193</button>
          <button class="layer-btn js-duplicate" data-id="${widget.id}" title="\uBCF5\uC81C">\u29C9</button>
          <button class="layer-btn js-delete" data-id="${widget.id}" title="\uC0AD\uC81C">\xD7</button>
        </div>
      </div>
    `);
    $item.on("click", (e) => {
      if ($(e.target).closest(".layer-actions").length) return;
      store.getState().selectWidget(widget.id);
    });
    $list.append($item);
  });
}
function initLayerPanel() {
  $("#layer-list").on("click", ".js-bring-fwd", function(e) {
    e.stopPropagation();
    store.getState().bringForward($(this).data("id"));
  });
  $("#layer-list").on("click", ".js-send-bwd", function(e) {
    e.stopPropagation();
    store.getState().sendBackward($(this).data("id"));
  });
  $("#layer-list").on("click", ".js-duplicate", function(e) {
    e.stopPropagation();
    store.getState().duplicateWidget($(this).data("id"));
  });
  $("#layer-list").on("click", ".js-delete", function(e) {
    e.stopPropagation();
    const id = $(this).data("id");
    if (confirm("\uC704\uC82F\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?")) store.getState().removeWidget(id);
  });
  store.subscribe(() => renderLayerPanel());
  renderLayerPanel();
}
export {
  initLayerPanel
};
