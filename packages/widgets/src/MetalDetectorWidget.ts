// HACCP 금속검출기 위젯 - 금속 이물질 검출 알람 상태 표시
import { BaseWidget } from './base/BaseWidget';

export class MetalDetectorWidget extends BaseWidget {
  private _leftLed: SVGCircleElement | null = null;
  private _rightLed: SVGCircleElement | null = null;
  private _archEls: SVGElement[] = [];
  private _glowEl: SVGRectElement | null = null;
  private _countText: SVGTextElement | null = null;
  private _animFrame: number | null = null;
  private _phase = 0;
  private _hasSetValue = false;

  configure(widget: import('@wzhmi/core').Widget) {
    this._stopAnim();
    this._hasSetValue = false;
    super.configure(widget);
  }

  setValue(value: number | string | boolean) {
    this._hasSetValue = true;
    super.setValue(value);
  }

  protected render() {
    this.innerHTML = '';
    if (!this._widget) return;

    const W = this.offsetWidth || 120;
    const H = this.offsetHeight || 100;
    const ns = 'http://www.w3.org/2000/svg';
    const rotation = this._widget.geometry.rotation ?? 0;

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    Object.assign(svg.style, {
      width: '100%', height: '100%', display: 'block', overflow: 'visible',
      transform: rotation ? `rotate(${-rotation}deg)` : '',
      transformOrigin: 'center center',
    });

    const bx = 2, by = 2, bw = W - 4;
    const pillarW = Math.round(W * 0.21);
    const archH = Math.round(H * 0.80);
    const barH = Math.round(H * 0.14);
    const openX = bx + pillarW;
    const openW = bw - 2 * pillarW;
    const openH = archH - barH;
    const openY = by + barH;

    const convH = Math.round(H * 0.12);
    const convY = by + archH - convH - 1;
    const convX = openX + 2;
    const convW = openW - 4;

    const baseY = by + archH + 2;
    const baseH = H - baseY - 2;

    // 알람 글로우 레이어
    const glow = document.createElementNS(ns, 'rect');
    glow.setAttribute('x', String(bx)); glow.setAttribute('y', String(by));
    glow.setAttribute('width', String(bw)); glow.setAttribute('height', String(archH));
    glow.setAttribute('rx', '3');
    glow.setAttribute('fill', 'rgba(255,50,0,0.28)');
    glow.setAttribute('opacity', '0');
    this._glowEl = glow as SVGRectElement;
    svg.appendChild(glow);

    this._archEls = [];

    // 왼쪽 기둥
    const lp = document.createElementNS(ns, 'rect');
    lp.setAttribute('x', String(bx)); lp.setAttribute('y', String(by));
    lp.setAttribute('width', String(pillarW)); lp.setAttribute('height', String(archH));
    lp.setAttribute('rx', '2'); lp.setAttribute('fill', '#3a3a4a');
    lp.setAttribute('stroke', '#556677'); lp.setAttribute('stroke-width', '1');
    this._archEls.push(lp); svg.appendChild(lp);

    const lph = document.createElementNS(ns, 'rect');
    lph.setAttribute('x', String(bx + 2)); lph.setAttribute('y', String(by + 2));
    lph.setAttribute('width', '3'); lph.setAttribute('height', String(archH - 4));
    lph.setAttribute('rx', '1'); lph.setAttribute('fill', 'rgba(255,255,255,0.07)');
    svg.appendChild(lph);

    // 오른쪽 기둥
    const rp = document.createElementNS(ns, 'rect');
    rp.setAttribute('x', String(openX + openW)); rp.setAttribute('y', String(by));
    rp.setAttribute('width', String(pillarW)); rp.setAttribute('height', String(archH));
    rp.setAttribute('rx', '2'); rp.setAttribute('fill', '#3a3a4a');
    rp.setAttribute('stroke', '#556677'); rp.setAttribute('stroke-width', '1');
    this._archEls.push(rp); svg.appendChild(rp);

    const rph = document.createElementNS(ns, 'rect');
    rph.setAttribute('x', String(openX + openW + 2)); rph.setAttribute('y', String(by + 2));
    rph.setAttribute('width', '3'); rph.setAttribute('height', String(archH - 4));
    rph.setAttribute('rx', '1'); rph.setAttribute('fill', 'rgba(255,255,255,0.07)');
    svg.appendChild(rph);

    // 상단 가로바
    const tb = document.createElementNS(ns, 'rect');
    tb.setAttribute('x', String(openX)); tb.setAttribute('y', String(by));
    tb.setAttribute('width', String(openW)); tb.setAttribute('height', String(barH));
    tb.setAttribute('fill', '#3a3a4a');
    tb.setAttribute('stroke', '#556677'); tb.setAttribute('stroke-width', '1');
    this._archEls.push(tb); svg.appendChild(tb);

    if (openW > 30) {
      const barLbl = document.createElementNS(ns, 'text');
      barLbl.setAttribute('x', String(openX + openW / 2));
      barLbl.setAttribute('y', String(by + barH * 0.74));
      barLbl.setAttribute('text-anchor', 'middle');
      barLbl.setAttribute('font-size', String(Math.max(5, Math.round(barH * 0.52))));
      barLbl.setAttribute('font-family', 'monospace');
      barLbl.setAttribute('fill', '#6688aa');
      barLbl.textContent = 'M·D';
      svg.appendChild(barLbl);
    }

    // 아치 내부 (어두운 개구부)
    const opening = document.createElementNS(ns, 'rect');
    opening.setAttribute('x', String(openX)); opening.setAttribute('y', String(openY));
    opening.setAttribute('width', String(openW)); opening.setAttribute('height', String(openH));
    opening.setAttribute('fill', '#0e0e18');
    svg.appendChild(opening);

    // 컨베이어 벨트
    const conv = document.createElementNS(ns, 'rect');
    conv.setAttribute('x', String(convX)); conv.setAttribute('y', String(convY));
    conv.setAttribute('width', String(convW)); conv.setAttribute('height', String(convH));
    conv.setAttribute('fill', '#252530'); conv.setAttribute('stroke', '#444');
    conv.setAttribute('stroke-width', '0.5');
    svg.appendChild(conv);

    const stripeCount = Math.max(3, Math.round(convW / 9));
    for (let i = 1; i < stripeCount; i++) {
      const sx = convX + Math.round(convW * i / stripeCount);
      const stripe = document.createElementNS(ns, 'line');
      stripe.setAttribute('x1', String(sx)); stripe.setAttribute('y1', String(convY));
      stripe.setAttribute('x2', String(sx)); stripe.setAttribute('y2', String(convY + convH));
      stripe.setAttribute('stroke', '#333'); stripe.setAttribute('stroke-width', '0.5');
      svg.appendChild(stripe);
    }

    const convHL = document.createElementNS(ns, 'rect');
    convHL.setAttribute('x', String(convX)); convHL.setAttribute('y', String(convY));
    convHL.setAttribute('width', String(convW)); convHL.setAttribute('height', '2');
    convHL.setAttribute('fill', 'rgba(255,255,255,0.10)');
    svg.appendChild(convHL);

    // LED 양쪽 기둥
    const ledR = Math.max(3, Math.round(pillarW * 0.22));
    const ledCy = openY + Math.round(openH * 0.28);

    const leftLed = document.createElementNS(ns, 'circle');
    leftLed.setAttribute('cx', String(bx + Math.round(pillarW / 2)));
    leftLed.setAttribute('cy', String(ledCy)); leftLed.setAttribute('r', String(ledR));
    leftLed.setAttribute('fill', '#222');
    this._leftLed = leftLed as SVGCircleElement;
    svg.appendChild(leftLed);

    const leftLedHL = document.createElementNS(ns, 'circle');
    leftLedHL.setAttribute('cx', String(bx + Math.round(pillarW / 2) - 1));
    leftLedHL.setAttribute('cy', String(ledCy - 1)); leftLedHL.setAttribute('r', '1.2');
    leftLedHL.setAttribute('fill', 'rgba(255,255,255,0.35)');
    svg.appendChild(leftLedHL);

    const rightLed = document.createElementNS(ns, 'circle');
    rightLed.setAttribute('cx', String(openX + openW + Math.round(pillarW / 2)));
    rightLed.setAttribute('cy', String(ledCy)); rightLed.setAttribute('r', String(ledR));
    rightLed.setAttribute('fill', '#222');
    this._rightLed = rightLed as SVGCircleElement;
    svg.appendChild(rightLed);

    const rightLedHL = document.createElementNS(ns, 'circle');
    rightLedHL.setAttribute('cx', String(openX + openW + Math.round(pillarW / 2) - 1));
    rightLedHL.setAttribute('cy', String(ledCy - 1)); rightLedHL.setAttribute('r', '1.2');
    rightLedHL.setAttribute('fill', 'rgba(255,255,255,0.35)');
    svg.appendChild(rightLedHL);

    // 하단 베이스 플레이트 + 감지 카운트 표시
    const base = document.createElementNS(ns, 'rect');
    base.setAttribute('x', String(bx)); base.setAttribute('y', String(baseY));
    base.setAttribute('width', String(bw)); base.setAttribute('height', String(Math.max(baseH, 10)));
    base.setAttribute('rx', '1'); base.setAttribute('fill', '#282838');
    base.setAttribute('stroke', '#445566'); base.setAttribute('stroke-width', '0.5');
    svg.appendChild(base);

    const countText = document.createElementNS(ns, 'text');
    countText.setAttribute('x', String(bx + bw / 2));
    countText.setAttribute('y', String(baseY + Math.max(baseH, 10) * 0.72));
    countText.setAttribute('text-anchor', 'middle');
    countText.setAttribute('font-size', String(Math.max(6, Math.round(Math.max(baseH, 10) * 0.60))));
    countText.setAttribute('font-family', 'monospace');
    countText.setAttribute('fill', '#00cc66');
    countText.textContent = '';
    this._countText = countText as SVGTextElement;
    svg.appendChild(countText);

    const labelText = String(this._widget.properties.label ?? '');
    if (labelText) {
      this.appendChild(this.createLabelElement(labelText, this.getLabelSide()));
    }
    this.appendChild(svg);
    this.updateVisuals();
  }

