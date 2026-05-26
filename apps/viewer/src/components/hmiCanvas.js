import $ from "jquery";
import { hasPermission } from "@wzhmi/core";
import { getWidgetTag } from "@wzhmi/widgets";
import { DataBindingEngine } from "../engine/DataBindingEngine";
import { PollingDataSource } from "../engine/PollingDataSource";
import { MqttDataSource } from "../engine/MqttDataSource";
import { MockDataSource } from "../engine/MockDataSource";
import { useViewerStore } from "../store/viewerStore";
const store = useViewerStore;
let engine = null;
let $outer;
let $container;
let resizeObserver;
function reinitEngine() {
  engine?.disconnect();
  delete window["__hmiEngine"];
  const { dataSourceMode, serverUrl, pollInterval, customPollFn, mqttBrokerUrl } = store.getState();
  engine = dataSourceMode === "mock" ? new MockDataSource() : dataSourceMode === "mqtt" ? new MqttDataSource(mqttBrokerUrl) : dataSourceMode === "polling" ? new PollingDataSource(serverUrl, pollInterval, customPollFn ?? void 0) : new DataBindingEngine(serverUrl);
  engine.connect();
  window["__hmiEngine"] = engine;
  renderWidgets();
}
function recalcScale() {
  const state = store.getState();
  const w = $outer[0].clientWidth;
  const h = $outer[0].clientHeight;
  if (!w || !h) return;
  const s = Math.max(0.05, Math.min(w / state.schema.canvas.width, h / state.schema.canvas.height));
  store.getState().setScale(s);
  applyLayout();
}
function applyLayout() {
  const { schema, scale } = store.getState();
  const outerW = $outer[0].clientWidth;
  const outerH = $outer[0].clientHeight;
  const offsetX = Math.max(0, (outerW - schema.canvas.width * scale) / 2);
  const offsetY = Math.max(0, (outerH - schema.canvas.height * scale) / 2);
  $("#hmi-canvas-scaler").css({
    position: "absolute",
    left: offsetX,
    top: offsetY,
    width: schema.canvas.width,
    height: schema.canvas.height,
    transform: `scale(${scale})`,
    transformOrigin: "0 0"
  });
  $container.css({
    width: schema.canvas.width,
    height: schema.canvas.height,
    backgroundColor: schema.canvas.backgroundColor,
    backgroundImage: schema.canvas.backgroundImage ? `url(${schema.canvas.backgroundImage})` : "",
    backgroundSize: schema.canvas.backgroundImageFit ?? "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  });
}
function renderWidgets() {
  if (!$container) return;
  $container.empty();
  const { schema, currentUser } = store.getState();
  const sorted = [...schema.widgets].sort((a, b) => a.geometry.zIndex - b.geometry.zIndex);
  for (const widget of sorted) {
    if (!widget.styles.visible) continue;
    const tagName = getWidgetTag(widget.type);
    if (!tagName) continue;
    const el = document.createElement(tagName);
    el.dataset.widgetId = widget.id;
    el.configure(widget);
    if (widget.actions.onClick || widget.actions.confirmRequired) {
      el.style.cursor = "pointer";
      $(el).on("click", () => handleWidgetClick(widget, currentUser));
    }
    if (widget.properties.showTooltip) {
      el.title = `${widget.name}
\uD0DC\uADF8: ${widget.binding.tagId}`;
    }
    $container.append(el);
    if (widget.binding.tagId && engine) {
      engine.subscribe(widget.binding.tagId, (value) => el.setValue(value));
    }
    if (widget.extraBindings && engine) {
      for (const [key, binding] of Object.entries(widget.extraBindings)) {
        if (binding.tagId) {
          engine.subscribe(binding.tagId, (value) => el.setExtraValue(key, value));
        }
      }
    }
  }
}
function handleWidgetClick(widget, currentUser) {
  if (widget.actions.role && !hasPermission(currentUser.role, widget.actions.role)) {
    alert(`\uC774 \uB3D9\uC791\uC740 ${widget.actions.role} \uC774\uC0C1 \uAD8C\uD55C\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. (\uD604\uC7AC: ${currentUser.role})`);
    return;
  }
  const action = widget.actions.onClick;
  if (!action) return;
  const invoke = () => {
    const fn = window[action];
    if (typeof fn === "function") {
      fn(widget);
    } else {
      console.error(`[HMI] \uC561\uC158 \uD568\uC218 \uBBF8\uB4F1\uB85D: "${action}". window.${action} \uC744 \uD655\uC778\uD558\uC138\uC694.`);
    }
  };
  if (widget.actions.confirmRequired) {
    const ok = confirm(`[${widget.name}] ${action} \uC791\uC5C5\uC744 \uC2E4\uD589\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`);
    if (ok) invoke();
  } else {
    invoke();
  }
}
function initHmiCanvas() {
  $outer = $("#hmi-canvas-outer");
  $container = $("#hmi-canvas");
  resizeObserver = new ResizeObserver(recalcScale);
  resizeObserver.observe($outer[0]);
  let prevEngineKey = "";
  store.subscribe((state) => {
    const key = `${state.dataSourceMode}|${state.serverUrl}|${state.pollInterval}|${state.mqttBrokerUrl}`;
    if (key !== prevEngineKey) {
      prevEngineKey = key;
      reinitEngine();
    }
  });
  store.subscribe(() => {
    applyLayout();
    renderWidgets();
  });
  reinitEngine();
}
function destroyHmiCanvas() {
  engine?.disconnect();
  resizeObserver?.disconnect();
}
export {
  destroyHmiCanvas,
  initHmiCanvas
};
