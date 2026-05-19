// 모터 위젯 커스텀 엘리먼트
import { BaseWidget } from './base/BaseWidget';

export class MotorWidget extends BaseWidget {
  private _svg: SVGSVGElement | null = null;
  private _body: SVGCircleElement | null = null;
  private _indicator: SVGLineElement | null = null;
  private _rotateAnim: SVGAnimateTransformElement | null = null;

  protected render() {
    this.innerHTML = '';
    const w = this.offsetWidth || 120;
    const h = this.offsetHeight || 120;
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.4;
    const baseColor = this._widget?.styles.baseColor ?? '#808080';

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const defs = document.createElementNS(ns, 'defs');
    const grad = document.createElementNS(ns, 'radialGradient');
    grad.id = `motor-grad-${this._widget?.id ?? 'default'}`;
    grad.innerHTML = `
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.2"/>
    `;
    defs.appendChild(grad);
    svg.appendChild(defs);

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', baseColor);
    circle.setAttribute('stroke', '#555');
    circle.setAttribute('stroke-width', '2');
    this._body = circle;

    const gloss = document.createElementNS(ns, 'circle');
    gloss.setAttribute('cx', String(cx));
    gloss.setAttribute('cy', String(cy));
    gloss.setAttribute('r', String(r));
    gloss.setAttribute('fill', `url(#${grad.id})`);

    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${cx},${cy})`);

    const spinG = document.createElementNS(ns, 'g');

    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', String(-r * 0.6));
    line.setAttribute('x2', '0');
    line.setAttribute('y2', String(r * 0.6));
    line.setAttribute('stroke', '#fff');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    this._indicator = line;

    const anim = document.createElementNS(ns, 'animateTransform');
    anim.setAttribute('attributeName', 'transform');
    anim.setAttribute('type', 'rotate');
    anim.setAttribute('from', '0 0 0');
    anim.setAttribute('to', '360 0 0');
    anim.setAttribute('dur', '1.5s');
    anim.setAttribute('repeatCount', 'indefinite');
    anim.setAttribute('begin', 'indefinite');
    this._rotateAnim = anim;
    spinG.appendChild(line);
    spinG.appendChild(anim);
    g.appendChild(spinG);

    svg.appendChild(circle);
    svg.appendChild(gloss);
    svg.appendChild(g);
    this._svg = svg;
    this.appendChild(svg);

    this._labelElement = this.createLabelElement(this._widget?.properties.label ?? 'MOTOR', this.getLabelSide());
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

    if (anim?.effect === 'blink') {
      this.startBlink(color);
    } else if (anim?.effect === 'pulse') {
      this.startPulse(color);
    } else {
      this.stopBlink();
      this.stopPulse();
    }

    const isRunning = Number(this._value) === 1;
    if (this._rotateAnim) {
      if (isRunning) {
        this._rotateAnim.beginElement();
      } else {
        this._rotateAnim.endElement();
      }
    }

    if (this._labelElement && this._widget) {
      this._labelElement.textContent = this._widget.properties.label as string ?? 'MOTOR';
    }
  }

  protected applyColor(color: string) {
    this._body?.setAttribute('fill', color);
  }
}

customElements.define('hmi-motor', MotorWidget);
