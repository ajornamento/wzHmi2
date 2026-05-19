// 반응기 위젯 커스텀 엘리먼트 (실린더 용기, 교반기 회전 애니메이션)
import { BaseWidget } from './base/BaseWidget';
export class ReactorWidget extends BaseWidget {
    constructor() {
        super(...arguments);
        this._agitator = null;
        this._agitInterval = null;
        this._agitAngle = 0;
        this._cx = 0;
        this._cy = 0;
    }
    render() {
        this.innerHTML = '';
        if (!this._widget)
            return;
        const W = this.offsetWidth || 80;
        const H = this.offsetHeight || 120;
        const color = this._widget.styles.baseColor;
        const dark = adj(color, -40);
        const light = adj(color, 30);
        const ns = 'http://www.w3.org/2000/svg';
        const bx = W * 0.18, bw = W * 0.64;
        const topY = H * 0.1, botY = H * 0.88;
        const bh = botY - topY;
        const domeRy = H * 0.08;
        const cx = bx + bw / 2;
        this._cx = cx;
        this._cy = H / 2;
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        // 좌측 노즐
        const nH = H * 0.055;
        const nL = document.createElementNS(ns, 'rect');
        nL.setAttribute('x', '0');
        nL.setAttribute('y', String(H * 0.35));
        nL.setAttribute('width', String(bx + 1));
        nL.setAttribute('height', String(nH));
        nL.setAttribute('fill', dark);
        svg.appendChild(nL);
        // 우측 노즐
        const nR = document.createElementNS(ns, 'rect');
        nR.setAttribute('x', String(bx + bw - 1));
        nR.setAttribute('y', String(H * 0.58));
        nR.setAttribute('width', String(bx + 1));
        nR.setAttribute('height', String(nH));
        nR.setAttribute('fill', dark);
        svg.appendChild(nR);
        // 본체 (그라디언트)
        const defs = document.createElementNS(ns, 'defs');
        const gradId = `rg-${this._widget.id}`;
        const grad = document.createElementNS(ns, 'linearGradient');
        grad.id = gradId;
        grad.setAttribute('x1', '0');
        grad.setAttribute('y1', '0');
        grad.setAttribute('x2', '1');
        grad.setAttribute('y2', '0');
        for (const [off, c] of [['0%', light], ['40%', color], ['100%', dark]]) {
            const s = document.createElementNS(ns, 'stop');
            s.setAttribute('offset', off);
            s.setAttribute('stop-color', c);
            grad.appendChild(s);
        }
        defs.appendChild(grad);
        svg.appendChild(defs);
        const body = document.createElementNS(ns, 'rect');
        body.setAttribute('x', String(bx));
        body.setAttribute('y', String(topY));
        body.setAttribute('width', String(bw));
        body.setAttribute('height', String(bh));
        body.setAttribute('fill', `url(#${gradId})`);
        svg.appendChild(body);
        // 상단 돔
        const topDome = document.createElementNS(ns, 'ellipse');
        topDome.setAttribute('cx', String(cx));
        topDome.setAttribute('cy', String(topY));
        topDome.setAttribute('rx', String(bw / 2));
        topDome.setAttribute('ry', String(domeRy));
        topDome.setAttribute('fill', light);
        svg.appendChild(topDome);
        // 하단 돔
        const botDome = document.createElementNS(ns, 'ellipse');
        botDome.setAttribute('cx', String(cx));
        botDome.setAttribute('cy', String(botY));
        botDome.setAttribute('rx', String(bw / 2));
        botDome.setAttribute('ry', String(domeRy));
        botDome.setAttribute('fill', dark);
        svg.appendChild(botDome);
        // 본체 외곽선
        const outline = document.createElementNS(ns, 'rect');
        outline.setAttribute('x', String(bx));
        outline.setAttribute('y', String(topY));
        outline.setAttribute('width', String(bw));
        outline.setAttribute('height', String(bh));
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', adj(color, -15));
        outline.setAttribute('stroke-width', '1.5');
        svg.appendChild(outline);
        // 교반기
        const agit = document.createElementNS(ns, 'g');
        agit.setAttribute('transform', `rotate(0, ${cx}, ${H / 2})`);
        const shaft = document.createElementNS(ns, 'line');
        shaft.setAttribute('x1', String(cx));
        shaft.setAttribute('y1', String(topY + domeRy));
        shaft.setAttribute('x2', String(cx));
        shaft.setAttribute('y2', String(botY - domeRy));
        shaft.setAttribute('stroke', dark);
        shaft.setAttribute('stroke-width', '2');
        agit.appendChild(shaft);
        for (const fy of [H * 0.3, H * 0.52, H * 0.72]) {
            const blade = document.createElementNS(ns, 'line');
            blade.setAttribute('x1', String(cx - bw * 0.38));
            blade.setAttribute('y1', String(fy));
            blade.setAttribute('x2', String(cx + bw * 0.38));
            blade.setAttribute('y2', String(fy + H * 0.05));
            blade.setAttribute('stroke', adj(color, 15));
            blade.setAttribute('stroke-width', '2.5');
            blade.setAttribute('stroke-linecap', 'round');
            agit.appendChild(blade);
        }
        this._agitator = agit;
        svg.appendChild(agit);
        this.appendChild(svg);
        const lbl = String(this._widget.properties.label ?? '');
        if (lbl) {
            this._labelElement = this.createLabelElement(lbl, this.getLabelSide());
            this.appendChild(this._labelElement);
        }
        this.updateVisuals();
    }
    updateVisuals() {
        if (!this._widget)
            return;
        this.stopBlink();
        this.stopPulse();
        this.stopAgitator();
        const anim = this.getActiveAnimation();
        const baseColor = this._widget.styles.baseColor;
        const color = anim ? anim.value : baseColor;
        const active = Number(this._value) !== 0;
        if (this._labelElement)
            this._labelElement.textContent = String(this._widget.properties.label ?? '');
        if (active || anim?.effect === 'flow')
            this.startAgitator();
        if (anim?.effect === 'blink')
            this.startBlink(color);
        else if (anim?.effect === 'pulse')
            this.startPulse(color);
    }
    applyColor(_color) { }
    startAgitator() {
        this.stopAgitator();
        if (!this._agitator)
            return;
        const { _cx: cx, _cy: cy } = this;
        this._agitInterval = setInterval(() => {
            this._agitAngle = (this._agitAngle + 3) % 360;
            this._agitator?.setAttribute('transform', `rotate(${this._agitAngle}, ${cx}, ${cy})`);
        }, 40);
    }
    stopAgitator() {
        if (this._agitInterval !== null) {
            clearInterval(this._agitInterval);
            this._agitInterval = null;
        }
        this._agitAngle = 0;
        this._agitator?.setAttribute('transform', `rotate(0, ${this._cx}, ${this._cy})`);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.stopAgitator();
    }
}
function adj(hex, amount) {
    const c = hex.replace('#', '').padEnd(6, '0');
    const r = Math.max(0, Math.min(255, parseInt(c.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(c.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(c.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
customElements.define('hmi-reactor', ReactorWidget);
