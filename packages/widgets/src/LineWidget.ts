import { BaseWidget } from './base/BaseWidget';

const PAD = 8;

export class LineWidget extends BaseWidget {
  private _path: SVGPathElement | null = null;
  private _flowPath: SVGPathElement | null = null;
  private _flowInterval: ReturnType<typeof setInterval> | null = null;
  private _flowOffset = 0;

  protected render() {
    this.innerHTML = '';
    if (!this._widget) return;

    const p = this._widget.properties;
    const x1 = Number(p.x1 ?? 0);
    const y1 = Number(p.y1 ?? 0);
    const x2 = Number(p.x2 ?? 100);
    const y2 = Number(p.y2 ?? 0);
    const waypoints = (p.waypoints as Array<{ x: number; y: number }> | undefined) ?? [];

    const allX = [x1, x2, ...waypoints.map(wp => wp.x)];
    const allY = [y1, y2, ...waypoints.map(wp => wp.y)];
    const bboxX = Math.min(...allX) - PAD;
    const bboxY = Math.min(...allY) - PAD;
    const w = Math.max(Math.max(...allX) - Math.min(...allX) + PAD * 2, 20);
    const h = Math.max(Math.max(...allY) - Math.min(...allY) + PAD * 2, 20);
    const lx1 = x1 - bboxX;
    const ly1 = y1 - bboxY;
    const lx2 = x2 - bboxX;
    const ly2 = y2 - bboxY;
    const localWaypoints = waypoints.map(wp => ({ x: wp.x - bboxX, y: wp.y - bboxY }));

    const color = this._widget.styles.baseColor;
    const lineWidth = Number(p.lineWidth ?? 2);
    const lineStyle = String(p.lineStyle ?? 'solid');
    const lineType = String(p.lineType ?? 'straight');
    const arrowEnd = p.arrowEnd !== false;
    const arrowStart = !!p.arrowStart;
    const arrowSize = Number(p.arrowSize ?? 10);
    const markerId = `lm-${this._widget.id}`;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('overflow', 'visible');

    const defs = document.createElementNS(ns, 'defs');
    if (arrowEnd)   defs.appendChild(makeArrow(`${markerId}-e`, color, false, arrowSize));
    if (arrowStart) defs.appendChild(makeArrow(`${markerId}-s`, color, true, arrowSize));
    svg.appendChild(defs);

    const d = buildPath(lx1, ly1, lx2, ly2, lineType, localWaypoints);

    // 클릭 영역 (투명, 넓게)
    const hit = document.createElementNS(ns, 'path');
    hit.setAttribute('d', d);
    hit.setAttribute('stroke', 'transparent');
    hit.setAttribute('stroke-width', String(Math.max(lineWidth + 10, 14)));
    hit.setAttribute('fill', 'none');
    svg.appendChild(hit);

    // 실제 라인 (파이프 역할 - 항상 표시)
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', String(lineWidth));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    if (lineStyle === 'dashed') path.setAttribute('stroke-dasharray', `${lineWidth * 5} ${lineWidth * 3}`);
    if (lineStyle === 'dotted') path.setAttribute('stroke-dasharray', `${lineWidth} ${lineWidth * 3}`);
    if (arrowEnd)   path.setAttribute('marker-end',   `url(#${markerId}-e)`);
    if (arrowStart) path.setAttribute('marker-start', `url(#${markerId}-s)`);
    this._path = path;
    svg.appendChild(path);

    // 흐름 애니메이션 오버레이 (이동하는 대시 - 비활성 시 숨김)
    const flowPath = document.createElementNS(ns, 'path');
    flowPath.setAttribute('d', d);
    flowPath.setAttribute('fill', 'none');
    flowPath.setAttribute('stroke-linecap', 'round');
    flowPath.setAttribute('stroke-linejoin', 'round');
    flowPath.style.display = 'none';
    this._flowPath = flowPath;
    svg.appendChild(flowPath);

    // 라벨 (중간점)
    const labelText = String(p.label ?? '');
    if (labelText) {
      this._labelElement = this.createLabelElement(labelText, this.getLabelSide());
      this.appendChild(this._labelElement);
    }

    this.appendChild(svg);
    this.updateVisuals();
  }

