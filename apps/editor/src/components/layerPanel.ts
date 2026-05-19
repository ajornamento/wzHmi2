// 레이어 패널 — 위젯 목록, 선택, 순서 변경, 복제, 삭제
import $ from 'jquery';
import { useEditorStore } from '../store/editorStore';

const store = useEditorStore;

const WIDGET_LABELS: Record<string, string> = {
  MOTOR: '모터', VALVE: '밸브', GAUGE: '게이지', TANK: '탱크',
  CONVEYOR: '컨베이어', ALARM: '알람', TEXT_LABEL: '텍스트', LINE: '라인',
  PIPE: '파이프', WORKSTATION: '작업대', HOPPER: '호퍼', REACTOR: '반응기',
  WAREHOUSE: '창고', OVEN: '오븐', METAL_DETECTOR: '금속검출기', XRAY: 'X-Ray',
};

function renderLayerPanel() {
  const { schema, selectedId } = store.getState();
  const $list = $('#layer-list').empty();

  const sorted = [...schema.widgets].sort((a, b) => b.geometry.zIndex - a.geometry.zIndex);

  sorted.forEach((widget) => {
    const isSelected = widget.id === selectedId;
    const typeLabel = WIDGET_LABELS[widget.type] ?? widget.type;

    const $item = $(`
      <div class="layer-item${isSelected ? ' selected' : ''}" data-id="${widget.id}">
        <span class="layer-type">${typeLabel}</span>
        <span class="layer-name">${widget.name}</span>
        <div class="layer-actions">
          <button class="layer-btn js-bring-fwd" data-id="${widget.id}" title="앞으로">↑</button>
          <button class="layer-btn js-send-bwd" data-id="${widget.id}" title="뒤로">↓</button>
          <button class="layer-btn js-duplicate" data-id="${widget.id}" title="복제">⧉</button>
          <button class="layer-btn js-delete" data-id="${widget.id}" title="삭제">×</button>
        </div>
      </div>
    `);

    $item.on('click', (e) => {
      if ($(e.target as HTMLElement).closest('.layer-actions').length) return;
      store.getState().selectWidget(widget.id);
    });

    $list.append($item);
  });
}

export function initLayerPanel() {
  // 버튼 이벤트 위임
  $('#layer-list').on('click', '.js-bring-fwd', function (e) {
    e.stopPropagation();
    store.getState().bringForward($(this).data('id') as string);
  });
  $('#layer-list').on('click', '.js-send-bwd', function (e) {
    e.stopPropagation();
    store.getState().sendBackward($(this).data('id') as string);
  });
  $('#layer-list').on('click', '.js-duplicate', function (e) {
    e.stopPropagation();
    store.getState().duplicateWidget($(this).data('id') as string);
  });
  $('#layer-list').on('click', '.js-delete', function (e) {
    e.stopPropagation();
    const id = $(this).data('id') as string;
    if (confirm('위젯을 삭제하시겠습니까?')) store.getState().removeWidget(id);
  });

  store.subscribe(() => renderLayerPanel());
  renderLayerPanel();
}
