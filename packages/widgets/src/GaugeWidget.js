// 게이지 위젯 커스텀 엘리먼트
import { BaseWidget } from './base/BaseWidget';
export class GaugeWidget extends BaseWidget {
    constructor() {
        super(...arguments);
        this._needle = null;
        this._valueText = null;
        this._arc = null;
    }
    render() {
        this.innerHTML = '';
        const w = this.offsetWidth || 120;
        const h = this.offsetHeight || 120;
        const cx = w / 2, cy = h * 0.55;
        const r = Math.min(w, h) * 0.38;
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        const bg = document.createElementNS(ns, 'circle');
        bg.setAttribute('cx', String(cx));
        bg.setAttribute('cy', String(cy));
        bg.setAttribute('r', String(r + 4));
        bg.setAttribute('fill', '#2a2a2a');
        bg.setAttribute('stroke', '#555');
        bg.setAttribute('stroke-width', '2');
        const trackArc = this.describeArc(cx, cy, r, -135, 135);
        const track = document.createElementNS(ns, 'path');
        track.setAttribute('d', trackArc);
        track.setAttribute('fill', 'none');
        track.setAttribute('stroke', '#444');
        track.setAttribute('stroke-width', '8');
        track.setAttribute('stroke-linecap', 'round');
        const valueArc = this.describeArc(cx, cy, r, -135, -135);
        const arc = document.createElementNS(ns, 'path');
        arc.setAttribute('d', valueArc);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', this._widget?.styles.baseColor ?? '#00ff88');
        arc.setAttribute('stroke-width', '8');
        arc.setAttribute('stroke-linecap', 'round');
        this._arc = arc;
        const centerDot = document.createElementNS(ns, 'circle');
        centerDot.setAttribute('cx', String(cx));
        centerDot.setAttribute('cy', String(cy));
        centerDot.setAttribute('r', '5');
        centerDot.setAttribute('fill', '#ccc');
        const needle = document.createElementNS(ns, 'line');
        needle.setAttribute('x1', String(cx));
        needle.setAttribute('y1', String(cy));
        needle.setAttribute('x2', String(cx));
        needle.setAttribute('y2', String(cy - r * 0.75));
        needle.setAttribute('stroke', '#fff');
        needle.setAttribute('stroke-width', '2.5');
        needle.setAttribute('stroke-linecap', 'round');
        needle.setAttribute('transform', `rotate(-135, ${cx}, ${cy})`);
        this._needle = needle;
        const valueText = document.createElementNS(ns, 'text');
        valueText.setAttribute('x', String(cx));
        valueText.setAttribute('y', String(cy + r + 20));
        valueText.setAttribute('text-anchor', 'middle');
        valueText.setAttribute('fill', '#fff');
        valueText.setAttribute('font-size', '12');
        valueText.setAttribute('font-family', 'Arial, sans-serif');
        valueText.textContent = '0';
        const minText = document.createElementNS(ns, 'text');
        minText.setAttribute('x', String(cx - r));
        minText.setAttribute('y', String(cy + r + 15));
        minText.setAttribute('text-anchor', 'middle');
        minText.setAttribute('fill', '#ccc');
        minText.setAttribute('font-size', '10');
        minText.setAttribute('font-family', 'Arial, sans-serif');
        minText.textContent = '0';
        const maxText = document.createElementNS(ns, 'text');
        maxText.setAttribute('x', String(cx + r));
        maxText.setAttribute('y', String(cy + r + 15));
        maxText.setAttribute('text-anchor', 'middle');
        maxText.setAttribute('fill', '#ccc');
        maxText.setAttribute('font-size', '10');
        maxText.setAttribute('font-family', 'Arial, sans-serif');
        maxText.textContent = '100';
        svg.appendChild(bg);
        svg.appendChild(track);
        svg.appendChild(arc);
        svg.appendChild(needle);
        svg.appendChild(centerDot);
        svg.appendChild(valueText);
        svg.appendChild(minText);
        svg.appendChild(maxText);
        this.appendChild(svg);
        this._labelElement = this.createLabelElement(this._widget?.properties.label ?? 'GAUGE', this.getLabelSide());
        this.appendChild(this._labelElement);
        this.updateVisuals();
    }
    describeArc(cx, cy, r, startDeg, endDeg) {
        const start = this.polar(cx, cy, r, startDeg);
        const end = this.polar(cx, cy, r, endDeg);
        const large = endDeg - startDeg > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
    }
    polar(cx, cy, r, deg) {
        const rad = ((deg - 90) * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }
    updateVisuals() {
        if (!this._widget)
            return;
        this.stopBlink();
        this.stopPulse();
        const min = Number(this._widget.properties.min ?? 0);
        const max = Number(this._widget.properties.max ?? 100);
        const val = Math.min(Math.max(Number(this._value), min), max);
        const pct = (val - min) / (max - min);
        const deg = -135 + pct * 270;
        const w = this.offsetWidth || 120;
        const h = this.offsetHeight || 120;
        const cx = w / 2, cy = h * 0.55;
        const r = Math.min(w, h) * 0.38;
        if (this._needle) {
            this._needle.setAttribute('transform', `rotate(${deg}, ${cx}, ${cy})`);
        }
        if (this._arc) {
            const anim = this.getActiveAnimation();
            const color = anim ? anim.value : this._widget.styles.baseColor;
            this._arc.setAttribute('stroke', color);
            if (pct > 0) {
                this._arc.setAttribute('d', this.describeArc(cx, cy, r, -135, deg));
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
        }
        if (this._valueText) {
            this._valueText.textContent = this.getDisplayValue();
        }
    }
    applyColor(color) {
        this._arc?.setAttribute('stroke', color);
    }
}
customElements.define('hmi-gauge', GaugeWidget);
