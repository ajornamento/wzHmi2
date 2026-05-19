// 파이프 위젯 커스텀 엘리먼트 (3D 실린더 외관, 흐름 애니메이션 지원)
import { BaseWidget } from './base/BaseWidget';

export class PipeWidget extends BaseWidget {
  private _gradStop0: SVGStopElement | null = null;
  private _gradStop1: SVGStopElement | null = null;
  private _gradStop2: SVGStopElement | null = null;
  private _gradStop3: SVGStopElement | null = null;
  private _gradStop4: SVGStopElement | null = null;
  private _flowPath: SVGPathElement | null = null;
  private _flowInterval: ReturnType<typeof setInterval> | null = null;
  private _flowOffset = 0;

  protected render() {
    this.innerHTML = '';
    if (!this._widget) return;

    const w = this.offsetWidth || 160;
    const h = this.offsetHeight || 40;
    const p = this._widget.properties;
    const orientation = String(p.orientation ?? 'horizontal');
    const showFlanges = p.flanges !== false;
    const flangeSize = Number(p.flangeSize ?? 8);
    const color = this._widget.styles.baseColor;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const defs = document.createElementNS(ns, 'defs');
    const gradId = `pg-${this._widget.id}`;
    const grad = document.createElementNS(ns, 'linearGradient') as SVGLinearGradientElement;
    grad.id = gradId;
    grad.setAttribute('gradientUnits', 'objectBoundingBox');

    if (orientation === 'horizontal') {
      grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
      grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    } else {
      grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
      grad.setAttribute('x2', '1'); grad.setAttribute('y2', '0');
    }

    const s0 = makeStop(ns, '0%',   adjustBrightness(color,  80));
    const s1 = makeStop(ns, '25%',  adjustBrightness(color,  25));
    const s2 = makeStop(ns, '50%',  color);
    const s3 = makeStop(ns, '78%',  adjustBrightness(color, -35));
    const s4 = makeStop(ns, '100%', adjustBrightness(color, -60));
    this._gradStop0 = s0;
    this._gradStop1 = s1;
    this._gradStop2 = s2;
    this._gradStop3 = s3;
    this._gradStop4 = s4;
    [s0, s1, s2, s3, s4].forEach(s => grad.appendChild(s));
    defs.appendChild(grad);
    svg.appendChild(defs);

    let flowD = '';
    let flowSW = 0;

    if (orientation === 'horizontal') {
      const pipeH = Math.max(h * 0.65, 6);
      const pipeY = (h - pipeH) / 2;
      const innerX = showFlanges ? flangeSize : 0;
      const innerW = w - (showFlanges ? flangeSize * 2 : 0);

      const pipe = document.createElementNS(ns, 'rect');
      pipe.setAttribute('x', '0');
      pipe.setAttribute('y', String(pipeY));
      pipe.setAttribute('width', String(w));
      pipe.setAttribute('height', String(pipeH));
      pipe.setAttribute('fill', `url(#${gradId})`);
      svg.appendChild(pipe);

      if (showFlanges) {
        for (const fx of [0, w - flangeSize]) {
          addFlange(svg, ns, fx, pipeY - flangeSize, flangeSize, pipeH + flangeSize * 2, adjustBrightness(color, -35));
        }
      }

      flowD = `M${innerX},${h / 2} L${innerX + innerW},${h / 2}`;
      flowSW = pipeH * 0.45;
    } else {
      const pipeW = Math.max(w * 0.65, 6);
      const pipeX = (w - pipeW) / 2;
      const innerY = showFlanges ? flangeSize : 0;
      const innerH = h - (showFlanges ? flangeSize * 2 : 0);

      const pipe = document.createElementNS(ns, 'rect');
      pipe.setAttribute('x', String(pipeX));
      pipe.setAttribute('y', '0');
      pipe.setAttribute('width', String(pipeW));
      pipe.setAttribute('height', String(h));
      pipe.setAttribute('fill', `url(#${gradId})`);
      svg.appendChild(pipe);

      if (showFlanges) {
        for (const fy of [0, h - flangeSize]) {
          addFlange(svg, ns, pipeX - flangeSize, fy, pipeW + flangeSize * 2, flangeSize, adjustBrightness(color, -35));
        }
      }

      flowD = `M${w / 2},${innerY} L${w / 2},${innerY + innerH}`;
      flowSW = pipeW * 0.45;
    }

    const flowPath = document.createElementNS(ns, 'path');
    flowPath.setAttribute('d', flowD);
    flowPath.setAttribute('fill', 'none');
    flowPath.setAttribute('stroke-width', String(flowSW));
    flowPath.setAttribute('stroke-linecap', 'butt');
    flowPath.style.display = 'none';
    this._flowPath = flowPath;
    svg.appendChild(flowPath);

    this.appendChild(svg);

    const labelText = String(p.label ?? '');
    if (labelText) {
      this._labelElement = this.createLabelElement(labelText, this.getLabelSide());
      this.appendChild(this._labelElement);
    }

    this.updateVisuals();
  }

  protected updateVisuals() {
    if (!this._widget) return;
    this.stopBlink();
    this.stopPulse();
    this.stopFlow();

    const anim = this.getActiveAnimation();
    const baseColor = this._widget.styles.baseColor;
    const color = anim ? anim.value : baseColor;

    this.applyGradient(color);

    if (this._labelElement) {
      this._labelElement.textContent = String(this._widget.properties.label ?? '');
    }

    if (anim?.effect === 'flow') {
      this.startFlow(anim.value);
    } else if (anim?.effect === 'blink') {
      this.startBlink(color);
    } else if (anim?.effect === 'pulse') {
      this.startPulse(color);
    }
  }

  protected applyColor(color: string) {
    this.applyGradient(color);
  }

  private applyGradient(color: string) {
    this._gradStop0?.setAttribute('stop-color', adjustBrightness(color,  80));
    this._gradStop1?.setAttribute('stop-color', adjustBrightness(color,  25));
    this._gradStop2?.setAttribute('stop-color', color);
    this._gradStop3?.setAttribute('stop-color', adjustBrightness(color, -35));
    this._gradStop4?.setAttribute('stop-color', adjustBrightness(color, -60));
  }

  private startFlow(color: string) {
    this.stopFlow();
    if (!this._flowPath || !this._widget) return;

    const speed = Number(this._widget.properties.flowSpeed ?? 3);
    const dashLen = 20;
    const gapLen = 12;
    const period = dashLen + gapLen;
    const flowColor = adjustBrightness(color, 70);

    this._flowPath.setAttribute('stroke', flowColor);
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
    if (this._flowPath) this._flowPath.style.display = 'none';
    this._flowOffset = 0;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopFlow();
  }
}

function makeStop(ns: string, offset: string, color: string): SVGStopElement {
  const stop = document.createElementNS(ns, 'stop') as SVGStopElement;
  stop.setAttribute('offset', offset);
  stop.setAttribute('stop-color', color);
  return stop;
}

function addFlange(
  svg: SVGSVGElement, ns: string,
  x: number, y: number, w: number, h: number, color: string,
) {
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', String(x));
  rect.setAttribute('y', String(y));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('fill', color);
  rect.setAttribute('rx', '1');
  svg.appendChild(rect);
}

function adjustBrightness(hex: string, amount: number): string {
  const clean = hex.replace('#', '').padEnd(6, '0');
  const r = Math.max(0, Math.min(255, parseInt(clean.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(clean.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(clean.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

customElements.define('hmi-pipe', PipeWidget);
