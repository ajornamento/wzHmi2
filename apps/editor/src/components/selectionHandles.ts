// 선택 핸들 — 선택된 위젯의 8방향 리사이즈 핸들
import $ from 'jquery';
import { useEditorStore } from '../store/editorStore';

const store = useEditorStore;
const SNAP = 10;

type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const CURSORS: Record<HandleDir, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize',
  se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
};

function getScale(): number { return store.getState().canvasScale; }

function renderHandles() {
  const $container = $('#selection-handles').empty();
  const { schema, selectedId } = store.getState();
  if (!selectedId) return;

  const w = schema.widgets.find(x => x.id === selectedId);
  if (!w || w.type === 'LINE') return;

  const dirs: HandleDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  dirs.forEach((dir) => {
    const $h = $(`<div class="resize-handle" data-dir="${dir}"></div>`);
    $h.css({ cursor: CURSORS[dir], position: 'absolute', width: 10, height: 10, background: '#fff', border: '1px solid #4a9eff', borderRadius: 2, zIndex: 9999 });
    positionHandle($h, dir, w.geometry);
    $container.append($h);
  });
}

function positionHandle($h: JQuery, dir: HandleDir, g: { x: number; y: number; width: number; height: number }) {
  const mid = { x: g.x + g.width / 2, y: g.y + g.height / 2 };
  const coords: Record<HandleDir, { x: number; y: number }> = {
    nw: { x: g.x, y: g.y }, n: { x: mid.x, y: g.y }, ne: { x: g.x + g.width, y: g.y },
    e:  { x: g.x + g.width, y: mid.y },
    se: { x: g.x + g.width, y: g.y + g.height }, s: { x: mid.x, y: g.y + g.height },
    sw: { x: g.x, y: g.y + g.height }, w: { x: g.x, y: mid.y },
  };
  const c = coords[dir];
  $h.css({ left: c.x - 5, top: c.y - 5 });
}

export function initSelectionHandles() {
  let resizing = false;
  let resizeDir: HandleDir = 'se';
  let startMX = 0, startMY = 0;
  let origX = 0, origY = 0, origW = 0, origH = 0;
  let resizeId = '';

  // 핸들 mousedown
  $(document).on('mousedown', '.resize-handle', function (e) {
    e.stopPropagation();
    e.preventDefault();
    const { schema, selectedId } = store.getState();
    if (!selectedId) return;
    const w = schema.widgets.find(x => x.id === selectedId);
    if (!w) return;

    resizing = true;
    resizeId = selectedId;
    resizeDir = $(this).data('dir') as HandleDir;
    startMX = e.pageX;
    startMY = e.pageY;
    origX = w.geometry.x;
    origY = w.geometry.y;
    origW = w.geometry.width;
    origH = w.geometry.height;
  });

  $(document).on('mousemove', (e) => {
    if (!resizing || !resizeId) return;
    const scale = getScale();
    const dx = (e.pageX - startMX) / scale;
    const dy = (e.pageY - startMY) / scale;

    let nx = origX, ny = origY, nw = origW, nh = origH;

    if (resizeDir.includes('e')) nw = Math.max(20, Math.round((origW + dx) / SNAP) * SNAP);
    if (resizeDir.includes('s')) nh = Math.max(20, Math.round((origH + dy) / SNAP) * SNAP);
    if (resizeDir.includes('w')) {
      const dw = Math.round(dx / SNAP) * SNAP;
      nw = Math.max(20, origW - dw);
      nx = origX + (origW - nw);
    }
    if (resizeDir.includes('n')) {
      const dh = Math.round(dy / SNAP) * SNAP;
      nh = Math.max(20, origH - dh);
      ny = origY + (origH - nh);
    }

    store.getState().updateWidget(resizeId, {
      geometry: { x: nx, y: ny, width: nw, height: nh } as never,
    });
  });

  $(document).on('mouseup', () => {
    resizing = false;
    resizeId = '';
  });

  store.subscribe(() => renderHandles());
  renderHandles();
}