  protected updateVisuals() {
    if (!this._path || !this._widget) return;
    this.stopBlink();
    this.stopPulse();
    this.stopFlow();

    const anim = this.getActiveAnimation();
    const baseColor = this._widget.styles.baseColor;
    const color = anim ? anim.value : baseColor;

    // 파이프 선은 항상 기본 색상으로 복원
    this._path.setAttribute('stroke', baseColor);
    if (this._labelElement) {
      this._labelElement.textContent = String(this._widget.properties.label ?? '');
    }

    if (anim?.effect === 'flow') {
      this.startFlow(anim.value);
    } else if (anim?.effect === 'blink') {
      this._path.setAttribute('stroke', color);
      this.startBlink(color);
    } else if (anim?.effect === 'pulse') {
      this._path.setAttribute('stroke', color);
      this.startPulse(color);
    } else if (anim) {
      this._path.setAttribute('stroke', color);
    }
  }

  protected applyColor(color: string) {
    this._path?.setAttribute('stroke', color);
  }

  private startFlow(color: string) {
    this.stopFlow();
    if (!this._flowPath || !this._widget) return;

    const lineWidth = Number(this._widget.properties.lineWidth ?? 2);
    const speed = Number(this._widget.properties.flowSpeed ?? 2);
    const dashLen = Math.max(lineWidth * 5, 10);
    const gapLen = Math.max(lineWidth * 3, 6);
    const period = dashLen + gapLen;

    this._flowPath.setAttribute('stroke', color);
    this._flowPath.setAttribute('stroke-width', String(lineWidth + 1));
    this._flowPath.setAttribute('stroke-dasharray', `${dashLen} ${gapLen}`);
    this._flowPath.setAttribute('stroke-dashoffset', '0');
    this._flowPath.style.display = '';

    this._flowInterval = setInterval(() => {
      this._flowOffset -= speed;
      if (this._flowOffset <= -period) this._flowOffset += period;
      this._flowPath?.setAttribute('stroke-dashoffset', String(this._flowOffset));
    }, 40);
  }

  private stopFlow() {
    if (this._flowInterval !== null) {
      clearInterval(this._flowInterval);
      this._flowInterval = null;
    }
    if (this._flowPath) {
      this._flowPath.style.display = 'none';
    }
    this._flowOffset = 0;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopFlow();
  }
}

function buildPath(x1: number, y1: number, x2: number, y2: number, type: string, waypoints: Array<{ x: number; y: number }> = []): string {
  const allPts = [{ x: x1, y: y1 }, ...waypoints, { x: x2, y: y2 }];
  if (allPts.length > 2) {
    return allPts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ');
  }
  if (type === 'orthogonal') {
    const mx = x1;
    const my = y2;
    return `M${x1},${y1} L${mx},${my} L${x2},${y2}`;
  }
  if (type === 'curved') {
    const cpx = (x1 + x2) / 2;
    return `M${x1},${y1} Q${cpx},${y1} ${x2},${y2}`;
  }
  return `M${x1},${y1} L${x2},${y2}`;
}

function makeArrow(id: string, color: string, reverse: boolean, arrowSize: number = 10): SVGMarkerElement {
  const ns = 'http://www.w3.org/2000/svg';
  const marker = document.createElementNS(ns, 'marker') as SVGMarkerElement;
  marker.id = id;
  const h = arrowSize * 0.7;
  marker.setAttribute('markerUnits', 'userSpaceOnUse');
  marker.setAttribute('markerWidth', String(arrowSize));
  marker.setAttribute('markerHeight', String(h));
  marker.setAttribute('refX', reverse ? '1' : String(arrowSize));
  marker.setAttribute('refY', String(h / 2));
  marker.setAttribute('orient', reverse ? 'auto-start-reverse' : 'auto');
  const poly = document.createElementNS(ns, 'polygon');
  poly.setAttribute('points', `0 0, ${arrowSize} ${h / 2}, 0 ${h}`);
  poly.setAttribute('fill', color);
  marker.appendChild(poly);
  return marker;
}

customElements.define('hmi-line', LineWidget);
