// 호퍼 위젯 커스텀 엘리먼트 (사다리꼴 용기, 충전 레벨 표시)
import { BaseWidget } from './base/BaseWidget';
export class HopperWidget extends BaseWidget {
    constructor() {
        super(...arguments);
        this._fillPoly = null;
        this._valueText = null;
        this._topY = 0;
        this._outletY = 0;
        this._outletX = 0;
        this._outletW = 0;
        this._pad = 0;
        this._W = 0;
    }
    render() {
        this.innerHTML = '';
        if (!this._widget)
            return;
        const W = this.offsetWidth || 80;
        const H = this.offsetHeight || 120;
        const color = this._widget.styles.baseColor;
        const dark = adj(color, -40);
        const ns = 'http://www.w3.org/2000/svg';
        const pad = 4;
        const topY = pad + 4;
        const outletY = H * 0.77;
        const outletW = W * 0.24;
        const outletX = (W - outletW) / 2;
        const outletPipeH = H * 0.19;
        this._W = W;
        this._topY = topY;
        this._outletY = outletY;
        this._outletX = outletX;
        this._outletW = outletW;
        this._pad = pad;
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        // 호퍼 본체 배경
        const bg = document.createElementNS(ns, 'polygon');
        bg.setAttribute('points', pts(pad, topY, W - pad, topY, outletX + outletW, outletY, outletX, outletY));
        bg.setAttribute('fill', '#1c1c2c');
        svg.appendChild(bg);
        // 충전 레벨 폴리곤 (updateVisuals에서 갱신)
        const fill = document.createElementNS(ns, 'polygon');
        fill.setAttribute('points', pts(outletX, outletY, outletX + outletW, outletY, outletX + outletW, outletY, outletX, outletY));
        fill.setAttribute('fill', color);
        this._fillPoly = fill;
        svg.appendChild(fill);
        // 호퍼 외곽선
        const outline = document.createElementNS(ns, 'polygon');
        outline.setAttribute('points', pts(pad, topY, W - pad, topY, outletX + outletW, outletY, outletX, outletY));
        outline.setAttribute('fill', 'none');
        outline.setAttribute('stroke', color);
        outline.setAttribute('stroke-width', '2');
        svg.appendChild(outline);
        // 상단 림
        const rim = document.createElementNS(ns, 'rect');
        rim.setAttribute('x', String(pad - 1));
        rim.setAttribute('y', String(topY - 3));
        rim.setAttribute('width', String(W - pad * 2 + 2));
        rim.setAttribute('height', '5');
        rim.setAttribute('fill', dark);
        svg.appendChild(rim);
        // 지지 다리
        const legH = H * 0.14, legW = W * 0.06;
        for (const lx of [outletX - legW * 1.5, outletX + outletW + legW * 0.5]) {
            const leg = document.createElementNS(ns, 'rect');
            leg.setAttribute('x', String(lx));
            leg.setAttribute('y', String(outletY));
            leg.setAttribute('width', String(legW));
            leg.setAttribute('height', String(legH));
            leg.setAttribute('fill', dark);
            svg.appendChild(leg);
        }
        // 배출구 파이프
        const pipe = document.createElementNS(ns, 'rect');
        pipe.setAttribute('x', String(outletX));
        pipe.setAttribute('y', String(outletY));
        pipe.setAttribute('width', String(outletW));
        pipe.setAttribute('height', String(outletPipeH));
        pipe.setAttribute('fill', dark);
        pipe.setAttribute('stroke', adj(color, -20));
        pipe.setAttribute('stroke-width', '1');
        svg.appendChild(pipe);
        // 값 텍스트
        const txt = document.createElementNS(ns, 'text');
        txt.setAttribute('x', String(W / 2));
        txt.setAttribute('y', String((topY + outletY) / 2 + 5));
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('font-size', String(this._widget.properties.fontSize ?? 11));
        txt.setAttribute('font-family', this.getLabelFontFamily());
        txt.setAttribute('fill', '#ddd');
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
    updateVisuals() {
        if (!this._widget || !this._fillPoly)
            return;
        this.stopBlink();
        this.stopPulse();
        const anim = this.getActiveAnimation();
        const baseColor = this._widget.styles.baseColor;
        const color = anim ? anim.value : baseColor;
        const min = Number(this._widget.properties.min ?? 0);
        const max = Number(this._widget.properties.max ?? 100);
        const val = Math.min(Math.max(Number(this._value), min), max);
        const pct = (val - min) / (max - min);
        const { _pad: pad, _topY: topY, _outletY: oY, _outletX: oX, _outletW: oW, _W: W } = this;
        const yTop = oY - (oY - topY) * pct;
        const lx = oX * (1 - pct) + pad * pct;
        const rx = (oX + oW) * (1 - pct) + (W - pad) * pct;
        this._fillPoly.setAttribute('points', pts(lx, yTop, rx, yTop, oX + oW, oY, oX, oY));
        this._fillPoly.setAttribute('fill', color);
        if (this._valueText)
            this._valueText.textContent = this.getDisplayValue();
        if (this._labelElement)
            this._labelElement.textContent = String(this._widget.properties.label ?? '');
        if (anim?.effect === 'blink')
            this.startBlink(color);
        else if (anim?.effect === 'pulse')
            this.startPulse(color);
    }
    applyColor(color) {
        this._fillPoly?.setAttribute('fill', color);
    }
}
function pts(...coords) {
    const result = [];
    for (let i = 0; i < coords.length; i += 2)
        result.push(`${coords[i]},${coords[i + 1]}`);
    return result.join(' ');
}
function adj(hex, amount) {
    const c = hex.replace('#', '').padEnd(6, '0');
    const r = Math.max(0, Math.min(255, parseInt(c.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(c.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(c.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
customElements.define('hmi-hopper', HopperWidget);
