// HMI 캔버스 — 위젯 렌더링 및 데이터 바인딩 (jQuery 기반)
import $ from 'jquery';
import { hasPermission } from '@wzhmi/core';
import type { Widget } from '@wzhmi/core';
import { WIDGET_TAG_MAP } from '@wzhmi/widgets';
import type { BaseWidget } from '@wzhmi/widgets';
import { DataBindingEngine } from '../engine/DataBindingEngine';
import type { IDataSource } from '../engine/DataBindingEngine';
import { PollingDataSource } from '../engine/PollingDataSource';
import { MqttDataSource } from '../engine/MqttDataSource';
import { useViewerStore } from '../store/viewerStore';

const store = useViewerStore;

let engine: IDataSource | null = null;
let $outer: JQuery;
let $container: JQuery;
let resizeObserver: ResizeObserver;

function reinitEngine() {
  engine?.disconnect();
  delete (window as unknown as Record<string, unknown>)['__hmiEngine'];

  const { dataSourceMode, serverUrl, pollInterval, customPollFn, mqttBrokerUrl } = store.getState();

  engine =
    dataSourceMode === 'mqtt'
      ? new MqttDataSource(mqttBrokerUrl)
      : dataSourceMode === 'polling'
      ? new PollingDataSource(serverUrl, pollInterval, customPollFn ?? undefined)
      : new DataBindingEngine(serverUrl);

  engine.connect();
  (window as unknown as Record<string, unknown>)['__hmiEngine'] = engine;
  renderWidgets();
}

function recalcScale() {
  const state = store.getState();
  const w = ($outer[0] as HTMLElement).clientWidth;
  const h = ($outer[0] as HTMLElement).clientHeight;
  if (!w || !h) return;
  const s = Math.max(0.05, Math.min(w / state.schema.canvas.width, h / state.schema.canvas.height));
  store.getState().setScale(s);
  applyLayout();
}

function applyLayout() {
  const { schema, scale } = store.getState();
  const outerW = ($outer[0] as HTMLElement).clientWidth;
  const outerH = ($outer[0] as HTMLElement).clientHeight;
  const offsetX = Math.max(0, (outerW - schema.canvas.width * scale) / 2);
  const offsetY = Math.max(0, (outerH - schema.canvas.height * scale) / 2);

  $('#hmi-canvas-scaler').css({
    position: 'absolute',
    left: offsetX,
    top: offsetY,
    width: schema.canvas.width,
    height: schema.canvas.height,
    transform: `scale(${scale})`,
    transformOrigin: '0 0',
  });

  $container.css({
    width: schema.canvas.width,
    height: schema.canvas.height,
    backgroundColor: schema.canvas.backgroundColor,
    backgroundImage: schema.canvas.backgroundImage ? `url(${schema.canvas.backgroundImage})` : '',
    backgroundSize: schema.canvas.backgroundImageFit ?? 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  });
}

function renderWidgets() {
  if (!$container) return;
  $container.empty();

  const { schema, currentUser } = store.getState();
  const sorted = [...schema.widgets].sort((a, b) => a.geometry.zIndex - b.geometry.zIndex);

  for (const widget of sorted) {
    if (!widget.styles.visible) continue;
    const tagName = WIDGET_TAG_MAP[widget.type];
    if (!tagName) continue;

    const el = document.createElement(tagName) as BaseWidget;
    el.dataset.widgetId = widget.id;
    el.configure(widget);

    if (widget.actions.onClick || widget.actions.confirmRequired) {
      el.style.cursor = 'pointer';
      $(el).on('click', () => handleWidgetClick(widget, currentUser));
    }

    if (widget.properties.showTooltip) {
      el.title = `${widget.name}\n태그: ${widget.binding.tagId}`;
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

function handleWidgetClick(widget: Widget, currentUser: { id: string; role: string }) {
  if (widget.actions.role && !hasPermission(currentUser.role as never, widget.actions.role)) {
    alert(`이 동작은 ${widget.actions.role} 이상 권한이 필요합니다. (현재: ${currentUser.role})`);
    return;
  }
  const action = widget.actions.onClick;
  if (!action) return;

  const invoke = () => {
    const fn = (window as unknown as Record<string, unknown>)[action];
    if (typeof fn === 'function') {
      (fn as (w: Widget) => void)(widget);
    } else {
      console.warn(`액션 함수가 없습니다: ${action}`);
    }
  };

  if (widget.actions.confirmRequired) {
    const ok = confirm(`[${widget.name}] ${action} 작업을 실행하시겠습니까?`);
    if (ok) invoke();
  } else {
    invoke();
  }
}

export function initHmiCanvas() {
  $outer = $('#hmi-canvas-outer');
  $container = $('#hmi-canvas');

  resizeObserver = new ResizeObserver(recalcScale);
  resizeObserver.observe($outer[0] as HTMLElement);

  // 엔진 관련 상태 변경 시 재초기화
  let prevEngineKey = '';
  store.subscribe((state) => {
    const key = `${state.dataSourceMode}|${state.serverUrl}|${state.pollInterval}|${state.mqttBrokerUrl}`;
    if (key !== prevEngineKey) {
      prevEngineKey = key;
      reinitEngine();
    }
  });

  // scale/schema 변경 시 레이아웃 및 위젯 재렌더
  store.subscribe(() => {
    applyLayout();
    renderWidgets();
  });

  reinitEngine();
}

export function destroyHmiCanvas() {
  engine?.disconnect();
  resizeObserver?.disconnect();
}
