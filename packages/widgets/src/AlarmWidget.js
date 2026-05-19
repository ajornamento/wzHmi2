// 경보 위젯 커스텀 엘리먼트
import { BaseWidget } from './base/BaseWidget';
export class AlarmWidget extends BaseWidget {
    constructor() {
        super(...arguments);
        this._light = null;
    }
    render() {
        this.innerHTML = '';
        const w = this.offsetWidth || 80;
        const h = this.offsetHeight || 80;
        const cx = w / 2, cy = h * 0.42;
        const r = Math.min(w, h) * 0.3;
        const baseColor = this._widget?.styles.baseColor ?? '#808080';
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        const defs = document.createElementNS(ns, 'defs');
        const glow = document.createElementNS(ns, 'filter');
        glow.id = `glow-${this._widget?.id ?? 'alarm'}`;
        glow.innerHTML = `
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    `;
        defs.appendChild(glow);
        svg.appendChild(defs);
        const outerRing = document.createElementNS(ns, 'circle');
        outerRing.setAttribute('cx', String(cx));
        outerRing.setAttribute('cy', String(cy));
        outerRing.setAttribute('r', String(r + 4));
        outerRing.setAttribute('fill', '#333');
        outerRing.setAttribute('stroke', '#555');
        outerRing.setAttribute('stroke-width', '2');
        const light = document.createElementNS(ns, 'circle');
        light.setAttribute('cx', String(cx));
        light.setAttribute('cy', String(cy));
        light.setAttribute('r', String(r));
        light.setAttribute('fill', baseColor);
        this._light = light;
        const gloss = document.createElementNS(ns, 'circle');
        gloss.setAttribute('cx', String(cx - r * 0.2));
        gloss.setAttribute('cy', String(cy - r * 0.25));
        gloss.setAttribute('r', String(r * 0.35));
        gloss.setAttribute('fill', 'rgba(255,255,255,0.2)');
        svg.appendChild(outerRing);
        svg.appendChild(light);
        svg.appendChild(gloss);
        this.appendChild(svg);
        this._labelElement = this.createLabelElement(this._widget?.properties.label ?? 'ALARM', this.getLabelSide());
        this.appendChild(this._labelElement);
        this.updateVisuals();
    }
    updateVisuals() {
        if (!this._light || !this._widget)
            return;
        this.stopBlink();
        this.stopPulse();
        const anim = this.getActiveAnimation();
        const color = anim ? anim.value : this._widget.styles.baseColor;
        this._light.setAttribute('fill', color);
        const isActive = Number(this._value) !== 0 && this._value !== false;
        if (isActive) {
            this._light.setAttribute('filter', `url(#glow-${this._widget.id})`);
        }
        else {
            this._light.removeAttribute('filter');
        }
        if (anim?.effect === 'blink') {
            this.startBlink(color);
        }
        else if (anim?.effect === 'pulse') {
            this.startPulse(color);
        }
        else {
            this.stopBlink();
            this.stopPulse();
        }
        if (this._labelElement && this._widget) {
            this._labelElement.textContent = this._widget.properties.label ?? 'ALARM';
        }
    }
    applyColor(color) {
        this._light?.setAttribute('fill', color);
    }
}
customElements.define('hmi-alarm', AlarmWidget);
