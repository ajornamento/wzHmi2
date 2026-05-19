// HACCP 엑스레이 검사 위젯 - X-ray 스캔 가동 상태 표시
import { BaseWidget } from './base/BaseWidget';
export class XRayWidget extends BaseWidget {
    constructor() {
        super(...arguments);
        this._statusLed = null;
        this._beamEls = [];
        this._scanEl = null;
        this._statusText = null;
        this._animFrame = null;
        this._phase = 0;
        this._hasSetValue = false;
    }
    configure(widget) {
        this._stopAnim();
        this._hasSetValue = false;
        super.configure(widget);
    }
    setValue(value) {
        this._hasSetValue = true;
        super.setValue(value);
    }
    render() {
        this.innerHTML = '';
        if (!this._widget)
            return;
        const W = this.offsetWidth || 140;
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
        const bx = 1, by = 1, bw = W - 2, bh = H - 2;
        const panelH = Math.round(H * 0.22);
        const slotW = Math.round(W * 0.10);
        const slotH = Math.round(H * 0.26);
        const slotY = by + Math.round(bh * 0.62);
        const chamberX = bx + slotW + 2;
        const chamberW = bw - 2 * slotW - 4;
        const chamberY = by + panelH + 2;
        const chamberH = H - chamberY - bx;
        // 메인 하우징 본체
        const housing = document.createElementNS(ns, 'rect');
        housing.setAttribute('x', String(bx));
        housing.setAttribute('y', String(by));
        housing.setAttribute('width', String(bw));
        housing.setAttribute('height', String(bh));
        housing.setAttribute('rx', '3');
        housing.setAttribute('fill', '#282838');
        housing.setAttribute('stroke', '#445566');
        housing.setAttribute('stroke-width', '1.5');
        svg.appendChild(housing);
        const hHL = document.createElementNS(ns, 'rect');
        hHL.setAttribute('x', String(bx + 1));
        hHL.setAttribute('y', String(by + 1));
        hHL.setAttribute('width', String(bw - 2));
        hHL.setAttribute('height', '3');
        hHL.setAttribute('rx', '2');
        hHL.setAttribute('fill', 'rgba(255,255,255,0.07)');
        svg.appendChild(hHL);
        // 상태 패널
        const panel = document.createElementNS(ns, 'rect');
        panel.setAttribute('x', String(bx + 2));
        panel.setAttribute('y', String(by + 2));
        panel.setAttribute('width', String(bw - 4));
        panel.setAttribute('height', String(panelH - 1));
        panel.setAttribute('rx', '2');
        panel.setAttribute('fill', '#181828');
        panel.setAttribute('stroke', '#334455');
        panel.setAttribute('stroke-width', '0.5');
        svg.appendChild(panel);
        // 상태 LED
        const ledR = Math.max(3, Math.round(panelH * 0.24));
        const ledCx = bx + 10;
        const ledCy = by + Math.round(panelH * 0.50);
        const led = document.createElementNS(ns, 'circle');
        led.setAttribute('cx', String(ledCx));
        led.setAttribute('cy', String(ledCy));
        led.setAttribute('r', String(ledR));
        led.setAttribute('fill', '#222');
        this._statusLed = led;
        svg.appendChild(led);
        const ledHL = document.createElementNS(ns, 'circle');
        ledHL.setAttribute('cx', String(ledCx - 1));
        ledHL.setAttribute('cy', String(ledCy - 1));
        ledHL.setAttribute('r', '1.2');
        ledHL.setAttribute('fill', 'rgba(255,255,255,0.35)');
        svg.appendChild(ledHL);
        // 패널 "X-RAY" 텍스트
        const panelLbl = document.createElementNS(ns, 'text');
        panelLbl.setAttribute('x', String(ledCx + ledR + 6));
        panelLbl.setAttribute('y', String(by + panelH * 0.70));
        panelLbl.setAttribute('text-anchor', 'start');
        panelLbl.setAttribute('font-size', String(Math.max(7, Math.round(panelH * 0.50))));
        panelLbl.setAttribute('font-family', 'monospace');
        panelLbl.setAttribute('font-weight', 'bold');
        panelLbl.setAttribute('fill', '#1a4488');
        panelLbl.textContent = 'X-RAY';
        svg.appendChild(panelLbl);
        // 패널 우측 상태값 표시
        const statusText = document.createElementNS(ns, 'text');
        statusText.setAttribute('x', String(bx + bw - 5));
        statusText.setAttribute('y', String(by + panelH * 0.70));
        statusText.setAttribute('text-anchor', 'end');
        statusText.setAttribute('font-size', String(Math.max(7, Math.round(panelH * 0.50))));
        statusText.setAttribute('font-family', 'monospace');
        statusText.setAttribute('fill', '#0077cc');
        statusText.textContent = '';
        this._statusText = statusText;
        svg.appendChild(statusText);
        // 벨트 입구 슬롯 (왼쪽)
        const leftSlot = document.createElementNS(ns, 'rect');
        leftSlot.setAttribute('x', String(bx));
        leftSlot.setAttribute('y', String(slotY));
        leftSlot.setAttribute('width', String(slotW + 1));
        leftSlot.setAttribute('height', String(slotH));
        leftSlot.setAttribute('fill', '#0a0a12');
        svg.appendChild(leftSlot);
        // 벨트 출구 슬롯 (오른쪽)
        const rightSlot = document.createElementNS(ns, 'rect');
        rightSlot.setAttribute('x', String(bx + bw - slotW - 1));
        rightSlot.setAttribute('y', String(slotY));
        rightSlot.setAttribute('width', String(slotW + 1));
        rightSlot.setAttribute('height', String(slotH));
        rightSlot.setAttribute('fill', '#0a0a12');
        svg.appendChild(rightSlot);
        // 하우징 외곽선 재드로우 (슬롯 위에 테두리)
        const border = document.createElementNS(ns, 'rect');
        border.setAttribute('x', String(bx));
        border.setAttribute('y', String(by));
        border.setAttribute('width', String(bw));
        border.setAttribute('height', String(bh));
        border.setAttribute('rx', '3');
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', '#445566');
        border.setAttribute('stroke-width', '1.5');
        svg.appendChild(border);
        // 슬롯 경계선
        for (const sx of [bx + slotW, bx + bw - slotW]) {
            const guide = document.createElementNS(ns, 'line');
            guide.setAttribute('x1', String(sx));
            guide.setAttribute('y1', String(slotY));
            guide.setAttribute('x2', String(sx));
            guide.setAttribute('y2', String(slotY + slotH));
            guide.setAttribute('stroke', '#445566');
            guide.setAttribute('stroke-width', '1');
            svg.appendChild(guide);
        }
        // 챔버 내부 검사 영역
        const chamber = document.createElementNS(ns, 'rect');
        chamber.setAttribute('x', String(chamberX));
        chamber.setAttribute('y', String(chamberY));
        chamber.setAttribute('width', String(chamberW));
        chamber.setAttribute('height', String(chamberH));
        chamber.setAttribute('rx', '2');
        chamber.setAttribute('fill', '#080812');
        chamber.setAttribute('stroke', '#1a2a44');
        chamber.setAttribute('stroke-width', '0.5');
        svg.appendChild(chamber);
        // X-ray 빔 (부채꼴 방사선)
        this._beamEls = [];
        const srcX = chamberX + Math.round(chamberW * 0.50);
        const srcY = chamberY + Math.round(chamberH * 0.08);
        const beamCount = 9;
        for (let i = 0; i < beamCount; i++) {
            const t = i / (beamCount - 1);
            const endX = chamberX + 2 + Math.round((chamberW - 4) * t);
            const endY = chamberY + chamberH - 2;
            const beam = document.createElementNS(ns, 'line');
            beam.setAttribute('x1', String(srcX));
            beam.setAttribute('y1', String(srcY));
            beam.setAttribute('x2', String(endX));
            beam.setAttribute('y2', String(endY));
            beam.setAttribute('stroke', '#001a44');
            beam.setAttribute('stroke-width', '0.8');
            beam.setAttribute('opacity', '0.5');
            this._beamEls.push(beam);
            svg.appendChild(beam);
        }
        // 빔 소스 포인트
        const srcDot = document.createElementNS(ns, 'circle');
        srcDot.setAttribute('cx', String(srcX));
        srcDot.setAttribute('cy', String(srcY));
        srcDot.setAttribute('r', '2.5');
        srcDot.setAttribute('fill', '#001133');
        svg.appendChild(srcDot);
        // 스캔 글로우 오버레이 (애니메이션용)
        const scanEl = document.createElementNS(ns, 'rect');
        scanEl.setAttribute('x', String(chamberX + 1));
        scanEl.setAttribute('y', String(srcY - 2));
        scanEl.setAttribute('width', String(chamberW - 2));
        scanEl.setAttribute('height', String(chamberH - srcY + chamberY - 1));
        scanEl.setAttribute('fill', 'rgba(0,80,200,0.12)');
        scanEl.setAttribute('opacity', '0');
        this._scanEl = scanEl;
        svg.appendChild(scanEl);
        // 챔버 내 벨트 영역 표시
        const beltInner = document.createElementNS(ns, 'rect');
        beltInner.setAttribute('x', String(chamberX));
        beltInner.setAttribute('y', String(slotY));
        beltInner.setAttribute('width', String(chamberW));
        beltInner.setAttribute('height', String(slotH));
        beltInner.setAttribute('fill', '#111118');
        beltInner.setAttribute('opacity', '0.85');
        svg.appendChild(beltInner);
        const beltHL = document.createElementNS(ns, 'rect');
        beltHL.setAttribute('x', String(chamberX));
        beltHL.setAttribute('y', String(slotY));
        beltHL.setAttribute('width', String(chamberW));
        beltHL.setAttribute('height', '2');
        beltHL.setAttribute('fill', 'rgba(255,255,255,0.07)');
        svg.appendChild(beltHL);
        const labelText = String(this._widget.properties.label ?? '');
        if (labelText) {
            this.appendChild(this.createLabelElement(labelText, this.getLabelSide()));
        }
        this.appendChild(svg);
        this.updateVisuals();
    }
    updateVisuals() {
        if (!this._widget)
            return;
        this._stopAnim();
        this.stopBlink();
        this.stopPulse();
        const isActive = Number(this._value) !== 0;
        const anim = this.getActiveAnimation();
        const baseColor = this._widget.styles.baseColor;
        const indicatorColor = anim ? anim.value : (isActive ? baseColor : '#333333');
        if (this._statusLed)
            this._statusLed.setAttribute('fill', indicatorColor);
        for (const beam of this._beamEls) {
            beam.setAttribute('stroke', isActive ? '#0055cc' : '#001a44');
            beam.setAttribute('opacity', isActive ? '0.75' : '0.35');
        }
        if (isActive)
            this._startScan();
        if (this._statusText) {
            if (!this._hasSetValue) {
                this._statusText.textContent = '';
            }
            else if (isActive) {
                this._statusText.setAttribute('fill', baseColor);
                this._statusText.textContent = String(this._value);
            }
            else {
                this._statusText.setAttribute('fill', '#1a4488');
                this._statusText.textContent = 'IDLE';
            }
        }
        if (anim?.effect === 'blink')
            this.startBlink(anim.value);
        else if (anim?.effect === 'pulse')
            this.startPulse(anim.value);
    }
    applyColor(color) {
        if (this._statusLed)
            this._statusLed.setAttribute('fill', color);
    }
    _startScan() {
        const animate = () => {
            this._phase += 0.05;
            const intensity = 0.25 + Math.abs(Math.sin(this._phase)) * 0.50;
            if (this._scanEl)
                this._scanEl.setAttribute('opacity', String(intensity));
            this._animFrame = requestAnimationFrame(animate);
        };
        this._animFrame = requestAnimationFrame(animate);
    }
    _stopAnim() {
        if (this._animFrame !== null) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
        if (this._scanEl)
            this._scanEl.setAttribute('opacity', '0');
    }
    disconnectedCallback() {
        this._stopAnim();
        super.disconnectedCallback();
    }
}
customElements.define('hmi-xray', XRayWidget);
