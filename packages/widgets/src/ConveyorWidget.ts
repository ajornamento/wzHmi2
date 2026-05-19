// 컨베이어 위젯 커스텀 엘리먼트
import { BaseWidget } from './base/BaseWidget';

export class ConveyorWidget extends BaseWidget {
  private _belt: SVGRectElement | null = null;
  private _animElem: SVGAnimateElement | null = null;
  private _patternId = '';

  protected render() {
    this.innerHTML = '';
    const w = this.offsetWidth || 200;
    const h = this.offsetHeight || 80;
    const beltH = h * 0.45;
    const beltY = (h - beltH) / 2;
    const baseColor = this._widget?.styles.baseColor ?? '#808080';
    this._patternId = `conv-pat-${this._widget?.id ?? Date.now()}`;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const defs = document.createElementNS(ns, 'defs');
    const pattern = document.createElementNS(ns, 'pattern');
    pattern.id = this._patternId;
    pattern.setAttribute('x', '0');
    pattern.setAttribute('y', '0');
    pattern.setAttribute('width', '20');
    pattern.setAttribute('height', String(beltH));
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');

    const patRect = document.createElementNS(ns, 'rect');
    patRect.setAttribute('width', '20');
    patRect.setAttribute('height', String(beltH));
    patRect.setAttribute('fill', baseColor);

    const patLine = document.createElementNS(ns, 'line');
    patLine.setAttribute('x1', '10');
    patLine.setAttribute('y1', '0');
    patLine.setAttribute('x2', '10');
    patLine.setAttribute('y2', String(beltH));
    patLine.setAttribute('stroke', 'rgba(0,0,0,0.3)');
    patLine.setAttribute('stroke-width', '2');

    const anim = document.createElementNS(ns, 'animate');
    anim.setAttribute('attributeName', 'x');
    anim.setAttribute('from', '0');
    anim.setAttribute('to', '20');
    anim.setAttribute('dur', '0.8s');
    anim.setAttribute('repeatCount', 'indefinite');
    anim.setAttribute('begin', 'indefinite');
    this._animElem = anim;
    pattern.appendChild(anim);

    pattern.appendChild(patRect);
    pattern.appendChild(patLine);
    defs.appendChild(pattern);
    svg.appendChild(defs);

    const roller1 = document.createElementNS(ns, 'circle');
    roller1.setAttribute('cx', String(beltH / 2));
    roller1.setAttribute('cy', String(h / 2));
    roller1.setAttribute('r', String(beltH / 2));
    roller1.setAttribute('fill', '#555');

    const roller2 = document.createElementNS(ns, 'circle');
    roller2.setAttribute('cx', String(w - beltH / 2));
    roller2.setAttribute('cy', String(h / 2));
    roller2.setAttribute('r', String(beltH / 2));
    roller2.setAttribute('fill', '#555');

    const belt = document.createElementNS(ns, 'rect');
    belt.setAttribute('x', String(beltH / 2));
    belt.setAttribute('y', String(beltY));
    belt.setAttribute('width', String(w - beltH));
    belt.setAttribute('height', String(beltH));
    belt.setAttribute('fill', `url(#${this._patternId})`);
    this._belt = belt;

    const topLine = document.createElementNS(ns, 'line');
    topLine.setAttribute('x1', String(beltH / 2));
    topLine.setAttribute('y1', String(beltY));
    topLine.setAttribute('x2', String(w - beltH / 2));
    topLine.setAttribute('y2', String(beltY));
    topLine.setAttribute('stroke', '#333');
    topLine.setAttribute('stroke-width', '2');

    const botLine = document.createElementNS(ns, 'line');
    botLine.setAttribute('x1', String(beltH / 2));
    botLine.setAttribute('y1', String(beltY + beltH));
    botLine.setAttribute('x2', String(w - beltH / 2));
    botLine.setAttribute('y2', String(beltY + beltH));
    botLine.setAttribute('stroke', '#333');
    botLine.setAttribute('stroke-width', '2');

    svg.appendChild(roller1);
    svg.appendChild(roller2);
    svg.appendChild(belt);
    svg.appendChild(topLine);
    svg.appendChild(botLine);
    this.appendChild(svg);

    this._labelElement = this.createLabelElement(this._widget?.properties.label ?? 'CONVEYOR', this.getLabelSide());
    this.appendChild(this._labelElement);

    this.updateVisuals();
  }

  protected updateVisuals() {
    if (!this._widget) return;
    this.stopBlink();
    this.stopPulse();
    const isRunning = Number(this._value) === 1;

    if (this._animElem) {
      if (isRunning) {
        this._animElem.beginElement();
      } else {
        this._animElem.endElement();
      }
    }

    const anim = this.getActiveAnimation();
    const color = anim ? anim.value : this._widget.styles.baseColor;
    if (this._labelElement && this._widget) this._labelElement.textContent = this._widget.properties.label as string ?? 'CONVEYOR';
    if (anim?.effect === 'blink') this.startBlink(color);
    else if (anim?.effect === 'pulse') this.startPulse(color);
    else this.stopBlink(), this.stopPulse();
  }

  protected applyColor(_color: string) {}
}

customElements.define('hmi-conveyor', ConveyorWidget);