  protected updateVisuals() {
    if (!this._widget) return;
    this._stopAnim();
    this.stopBlink();
    this.stopPulse();

    const isActive = Number(this._value) !== 0;
    const anim = this.getActiveAnimation();
    const baseColor = this._widget.styles.baseColor;
    const indicatorColor = anim ? anim.value : (isActive ? baseColor : '#333333');

    if (this._leftLed) this._leftLed.setAttribute('fill', indicatorColor);
    if (this._rightLed) this._rightLed.setAttribute('fill', indicatorColor);

    const archFill = isActive ? '#4a2020' : '#3a3a4a';
    const archStroke = isActive ? '#aa4422' : '#556677';
    for (const el of this._archEls) {
      el.setAttribute('fill', archFill);
      (el as SVGElement).setAttribute('stroke', archStroke);
    }

    if (isActive) this._startAlarm();

    if (this._countText) {
      if (!this._hasSetValue) {
        this._countText.textContent = '';
      } else if (isActive) {
        this._countText.setAttribute('fill', baseColor);
        this._countText.textContent = String(this._value);
      } else {
        this._countText.setAttribute('fill', '#00cc66');
        this._countText.textContent = 'OK';
      }
    }

    if (anim?.effect === 'blink') this.startBlink(anim.value);
    else if (anim?.effect === 'pulse') this.startPulse(anim.value);
  }

  protected applyColor(color: string) {
    if (this._leftLed) this._leftLed.setAttribute('fill', color);
    if (this._rightLed) this._rightLed.setAttribute('fill', color);
  }

  private _startAlarm() {
    const animate = () => {
      this._phase += 0.08;
      const intensity = 0.15 + Math.abs(Math.sin(this._phase)) * 0.32;
      if (this._glowEl) this._glowEl.setAttribute('opacity', String(intensity));
      this._animFrame = requestAnimationFrame(animate);
    };
    this._animFrame = requestAnimationFrame(animate);
  }

  private _stopAnim() {
    if (this._animFrame !== null) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
    if (this._glowEl) this._glowEl.setAttribute('opacity', '0');
  }

  disconnectedCallback() {
    this._stopAnim();
    super.disconnectedCallback();
  }
}

customElements.define('hmi-metal-detector', MetalDetectorWidget);
