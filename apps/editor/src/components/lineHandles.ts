// 라인 핸들 — 라인 위젯의 끝점/관절점 드래그 및 스냅 연결
import $ from 'jquery';
import type { LineConnection, Widget } from '@wzhmi/core';
import { useEditorStore } from '../store/editorStore';

const store = useEditorStore;
const SNAP_RADIUS = 20;

type Waypoint = { x: number; y: number };

function getScale(): number { return store.getState().canvasScale; }

function getCanvasOffset(): { left: number; top: number } {
  const el = document.getElementById('editor-canvas');
  if (!el) return { left: 0, top: 0 };
  const rect = el.getBoundingClientRect();
  return { left: rect.left, top: rect.top };
}

function pageToCanvas(pageX: number, pageY: number): { x: number; y: number } {
  const off = getCanvasOffset();
  const scale = getScale();
  return { x: (pageX - off.left) / scale, y: (pageY - off.top) / scale };
}

function getConnectionPoints(w: Widget): { point: 'top' | 'right' | 'bottom' | 'left'; x: number; y: number }[] {
  const { x, y, width, height } = w.geometry;
  return [
    { point: 'top',    x: x + width / 2, y },
    { point: 'right',  x: x + width, y: y + height / 2 },
    { point: 'bottom', x: x + width / 2, y: y + height },
    { point: 'left',   x, y: y + height / 2 },
  ];
}

function findSnapTarget(cx: number, cy: number, excludeId: string): LineConnection | null {
  const { schema } = store.getState();
  for (const w of schema.widgets) {
    if (w.id === excludeId || w.type === 'LINE') continue;
    for (const cp of getConnectionPoints(w)) {
      const dist = Math.hypot(cp.x - cx, cp.y - cy);
      if (dist <= SNAP_RADIUS) {
        return { widgetId: w.id, point: cp.point };
      }
    }
  }
  return null;
}

function renderLineHandles() {
  const $svg = $('#line-handles-svg');
  $svg.empty();
  const { schema, selectedId } = store.getState();
  if (!selectedId) return;

  const w = schema.widgets.find(x => x.id === selectedId);
  if (!w || w.type !== 'LINE') return;

  const x1 = Number(w.properties.x1 ?? 0), y1 = Number(w.properties.y1 ?? 0);
  const x2 = Number(w.properties.x2 ?? 0), y2 = Number(w.properties.y2 ?? 0);
  const waypoints: Waypoint[] = (w.properties.waypoints as Waypoint[] | undefined) ?? [];

  const svgEl = $svg[0] as unknown as SVGSVGElement;

  // 라인 경로 표시
  const pts = [[x1, y1], ...waypoints.map(p => [p.x, p.y]), [x2, y2]];
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', pts.map(p => p.join(',')).join(' '));
  polyline.setAttribute('stroke', '#4a9eff');
  polyline.setAttribute('stroke-width', '2');
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke-dasharray', '4 2');
  svgEl.appendChild(polyline);

  // 끝점 핸들
  [[x1, y1, 'start'], [x2, y2, 'end']].forEach(([cx, cy, ep]) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', '7');
    circle.setAttribute('fill', ep === 'start' ? '#fff' : '#4a9eff');
    circle.setAttribute('stroke', '#4a9eff');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('class', 'line-endpoint');
    circle.dataset.ep = ep as string;
    circle.style.cursor = 'crosshair';
    svgEl.appendChild(circle);
  });

  // 관절점 핸들
  waypoints.forEach((wp, i) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(wp.x));
    circle.setAttribute('cy', String(wp.y));
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', '#ff9900');
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '1');
    circle.setAttribute('class', 'line-waypoint');
    circle.dataset.idx = String(i);
    circle.style.cursor = 'move';
    svgEl.appendChild(circle);
  });
}

export function initLineHandles() {
  let dragging = false;
  let dragType: 'endpoint' | 'waypoint' | null = null;
  let dragEp: 'start' | 'end' = 'start';
  let dragWpIdx = 0;

  // 끝점 드래그
  $(document).on('mousedown', '.line-endpoint', function (e) {
    e.stopPropagation();
    e.preventDefault();
    dragging = true;
    dragType = 'endpoint';
    dragEp = (this as SVGElement).dataset.ep as 'start' | 'end';
  });

  // 관절점 드래그
  $(document).on('mousedown', '.line-waypoint', function (e) {
    e.stopPropagation();
    e.preventDefault();
    dragging = true;
    dragType = 'waypoint';
    dragWpIdx = Number((this as SVGElement).dataset.idx);
  });

  // 관절점 더블클릭으로 삭제
  $(document).on('dblclick', '.line-waypoint', function (e) {
    e.stopPropagation();
    const { selectedId } = store.getState();
    if (!selectedId) return;
    store.getState().removeLineWaypoint(selectedId, Number((this as SVGElement).dataset.idx));
  });

  // 라인 몸체 더블클릭으로 관절점 추가
  $(document).on('dblclick', '.line-body-hit', function (e) {
    e.stopPropagation();
    const { selectedId } = store.getState();
    if (!selectedId) return;
    const pos = pageToCanvas(e.pageX, e.pageY);
    const { schema } = store.getState();
    const w = schema.widgets.find(x => x.id === selectedId);
    if (!w || w.type !== 'LINE') return;
    store.getState().addLineWaypoint(selectedId, 0, pos.x, pos.y);
  });

  $(document).on('mousemove', (e) => {
    if (!dragging) return;
    const { selectedId } = store.getState();
    if (!selectedId) return;
    const pos = pageToCanvas(e.pageX, e.pageY);

    if (dragType === 'endpoint') {
      store.getState().moveLineEndpoint(selectedId, dragEp, pos.x, pos.y);
    } else if (dragType === 'waypoint') {
      store.getState().moveLineWaypoint(selectedId, dragWpIdx, pos.x, pos.y);
    }
  });

  $(document).on('mouseup', (e) => {
    if (!dragging || dragType !== 'endpoint') { dragging = false; dragType = null; return; }
    const { selectedId } = store.getState();
    if (!selectedId) { dragging = false; dragType = null; return; }
    const pos = pageToCanvas(e.pageX, e.pageY);
    const snap = findSnapTarget(pos.x, pos.y, selectedId);
    store.getState().finalizeLineEndpoint(selectedId, dragEp, pos.x, pos.y, snap);
    dragging = false;
    dragType = null;
  });

  store.subscribe(() => renderLineHandles());
  renderLineHandles();
}
