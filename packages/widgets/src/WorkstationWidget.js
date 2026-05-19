// 작업장 위젯 커스텀 엘리먼트 (작업대, 모니터, 상태 표시)
import { BaseWidget } from './base/BaseWidget';
export class WorkstationWidget extends BaseWidget {
    constructor() {
        super(...arguments);
        this._statusLight = null;
        this._monitorScreen = null;
        this._surface = null;
    }
    render() {
        this.innerHTML = '';
        if (!this._widget)
            return;
        const W = this.offsetWidth || 100;
        const H = this.offsetHeight || 100;
        const color = this._widget.styles.baseColor;
        const dark = adj(color, -40);
        const mid = adj(color, -15);
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        // 배경 프레임
        const frame = document.createElementNS(ns, 'rect');
        frame.setAttribute('x', '1');
        frame.setAttribute('y', '1');
        frame.setAttribute('width', String(W - 2));
        frame.setAttribute('height', String(H - 2));
        frame.setAttribute('fill', '#1c1c2c');
        frame.setAttribute('stroke', dark);
        frame.setAttribute('stroke-width', '1.5');
        frame.setAttribute('rx', '3');
        svg.appendChild(frame);
        // 작업 테이블 상판
        const sy = H * 0.55, sh = H * 0.07, sx = W * 0.08, sw = W * 0.84;
        const surface = document.createElementNS(ns, 'rect');
        surface.setAttribute('x', String(sx));
        surface.setAttribute('y', String(sy));
        surface.setAttribute('width', String(sw));
        surface.setAttribute('height', String(sh));
        surface.setAttribute('fill', mid);
        surface.setAttribute('rx', '2');
        this._surface = surface;
        svg.appendChild(surface);
        // 테이블 다리
        const legW = sw * 0.07;
        for (const lx of [sx + sw * 0.1, sx + sw * 0.83]) {
            const leg = document.createElementNS(ns, 'rect');
            leg.setAttribute('x', String(lx));
            leg.setAttribute('y', String(sy + sh));
            leg.setAttribute('width', String(legW));
            leg.setAttribute('height', String(H * 0.32));
            leg.setAttribute('fill', dark);
            svg.appendChild(leg);
        }
        // 모니터 외곽
        const mw = sw * 0.3, mh = H * 0.22;
        const mx = sx + (sw - mw) / 2 - sw * 0.05;
        const my = sy - mh - H * 0.02;
        const monFrame = document.createElementNS(ns, 'rect');
        monFrame.setAttribute('x', String(mx));
        monFrame.setAttribute('y', String(my));
        monFrame.setAttribute('width', String(mw));
        monFrame.setAttribute('height', String(mh));
        monFrame.setAttribute('fill', '#111');
        monFrame.setAttribute('stroke', dark);
        monFrame.setAttribute('stroke-width', '1.5');
        monFrame.setAttribute('rx', '2');
        svg.appendChild(monFrame);
        // 모니터 화면
        const screen = document.createElementNS(ns, 'rect');
        screen.setAttribute('x', String(mx + 2));
        screen.setAttribute('y', String(my + 2));
        screen.setAttribute('width', String(mw - 4));
        screen.setAttribute('height', String(mh - 4));
        screen.setAttribute('fill', '#1a1a1a');
        screen.setAttribute('rx', '1');
        this._monitorScreen = screen;
        svg.appendChild(screen);
        // 모니터 받침대
        const stand = document.createElementNS(ns, 'rect');
        stand.setAttribute('x', String(mx + mw * 0.38));
        stand.setAttribute('y', String(my + mh));
        stand.setAttribute('width', String(mw * 0.24));
        stand.setAttribute('height', String(H * 0.03));
        stand.setAttribute('fill', dark);
        svg.appendChild(stand);
        // 테이블 위 도구
        const tool = document.createElementNS(ns, 'rect');
        tool.setAttribute('x', String(sx + sw * 0.72));
        tool.setAttribute('y', String(sy - H * 0.12));
        tool.setAttribute('width', String(sw * 0.07));
        tool.setAttribute('height', String(H * 0.12));
        tool.setAttribute('fill', color);
        tool.setAttribute('rx', '2');
        svg.appendChild(tool);
        // 상태 표시등
        const lr = Math.max(Math.min(W, H) * 0.06, 4);
        const light = document.createElementNS(ns, 'circle');
        light.setAttribute('cx', String(W - 8));
        light.setAttribute('cy', '8');
        light.setAttribute('r', String(lr));
        light.setAttribute('fill', '#333');
        light.setAttribute('stroke', '#555');
        light.setAttribute('stroke-width', '1');
        this._statusLight = light;
        svg.appendChild(light);
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
        const anim = this.getActiveAnimation();
        const baseColor = this._widget.styles.baseColor;
        const color = anim ? anim.value : baseColor;
        const active = Number(this._value) !== 0;
        if (this._statusLight)
            this._statusLight.setAttribute('fill', active ? color : '#333');
        if (this._monitorScreen)
            this._monitorScreen.setAttribute('fill', active ? adj(color, -15) : '#1a1a1a');
        if (this._surface)
            this._surface.setAttribute('fill', active ? adj(color, -15) : adj(baseColor, -40));
        if (this._labelElement)
            this._labelElement.textContent = String(this._widget.properties.label ?? '');
        if (anim?.effect === 'blink')
            this.startBlink(color);
        else if (anim?.effect === 'pulse')
            this.startPulse(color);
    }
    applyColor(color) {
        this._statusLight?.setAttribute('fill', color);
    }
}
function adj(hex, amount) {
    const c = hex.replace('#', '').padEnd(6, '0');
    const r = Math.max(0, Math.min(255, parseInt(c.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(c.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(c.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
customElements.define('hmi-workstation', WorkstationWidget);
