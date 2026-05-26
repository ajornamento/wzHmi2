import $ from "jquery";
import {
  getAllCustomWidgets,
  registerCustomWidget,
  removeCustomWidget
} from "@wzhmi/widgets";
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
const WIDGET_ICONS = {
  MOTOR: "\u2699",
  VALVE: "\u{1F527}",
  GAUGE: "\u{1F3AF}",
  TANK: "\u{1F5C4}",
  CONVEYOR: "\u27A1",
  ALARM: "\u{1F514}",
  TEXT_LABEL: "T",
  LINE: "\u2571",
  PIPE: "\u2503",
  WORKSTATION: "\u{1F3ED}",
  HOPPER: "\u25BD",
  REACTOR: "\u2B21",
  WAREHOUSE: "\u{1F3E0}",
  OVEN: "\u{1F525}",
  METAL_DETECTOR: "\u{1F50D}",
  XRAY: "\u2622"
};
const BASIC_WIDGET_TYPES = [
  "MOTOR",
  "VALVE",
  "GAUGE",
  "TANK",
  "CONVEYOR",
  "ALARM",
  "TEXT_LABEL",
  "LINE",
  "PIPE",
  "WORKSTATION",
  "HOPPER",
  "REACTOR",
  "WAREHOUSE",
  "OVEN",
  "METAL_DETECTOR",
  "XRAY"
];
function renderPalette() {
  const $list = $("#widget-palette-list").empty();
  BASIC_WIDGET_TYPES.forEach((type) => {
    const label = WIDGET_LABELS[type] ?? type;
    const icon = WIDGET_ICONS[type] ?? "\u25A1";
    const $item = $(`
      <div class="palette-item" draggable="true" data-type="${type}" title="${label}">
        <span class="palette-icon">${icon}</span>
        <span class="palette-label">${label}</span>
      </div>
    `);
    $item.on("click", () => store.getState().addWidget(type));
    $item.on("dragstart", (e) => {
      const dt = e.originalEvent.dataTransfer;
      if (dt) {
        dt.setData("widget-type", type);
        dt.effectAllowed = "copy";
      }
    });
    $list.append($item);
  });
  $list.append('<div class="palette-section-sep"></div>');
  $list.append(`
    <div class="palette-section-header">
      <span>\uCEE4\uC2A4\uD140</span>
      <button type="button" id="btn-add-custom" class="palette-add-btn" title="\uCEE4\uC2A4\uD140 \uC704\uC82F \uB4F1\uB85D">+</button>
    </div>
  `);
  getAllCustomWidgets().forEach((def) => {
    const type = def.type;
    const $item = $(`
      <div class="palette-item custom-palette-item" draggable="true" data-type="${type}" title="${def.label}">
        <img class="custom-palette-thumb" src="${def.imageData}" alt="${def.label}" draggable="false" />
        <span class="palette-label">${def.label}</span>
        <button type="button" class="custom-palette-delete" title="\uC0AD\uC81C" data-type="${type}">\xD7</button>
      </div>
    `);
    $item.on("click", (e) => {
      if ($(e.target).hasClass("custom-palette-delete")) return;
      store.getState().addWidget(type, void 0, { width: def.defaultWidth, height: def.defaultHeight });
    });
    $item.on("dragstart", (e) => {
      const dt = e.originalEvent.dataTransfer;
      if (dt) {
        dt.setData("widget-type", type);
        dt.effectAllowed = "copy";
      }
    });
    $item.find(".custom-palette-delete").on("click", (e) => {
      e.stopPropagation();
      if (!confirm(`"${def.label}" \uCEE4\uC2A4\uD140 \uC704\uC82F\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`)) return;
      removeCustomWidget(type);
      $(document).trigger("hmi:customWidgetChanged");
    });
    $list.append($item);
  });
  $("#btn-add-custom").off("click").on("click", openRegistrationDialog);
}
let pendingImageData = "";
function openRegistrationDialog() {
  pendingImageData = "";
  $("#custom-widget-name").val("");
  $("#custom-widget-image-file").val("");
  $("#custom-widget-preview-img").attr("src", "").hide();
  $("#custom-widget-width").val("120");
  $("#custom-widget-height").val("120");
  $("#custom-widget-modal-backdrop").addClass("open");
  $("#custom-widget-name").trigger("focus");
}
function closeRegistrationDialog() {
  $("#custom-widget-modal-backdrop").removeClass("open");
}
function initRegistrationDialog() {
  $("#custom-widget-image-file").off("change").on("change", function() {
    const file = this.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      pendingImageData = ev.target?.result ?? "";
      $("#custom-widget-preview-img").attr("src", pendingImageData).show();
    };
    reader.readAsDataURL(file);
  });
  $("#btn-custom-widget-confirm").off("click").on("click", () => {
    const rawName = String($("#custom-widget-name").val()).trim();
    if (!rawName) {
      alert("\uC704\uC82F \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694.");
      return;
    }
    if (!pendingImageData) {
      alert("\uC774\uBBF8\uC9C0\uB97C \uC120\uD0DD\uD558\uC138\uC694.");
      return;
    }
    const safeName = rawName.replace(/[^a-zA-Z0-9_가-힣]/g, "_");
    const type = `CUSTOM_${safeName}`;
    const width = Math.max(20, Number($("#custom-widget-width").val()) || 120);
    const height = Math.max(20, Number($("#custom-widget-height").val()) || 120);
    registerCustomWidget({ type, label: rawName, imageData: pendingImageData, defaultWidth: width, defaultHeight: height });
    closeRegistrationDialog();
    $(document).trigger("hmi:customWidgetChanged");
  });
  $("#btn-custom-widget-cancel").off("click").on("click", closeRegistrationDialog);
  $("#custom-widget-modal-backdrop").off("click").on("click", function(e) {
    if (e.target === this) closeRegistrationDialog();
  });
  $(document).on("keydown.customWidgetModal", (e) => {
    if (e.key === "Escape") closeRegistrationDialog();
  });
}
function initWidgetPalette() {
  renderPalette();
  initRegistrationDialog();
  $(document).on("hmi:customWidgetChanged", renderPalette);
}
export {
  initWidgetPalette
};
