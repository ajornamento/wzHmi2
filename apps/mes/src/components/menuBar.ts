// MES 메뉴바 — 화면 선택, 소스 전환, 역할 제어
import $ from 'jquery';
import type { UserRole } from '@wzhmi/core';
import { useViewerStore } from '@viewer/store/viewerStore';
import type { DataSourceMode } from '@viewer/store/viewerStore';

const store = useViewerStore;

interface MenuItem {
  id: string;
  name: string;
}

let menuItems: MenuItem[] = [];
let activeMenuId: string | null = null;
let onMenuSelect: (id: string) => void = () => {};

export function initMenuBar(items: MenuItem[], onSelect: (id: string) => void) {
  menuItems = items;
  onMenuSelect = onSelect;

  renderMenuButtons();
  bindEvents();

  store.subscribe(() => updateSourceButtons());
  updateSourceButtons();
}

function renderMenuButtons() {
  const $container = $('#menu-buttons').empty();
  menuItems.forEach((item) => {
    const $btn = $(`<button class="tb-btn menu-btn" data-menu-id="${item.id}">${item.name}</button>`);
    $container.append($btn);
  });
}

function setActiveMenu(id: string) {
  activeMenuId = id;
  $('.menu-btn').each(function () {
    $(this).toggleClass('active', $(this).data('menu-id') === id);
  });
}

function updateSourceButtons() {
  const { dataSourceMode, pollInterval, mqttBrokerUrl, currentUser } = store.getState();

  $('.src-btn').each(function () {
    $(this).toggleClass('active', $(this).data('mode') === dataSourceMode);
  });

  $('#polling-controls').toggle(dataSourceMode === 'polling');
  $('#polling-interval').val(pollInterval);

  $('#mqtt-controls').toggle(dataSourceMode === 'mqtt');
  $('#mqtt-broker-url').val(mqttBrokerUrl);

  $('.role-btn').each(function () {
    $(this).toggleClass('active', $(this).data('role') === currentUser.role);
  });
}

function bindEvents() {
  // 화면 선택
  $(document).on('click', '.menu-btn', function () {
    const id = $(this).data('menu-id') as string;
    setActiveMenu(id);
    onMenuSelect(id);
  });

  // 데이터 소스 버튼
  $(document).on('click', '.src-btn', function () {
    const mode = $(this).data('mode') as DataSourceMode;
    store.getState().setDataSourceMode(mode);
  });

  // 서버 URL
  $('#server-url').on('change', function () {
    store.getState().setServerUrl($(this).val() as string);
  });

  // 폴링 주기
  $('#polling-interval').on('change', function () {
    store.getState().setPollInterval(Number($(this).val()));
  });

  // MQTT 브로커
  $('#mqtt-broker-url').on('change', function () {
    store.getState().setMqttBrokerUrl($(this).val() as string);
  });

  // 역할 버튼
  $(document).on('click', '.role-btn', function () {
    const role = $(this).data('role') as UserRole;
    store.getState().setCurrentUser({ id: store.getState().currentUser.id, role });
  });

  // 에디터 열기
  $('#btn-editor').on('click', () => {
    window.open('http://localhost:5173', '_blank');
  });
}
