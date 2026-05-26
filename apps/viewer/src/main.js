import $ from "jquery";
import { useViewerStore } from "./store/viewerStore";
import { initHmiCanvas } from "./components/hmiCanvas";
const store = useViewerStore;
const ROLES = ["VIEWER", "OPERATOR", "ADMIN"];
function getApiBase(serverUrl) {
  return serverUrl.replace("ws://", "http://").replace("wss://", "https://");
}
function updateToolbar() {
  const { serverUrl, scale, currentUser, dataSourceMode, pollInterval, mqttBrokerUrl } = store.getState();
  const apiBase = getApiBase(serverUrl);
  $("#scale-display").text(`${Math.round(scale * 100)}%`);
  $("#scale-range").val(scale);
  $("#server-url").val(serverUrl);
  $(".src-btn").each(function() {
    const mode = $(this).data("mode");
    $(this).toggleClass("active", mode === dataSourceMode);
  });
  $("#polling-controls").toggle(dataSourceMode === "polling");
  $("#polling-interval").val(pollInterval);
  $("#mqtt-controls").toggle(dataSourceMode === "mqtt");
  $("#mqtt-broker-url").val(mqttBrokerUrl);
  $(".role-btn").each(function() {
    $(this).toggleClass("active", $(this).data("role") === currentUser.role);
  });
  fetch(`${apiBase}/api/hmi`).then((r) => r.json()).then((files) => {
    const $sel = $("#server-files");
    const current = $sel.val();
    $sel.find("option:not(:first)").remove();
    if (files.length > 0) {
      files.forEach((f) => $sel.append(`<option value="${f}">${f}</option>`));
      if (current) $sel.val(current);
      $sel.show();
    } else {
      $sel.hide();
    }
  }).catch(() => {
  });
}
function bindToolbarEvents() {
  $("#btn-open").on("click", () => $("#file-input").trigger("click"));
  $("#file-input").on("change", function() {
    const file = this.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result);
        store.getState().setSchema(json);
      } catch {
        alert("\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 HMI \uD30C\uC77C\uC785\uB2C8\uB2E4.");
      }
    };
    reader.readAsText(file);
    this.value = "";
  });
  $("#server-files").on("change", function() {
    const fileName = $(this).val();
    if (!fileName) return;
    const apiBase = getApiBase(store.getState().serverUrl);
    fetch(`${apiBase}/api/hmi/${fileName}`).then((r) => r.json()).then((json) => store.getState().setSchema(json)).catch(() => alert("\uC11C\uBC84\uC5D0\uC11C \uD30C\uC77C\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."));
  });
  $("#scale-range").on("input", function() {
    store.getState().setScale(Number($(this).val()));
  });
  $("#server-url").on("change", function() {
    store.getState().setServerUrl($(this).val());
  });
  $(document).on("click", ".src-btn", function() {
    const mode = $(this).data("mode");
    store.getState().setDataSourceMode(mode);
  });
  $("#polling-interval").on("change", function() {
    store.getState().setPollInterval(Number($(this).val()));
  });
  $("#mqtt-broker-url").on("change", function() {
    store.getState().setMqttBrokerUrl($(this).val());
  });
  $(document).on("click", ".role-btn", function() {
    const role = $(this).data("role");
    store.getState().setCurrentUser({ id: store.getState().currentUser.id, role });
  });
}
function bindPostMessage() {
  if (window.opener) {
    window.opener.postMessage({ type: "viewer-ready" }, "*");
  }
  window.addEventListener("message", (e) => {
    if (e.data?.type === "preview-schema") {
      try {
        const parsed = JSON.parse(e.data.schema);
        store.getState().setSchema(parsed);
      } catch {
      }
    }
  });
}
$(document).ready(() => {
  bindToolbarEvents();
  bindPostMessage();
  initHmiCanvas();
  store.subscribe(() => updateToolbar());
  updateToolbar();
  window["myCustomClickAction"] = (widget) => {
    const w = widget;
    alert(`\uC704\uC82F \uD074\uB9AD: ${w.name} (${w.id})`);
  };
});
