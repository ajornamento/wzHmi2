// 창고 위젯 커스텀 엘리먼트 (건물 외관, 재고 레벨 표시)
import { BaseWidget } from './base/BaseWidget';

export class WarehouseWidget extends BaseWidget {
  private _fill: SVGRectElement | null = null;
  private _valueText: SVGTextElement | null = null;
  private _maxFillH = 0;
  private _fillBaseY = 0;

  protected render() {
    this.innerHTML = '';
    if (!this._widget) return;

    const W = this.offsetWidth || 120;
    const H = this.offsetHeight || 100;
    const color = this._widget.styles.baseColor;
    const dark = adj(color, -40);
    const light = adj(color, 20);
    const ns = 'http://www.w3.org/2000/svg';

    const roofH = H * 0.28;
    const wallY = roofH;
    const wallH = H - roofH;
    const wallX = W * 0.04;
    const wallW = W * 0.92;

    const fillMargin = wallW * 0.03;
    const fillX = wallX + fillMargin;
    const fillW = wallW - fillMargin * 2;
    this._maxFillH = wallH - H * 0.04;
    this._fillBaseY = wallY + wallH;

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // 벽 배경
    const wallBg = document.createElementNS(ns, 'rect');
    wallBg.setAttribute('x', String(wallX)); wallBg.setAttribute('y', String(wallY));
    wallBg.setAttribute('width', String(wallW)); wallBg.setAttribute('height', String(wallH));
    wallBg.setAttribute('fill', '#1a1a2c');
    svg.appendChild(wallBg);

    // 재고 레벨 채움
    const fill = document.createElementNS(ns, 'rect');
    fill.setAttribute('x', String(fillX)); fill.setAttribute('y', String(this._fillBaseY));
    fill.setAttribute('width', String(fillW)); fill.setAttribute('height', '0');
    fill.setAttribute('fill', color);
    this._fill = fill;
    svg.appendChild(fill);

    // 출입문
    const doorW = wallW * 0.22, doorH = wallH * 0.44;
    const doorX = wallX + (wallW - doorW) / 2;
    const doorY = wallY + wallH - doorH;
    const door = document.createElementNS(ns, 'rect');
    door.setAttribute('x', String(doorX)); door.setAttribute('y', String(doorY));
    door.setAttribute('width', String(doorW)); door.setAttribute('height', String(doorH));
    door.setAttribute('fill', dark); door.setAttribute('rx', '1');
    svg.appendChild(door);

    const doorLine = document.createElementNS(ns, 'line');
    doorLine.setAttribute('x1', String(doorX + doorW / 2)); doorLine.setAttribute('y1', String(doorY));
    doorLine.setAttribute('x2', String(doorX + doorW / 2)); doorLine.setAttribute('y2', String(doorY + doorH));
    doorLine.setAttribute('stroke', '#111'); doorLine.setAttribute('stroke-width', '1');
    svg.appendChild(doorLine);

    // 측면 창문 2개
    for (const wx of [wallX + wallW * 0.1, wallX + wallW * 0.72]) {
      const win = document.createElementNS(ns, 'rect');
      win.setAttribute('x', String(wx)); win.setAttribute('y', String(wallY + wallH * 0.2));
      win.setAttribute('width', String(wallW * 0.14)); win.setAttribute('height', String(wallH * 0.2));
      win.setAttribute('fill', adj(color, -25)); win.setAttribute('stroke', dark);
      win.setAttribute('stroke-width', '1'); win.setAttribute('rx', '1');
      svg.appendChild(win);
    }

    // 벽 외곽선
    const wallOutline = document.createElementNS(ns, 'rect');
    wallOutline.setAttribute('x', String(wallX)); wallOutline.setAttribute('y', String(wallY));
    wallOutline.setAttribute('width', String(wallW)); wallOutline.setAttribute('height', String(wallH));
    wallOutline.setAttribute('fill', 'none');
    wallOutline.setAttribute('stroke', color); wallOutline.setAttribute('stroke-width', '2');
    svg.appendChild(wallOutline);

    // 지붕 (삼각형)
    const roof = document.createElementNS(ns, 'polygon');
    roof.setAttribute('points', `${W / 2},2 ${wallX - 2},${wallY} ${wallX + wallW + 2},${wallY}`);
    roof.setAttribute('fill', light);
    roof.setAttribute('stroke', adj(color, 10)); roof.setAttribute('stroke-width', '1.5');
    svg.appendChild(roof);

    // 값 텍스트
    const txt = document.createElementNS(ns, 'text');
    txt.setAttribute('x', String(W / 2));
    txt.setAttribute('y', String(wallY + wallH * 0.42));
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-size', String(this._widget.properties.fontSize ?? 11));
    txt.setAttribute('font-family', this.getLabelFontFamily());
    txt.setAttribute('fill', '#ccc');
    txt.textContent = '0%';
    this._valueText = txt;
    svg.appendChild(txt);

    this.appendChild(svg);

    const lbl = String(this._widget.properties.label ?? '');
    if (lbl) {
      this._labelElement = this.createLabelElement(lbl, this.getLabelSide());
      this.appendChild(this._labelElement);
    }

    this.updateVisuals();
  }

  protected updateVisuals() {
    if (!this._widget || !this._fill) return;
    this.stopBlink(); this.stopPulse();

    const anim = this.getActiveAnimation();
    const baseColor = this._widget.styles.baseColor;
    const color = anim ? anim.value : baseColor;

    const min = Number(this._widget.properties.min ?? 0);
    const max = Number(this._widget.properties.max ?? 100);
    const val = Math.min(Math.max(Number(this._value), min), max);
    const pct = (val - min) / (max - min);
    const fillH = pct * this._maxFillH;

    this._fill.setAttribute('y', String(this._fillBaseY - fillH));
    this._fill.setAttribute('height', String(fillH));
    this._fill.setAttribute('fill', color);

    if (this._valueText) this._valueText.textContent = this.getDisplayValue();
    if (this._labelElement) this._labelElement.textContent = String(this._widget.properties.label ?? '');

    if (anim?.effect === 'blink') this.startBlink(color);
    else if (anim?.effect === 'pulse') this.startPulse(color);
  }

  protected applyColor(color: string) {
    this._fill?.setAttribute('fill', color);
  }
}

function adj(hex: string, amount: number): string {
  const c = hex.replace('#', '').padEnd(6, '0');
  const r = Math.max(0, Math.min(255, parseInt(c.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(c.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(c.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

customElements.define('hmi-warehouse', WarehouseWidget);
