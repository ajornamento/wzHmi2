// 위젯 팔레트 — 클릭/드래그로 캔버스에 위젯 추가
import $ from 'jquery';
import type { WidgetType } from '@wzhmi/core';
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

export function initWidgetPalette() {
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
      if (dt) {
        dt.setData('widget-type', type);
        dt.effectAllowed = 'copy';
      }
    });

    $list.append($item);
  });
}
