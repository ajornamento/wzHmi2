// 위젯 팔레트 — 기본 위젯 + 커스텀 위젯 등록/표시
import $ from 'jquery';
import type { WidgetType } from '@wzhmi/core';
import {
  getAllCustomWidgets,
  registerCustomWidget,
  removeCustomWidget,
} from '@wzhmi/widgets';
import { useEditorStore } from '../store/editorStore';

const store = useEditorStore;

const WIDGET_LABELS: Record<string, string> = {
  MOTOR: '모터',
  VALVE: '밸브',
  GAUGE: '게이지',
  TANK: '탱크',
  CONVEYOR: '컨베이어',
  ALARM: '알람',
  TEXT_LABEL: '텍스트',
  LINE: '라인',
  PIPE: '파이프',
  WORKSTATION: '작업대',
  HOPPER: '호퍼',
  REACTOR: '반응기',
  WAREHOUSE: '창고',
  OVEN: '오븐',
  METAL_DETECTOR: '금속검출기',
  XRAY: 'X-Ray',
};

const WIDGET_ICONS: Record<string, string> = {
  MOTOR: '⚙', VALVE: '🔧', GAUGE: '🎯', TANK: '🗄', CONVEYOR: '➡',
  ALARM: '🔔', TEXT_LABEL: 'T', LINE: '╱', PIPE: '┃',
  WORKSTATION: '🏭', HOPPER: '▽', REACTOR: '⬡', WAREHOUSE: '🏠',
  OVEN: '🔥', METAL_DETECTOR: '🔍', XRAY: '☢',
};

const BASIC_WIDGET_TYPES: WidgetType[] = [
  'MOTOR', 'VALVE', 'GAUGE', 'TANK', 'CONVEYOR', 'ALARM',
  'TEXT_LABEL', 'LINE', 'PIPE', 'WORKSTATION', 'HOPPER',
  'REACTOR', 'WAREHOUSE', 'OVEN', 'METAL_DETECTOR', 'XRAY',
];

// ── 팔레트 렌더링 ──────────────────────────────────────────────────

function renderPalette() {
  const $list = $('#widget-palette-list').empty();

  BASIC_WIDGET_TYPES.forEach((type) => {
    const label = WIDGET_LABELS[type] ?? type;
    const icon = WIDGET_ICONS[type] ?? '□';
    const $item = $(`
      <div class="palette-item" draggable="true" data-type="${type}" title="${label}">
        <span class="palette-icon">${icon}</span>
        <span class="palette-label">${label}</span>
      </div>
    `);
    $item.on('click', () => store.getState().addWidget(type));
    $item.on('dragstart', (e) => {
      const dt = (e.originalEvent as DragEvent).dataTransfer;
      if (dt) { dt.setData('widget-type', type); dt.effectAllowed = 'copy'; }
    });
    $list.append($item);
  });

  // 커스텀 위젯 구분 섹션
  $list.append('<div class="palette-section-sep"></div>');
  $list.append(`
    <div class="palette-section-header">
      <span>커스텀</span>
      <button type="button" id="btn-add-custom" class="palette-add-btn" title="커스텀 위젯 등록">+</button>
    </div>
  `);

  // 등록된 커스텀 위젯
  getAllCustomWidgets().forEach((def) => {
    const type = def.type as WidgetType;
    const $item = $(`
      <div class="palette-item custom-palette-item" draggable="true" data-type="${type}" title="${def.label}">
        <img class="custom-palette-thumb" src="${def.imageData}" alt="${def.label}" draggable="false" />
        <span class="palette-label">${def.label}</span>
        <button type="button" class="custom-palette-delete" title="삭제" data-type="${type}">×</button>
      </div>
    `);
    $item.on('click', (e) => {
      if ($(e.target as HTMLElement).hasClass('custom-palette-delete')) return;
      store.getState().addWidget(type, undefined, { width: def.defaultWidth, height: def.defaultHeight });
    });
    $item.on('dragstart', (e) => {
      const dt = (e.originalEvent as DragEvent).dataTransfer;
      if (dt) { dt.setData('widget-type', type); dt.effectAllowed = 'copy'; }
    });
    $item.find('.custom-palette-delete').on('click', (e) => {
      e.stopPropagation();
      if (!confirm(`"${def.label}" 커스텀 위젯을 삭제하시겠습니까?`)) return;
      removeCustomWidget(type);
      $(document).trigger('hmi:customWidgetChanged');
    });
    $list.append($item);
  });

  $('#btn-add-custom').off('click').on('click', openRegistrationDialog);
}

// ── 등록 다이얼로그 ────────────────────────────────────────────────

let pendingImageData = '';

function openRegistrationDialog() {
  pendingImageData = '';
  $('#custom-widget-name').val('');
  $('#custom-widget-image-file').val('');
  $('#custom-widget-preview-img').attr('src', '').hide();
  $('#custom-widget-width').val('120');
  $('#custom-widget-height').val('120');
  $('#custom-widget-modal-backdrop').addClass('open');
  $('#custom-widget-name').trigger('focus');
}

function closeRegistrationDialog() {
  $('#custom-widget-modal-backdrop').removeClass('open');
}

function initRegistrationDialog() {
  // 이미지 파일 선택 → base64 변환 + 미리보기
  $('#custom-widget-image-file').off('change').on('change', function () {
    const file = (this as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      pendingImageData = ev.target?.result as string ?? '';
      $('#custom-widget-preview-img').attr('src', pendingImageData).show();
    };
    reader.readAsDataURL(file);
  });

  // 등록 확인
  $('#btn-custom-widget-confirm').off('click').on('click', () => {
    const rawName = String($('#custom-widget-name').val()).trim();
    if (!rawName) { alert('위젯 이름을 입력하세요.'); return; }
    if (!pendingImageData) { alert('이미지를 선택하세요.'); return; }

    // 이름에서 CUSTOM_ 접두사 구성 (공백/특수문자 제거)
    const safeName = rawName.replace(/[^a-zA-Z0-9_가-힣]/g, '_');
    const type = `CUSTOM_${safeName}`;
    const width = Math.max(20, Number($('#custom-widget-width').val()) || 120);
    const height = Math.max(20, Number($('#custom-widget-height').val()) || 120);

    registerCustomWidget({ type, label: rawName, imageData: pendingImageData, defaultWidth: width, defaultHeight: height });
    closeRegistrationDialog();
    $(document).trigger('hmi:customWidgetChanged');
  });

  // 취소
  $('#btn-custom-widget-cancel').off('click').on('click', closeRegistrationDialog);

  // 배경 클릭 닫기
  $('#custom-widget-modal-backdrop').off('click').on('click', function (e) {
    if (e.target === this) closeRegistrationDialog();
  });

  // Escape 닫기
  $(document).on('keydown.customWidgetModal', (e) => {
    if (e.key === 'Escape') closeRegistrationDialog();
  });
}

// ── 초기화 ────────────────────────────────────────────────────────

export function initWidgetPalette() {
  renderPalette();
  initRegistrationDialog();
  $(document).on('hmi:customWidgetChanged', renderPalette);
}
