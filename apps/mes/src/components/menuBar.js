import $ from "jquery";
import { useViewerStore } from "@viewer/store/viewerStore";
const store = useViewerStore;
let menuItems = [];
let activeMenuId = null;
let onMenuSelect = () => {
};
function initMenuBar(items, onSelect) {
  menuItems = items;
  onMenuSelect = onSelect;
  renderMenuButtons();
  bindEvents();
  store.subscribe(() => updateSourceButtons());
  updateSourceButtons();
}
function renderMenuButtons() {
  const $container = $("#menu-buttons").empty();
  menuItems.forEach((item) => {
    const $btn = $(`<button class="tb-btn menu-btn" data-menu-id="${item.id}">${item.name}</button>`);
    $container.append($btn);
  });
}
function setActiveMenu(id) {
  activeMenuId = id;
  $(".menu-btn").each(function() {
    $(this).toggleClass("active", $(this).data("menu-id") === id);
  });
}
function updateSourceButtons() {
  const { dataSourceMode, pollInterval, mqttBrokerUrl, currentUser } = store.getState();
  $(".src-btn").each(function() {
    $(this).toggleClass("active", $(this).data("mode") === dataSourceMode);
  });
  $("#polling-controls").toggle(dataSourceMode === "polling");
  $("#polling-interval").val(pollInterval);
  $("#mqtt-controls").toggle(dataSourceMode === "mqtt");
  $("#mqtt-broker-url").val(mqttBrokerUrl);
  $(".role-btn").each(function() {
    $(this).toggleClass("active", $(this).data("role") === currentUser.role);
  });
}
function bindEvents() {
  $(document).on("click", ".menu-btn", function() {
    const id = $(this).data("menu-id");
    setActiveMenu(id);
    onMenuSelect(id);
  });
  $(document).on("click", ".src-btn", function() {
    const mode = $(this).data("mode");
    store.getState().setDataSourceMode(mode);
  });
  $("#server-url").on("change", function() {
    store.getState().setServerUrl($(this).val());
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
  $("#btn-editor").on("click", () => {
    window.open("http://localhost:5173", "_blank");
  });
}
export {
  initMenuBar
};
