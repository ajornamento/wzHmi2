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

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function nearestSegment(px: number, py: number, pts: { x: number; y: number }[]): { index: number; dist: number } {
  let minDist = Infinity, minIndex = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSegment(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    if (d < minDist) { minDist = d; minIndex = i; }
  }
  return { index: minIndex, dist: minDist };
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

  const pts = [[x1, y1], ...waypoints.map(p => [p.x, p.y]), [x2, y2]];
  const pointsAttr = pts.map(p => p.join(',')).join(' ');

  // 더블클릭 히트 영역 — 투명하지만 넓은 선폭으로 클릭 감지
  const hitLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  hitLine.setAttribute('points', pointsAttr);
  hitLine.setAttribute('stroke', 'transparent');
  hitLine.setAttribute('stroke-width', '12');
  hitLine.setAttribute('fill', 'none');
  hitLine.setAttribute('class', 'line-body-hit');
  hitLine.style.cursor = 'crosshair';
  svgEl.appendChild(hitLine);

  // 라인 경로 표시
  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', pointsAttr);
  polyline.setAttribute('stroke', '#4a9eff');
  polyline.setAttribute('stroke-width', '2');
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke-dasharray', '4 2');
  polyline.style.pointerEvents = 'none';
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
    const { selectedId, schema } = store.getState();
    if (!selectedId) return;
    const w = schema.widgets.find(x => x.id === selectedId);
    if (!w || w.type !== 'LINE') return;
    const pos = pageToCanvas(e.pageX, e.pageY);
    const wps: Waypoint[] = (w.properties.waypoints as Waypoint[] | undefined) ?? [];
    const allPts = [
      { x: Number(w.properties.x1 ?? 0), y: Number(w.properties.y1 ?? 0) },
      ...wps,
      { x: Number(w.properties.x2 ?? 0), y: Number(w.properties.y2 ?? 0) },
    ];
    const { index } = nearestSegment(pos.x, pos.y, allPts);
    store.getState().addLineWaypoint(selectedId, index, pos.x, pos.y);
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
