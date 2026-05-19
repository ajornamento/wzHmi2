// 밸브 위젯 커스텀 엘리먼트
import { BaseWidget } from './base/BaseWidget';

export class ValveWidget extends BaseWidget {
  private _body: SVGPathElement | null = null;
  private _indicator: SVGRectElement | null = null;

  protected render() {
    this.innerHTML = '';
    const w = this.offsetWidth || 120;
    const h = this.offsetHeight || 120;
    const cx = w / 2, cy = h / 2;
    const baseColor = this._widget?.styles.baseColor ?? '#808080';

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const pipeH = h * 0.2;
    const valveW = w * 0.6;
    const valveH = h * 0.6;

    const pipeLeft = document.createElementNS(ns, 'rect');
    pipeLeft.setAttribute('x', '0');
    pipeLeft.setAttribute('y', String(cy - pipeH / 2));
    pipeLeft.setAttribute('width', String(cx - valveW / 2));
    pipeLeft.setAttribute('height', String(pipeH));
    pipeLeft.setAttribute('fill', '#666');

    const pipeRight = document.createElementNS(ns, 'rect');
    pipeRight.setAttribute('x', String(cx + valveW / 2));
    pipeRight.setAttribute('y', String(cy - pipeH / 2));
    pipeRight.setAttribute('width', String(cx - valveW / 2));
    pipeRight.setAttribute('height', String(pipeH));
    pipeRight.setAttribute('fill', '#666');

    const vx = cx - valveW / 2;
    const vy = cy - valveH / 2;
    const body = document.createElementNS(ns, 'path');
    body.setAttribute('d', `M${vx},${cy} L${cx},${vy} L${vx + valveW},${cy} L${cx},${vy + valveH} Z`);
    body.setAttribute('fill', baseColor);
    body.setAttribute('stroke', '#555');
    body.setAttribute('stroke-width', '2');
    this._body = body;

    const stemW = w * 0.06, stemH = h * 0.25;
    const stem = document.createElementNS(ns, 'rect');
    stem.setAttribute('x', String(cx - stemW / 2));
    stem.setAttribute('y', String(cy - valveH / 2 - stemH));
    stem.setAttribute('width', String(stemW));
    stem.setAttribute('height', String(stemH));
    stem.setAttribute('fill', '#999');

    const indW = w * 0.15, indH = h * 0.08;
    const ind = document.createElementNS(ns, 'rect');
    ind.setAttribute('x', String(cx - indW / 2));
    ind.setAttribute('y', String(cy - valveH / 2 - stemH - indH));
    ind.setAttribute('width', String(indW));
    ind.setAttribute('height', String(indH));
    ind.setAttribute('fill', baseColor);
    ind.setAttribute('rx', '2');
    this._indicator = ind;

    svg.appendChild(pipeLeft);
    svg.appendChild(pipeRight);
    svg.appendChild(body);
    svg.appendChild(stem);
    svg.appendChild(ind);
    this.appendChild(svg);

    this._labelElement = this.createLabelElement(this._widget?.properties.label ?? 'VALVE', this.getLabelSide());
    this.appendChild(this._labelElement);

    this.updateVisuals();
  }

  protected updateVisuals() {
    if (!this._body || !this._widget) return;
    this.stopBlink();
    this.stopPulse();

    const anim = this.getActiveAnimation();
    const color = anim ? anim.value : this._widget.styles.baseColor;
    this._body.setAttribute('fill', color);
    this._indicator?.setAttribute('fill', color);

    if (anim?.effect === 'blink') {
      this.startBlink(color);
    } else if (anim?.effect === 'pulse') {
      this.startPulse(color);
    } else {
      this.stopBlink();
      this.stopPulse();
    }

    if (this._labelElement && this._widget) {
      this._labelElement.textContent = this._widget.properties.label as string ?? 'VALVE';
    }
  }

  protected applyColor(color: string) {
    this._body?.setAttribute('fill', color);
    this._indicator?.setAttribute('fill', color);
  }
}

customElements.define('hmi-valve', ValveWidget);
