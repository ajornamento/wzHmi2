// 탱크 위젯 커스텀 엘리먼트
import { BaseWidget } from './base/BaseWidget';

export class TankWidget extends BaseWidget {
  private _fill: SVGRectElement | null = null;
  private _valueText: SVGTextElement | null = null;
  private _tankH = 0;
  private _tankY = 0;
  private _maxFillH = 0;

  protected render() {
    this.innerHTML = '';
    const w = this.offsetWidth || 100;
    const h = this.offsetHeight || 160;
    const tankW = w * 0.6;
    const tankX = (w - tankW) / 2;
    const tankH = h * 0.7;
    const tankY = h * 0.1;
    this._tankH = tankH;
    this._tankY = tankY;
    this._maxFillH = tankH - 4;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const outline = document.createElementNS(ns, 'rect');
    outline.setAttribute('x', String(tankX));
    outline.setAttribute('y', String(tankY));
    outline.setAttribute('width', String(tankW));
    outline.setAttribute('height', String(tankH));
    outline.setAttribute('fill', 'rgba(40,40,60,0.8)');
    outline.setAttribute('stroke', '#666');
    outline.setAttribute('stroke-width', '2');
    outline.setAttribute('rx', '4');

    const fill = document.createElementNS(ns, 'rect');
    fill.setAttribute('x', String(tankX + 2));
    fill.setAttribute('y', String(tankY + tankH - 2));
    fill.setAttribute('width', String(tankW - 4));
    fill.setAttribute('height', '0');
    fill.setAttribute('fill', this._widget?.styles.baseColor ?? '#0088ff');
    fill.setAttribute('rx', '2');
    this._fill = fill;

    const inletW = tankW * 0.2, inletH = tankY;
    const inlet = document.createElementNS(ns, 'rect');
    inlet.setAttribute('x', String(tankX + tankW / 2 - inletW / 2));
    inlet.setAttribute('y', '0');
    inlet.setAttribute('width', String(inletW));
    inlet.setAttribute('height', String(inletH));
    inlet.setAttribute('fill', '#555');

    const outletH = (h - (tankY + tankH)) * 0.6;
    const outlet = document.createElementNS(ns, 'rect');
    outlet.setAttribute('x', String(tankX + tankW / 2 - inletW / 2));
    outlet.setAttribute('y', String(tankY + tankH));
    outlet.setAttribute('width', String(inletW));
    outlet.setAttribute('height', String(outletH));
    outlet.setAttribute('fill', '#555');


    const valueText = document.createElementNS(ns, 'text');
    valueText.setAttribute('x', String(tankX + tankW / 2));
    valueText.setAttribute('y', String(tankY + tankH / 2 + 5));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('font-size', String(this._widget?.properties.fontSize ?? 12));
    valueText.setAttribute('font-family', this.getLabelFontFamily());
    valueText.setAttribute('font-weight', 'bold');
    valueText.setAttribute('fill', '#fff');
    valueText.textContent = '0%';
    this._valueText = valueText;

    svg.appendChild(outline);
    svg.appendChild(fill);
    svg.appendChild(inlet);
    svg.appendChild(outlet);
    svg.appendChild(valueText);
    this.appendChild(svg);

    this._labelElement = this.createLabelElement(this._widget?.properties.label ?? 'TANK', this.getLabelSide());
    this.appendChild(this._labelElement);

    this.updateVisuals();
  }

  protected updateVisuals() {
    if (!this._widget || !this._fill) return;
    this.stopBlink();
    this.stopPulse();
    const min = Number(this._widget.properties.min ?? 0);
    const max = Number(this._widget.properties.max ?? 100);
    const val = Math.min(Math.max(Number(this._value), min), max);
    const pct = (val - min) / (max - min);
    const fillH = pct * this._maxFillH;

    this._fill.setAttribute('y', String(this._tankY + this._tankH - 2 - fillH));
    this._fill.setAttribute('height', String(fillH));

    const anim = this.getActiveAnimation();
    const color = anim ? anim.value : this._widget.styles.baseColor;
    this._fill.setAttribute('fill', color);

    if (this._valueText) {
      this._valueText.textContent = this.getDisplayValue();
    }

    if (this._labelElement) {
      this._labelElement.textContent = this._widget.properties.label as string ?? 'TANK';
    }

    if (anim?.effect === 'blink') this.startBlink(color);
    else if (anim?.effect === 'pulse') this.startPulse(color);
    else this.stopBlink(), this.stopPulse();
  }

  protected applyColor(color: string) {
    this._fill?.setAttribute('fill', color);
  }
}

customElements.define('hmi-tank', TankWidget);
