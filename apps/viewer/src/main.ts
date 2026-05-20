// 뷰어 앱 진입점 — 툴바 이벤트 바인딩 및 HMI 캔버스 초기화
import $ from 'jquery';
import type { HmiSchema, UserRole } from '@wzhmi/core';
import { useViewerStore } from './store/viewerStore';
import type { DataSourceMode } from './store/viewerStore';
import { initHmiCanvas } from './components/hmiCanvas';

const store = useViewerStore;
const ROLES: UserRole[] = ['VIEWER', 'OPERATOR', 'ADMIN'];

function getApiBase(serverUrl: string): string {
  return serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
}

function updateToolbar() {
  const { serverUrl, scale, currentUser, dataSourceMode, pollInterval, mqttBrokerUrl } = store.getState();
  const apiBase = getApiBase(serverUrl);

  // 스케일 표시
  $('#scale-display').text(`${Math.round(scale * 100)}%`);
  $('#scale-range').val(scale);

  // 서버 URL
  $('#server-url').val(serverUrl);

  // 소스 버튼 활성화
  $('.src-btn').each(function () {
    const mode = $(this).data('mode') as DataSourceMode;
    $(this).toggleClass('active', mode === dataSourceMode);
  });

  // 폴링 주기 표시/숨김
  $('#polling-controls').toggle(dataSourceMode === 'polling');
  $('#polling-interval').val(pollInterval);

  // MQTT 브로커 입력 표시/숨김
  $('#mqtt-controls').toggle(dataSourceMode === 'mqtt');
  $('#mqtt-broker-url').val(mqttBrokerUrl);

  // 역할 버튼 활성화
  $('.role-btn').each(function () {
    $(this).toggleClass('active', $(this).data('role') === currentUser.role);
  });

  // 서버 파일 목록 갱신
  fetch(`${apiBase}/api/hmi`)
    .then((r) => r.json())
    .then((files: string[]) => {
      const $sel = $('#server-files');
      const current = $sel.val() as string;
      $sel.find('option:not(:first)').remove();
      if (files.length > 0) {
        files.forEach((f) => $sel.append(`<option value="${f}">${f}</option>`));
        if (current) $sel.val(current);
        $sel.show();
      } else {
        $sel.hide();
      }
    })
    .catch(() => {});
}

function bindToolbarEvents() {
  // 파일 열기
  $('#btn-open').on('click', () => $('#file-input').trigger('click'));
  $('#file-input').on('change', function () {
    const file = (this as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json: HmiSchema = JSON.parse(e.target?.result as string);
        store.getState().setSchema(json);
      } catch {
        alert('유효하지 않은 HMI 파일입니다.');
      }
    };
    reader.readAsText(file);
    (this as HTMLInputElement).value = '';
  });

  // 서버 파일 선택
  $('#server-files').on('change', function () {
    const fileName = $(this).val() as string;
    if (!fileName) return;
    const apiBase = getApiBase(store.getState().serverUrl);
    fetch(`${apiBase}/api/hmi/${fileName}`)
      .then((r) => r.json())
      .then((json: HmiSchema) => store.getState().setSchema(json))
      .catch(() => alert('서버에서 파일을 불러오지 못했습니다.'));
  });

  // 스케일 슬라이더
  $('#scale-range').on('input', function () {
    store.getState().setScale(Number($(this).val()));
  });

  // 서버 URL
  $('#server-url').on('change', function () {
    store.getState().setServerUrl($(this).val() as string);
  });

  // 데이터 소스 버튼
  $(document).on('click', '.src-btn', function () {
    const mode = $(this).data('mode') as DataSourceMode;
    store.getState().setDataSourceMode(mode);
  });

  // 폴링 주기
  $('#polling-interval').on('change', function () {
    store.getState().setPollInterval(Number($(this).val()));
  });

  // MQTT 브로커 URL
  $('#mqtt-broker-url').on('change', function () {
    store.getState().setMqttBrokerUrl($(this).val() as string);
  });

  // 역할 버튼
  $(document).on('click', '.role-btn', function () {
    const role = $(this).data('role') as UserRole;
    store.getState().setCurrentUser({ id: store.getState().currentUser.id, role });
  });
}

// postMessage로 에디터에서 스키마 수신
function bindPostMessage() {
  if (window.opener) {
    window.opener.postMessage({ type: 'viewer-ready' }, '*');
  }
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.data?.type === 'preview-schema') {
      try {
        const parsed: HmiSchema = JSON.parse(e.data.schema);
        store.getState().setSchema(parsed);
      } catch { /* 잘못된 JSON 무시 */ }
    }
  });
}

$(document).ready(() => {
  bindToolbarEvents();
  bindPostMessage();
  initHmiCanvas();

  // 스토어 변경 시 툴바 갱신
  store.subscribe(() => updateToolbar());
  updateToolbar();

  // 기본 커스텀 액션 등록
  (window as unknown as Record<string, unknown>)['myCustomClickAction'] = (widget: unknown) => {
    const w = widget as { name: string; id: string };
    alert(`위젯 클릭: ${w.name} (${w.id})`);
  };
});
