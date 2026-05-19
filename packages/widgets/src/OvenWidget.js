// HACCP 오븐 위젯 - 온도 모니터링 및 가열 상태 표시
import { BaseWidget } from './base/BaseWidget';
function adj(hex, amount) {
    const c = hex.replace('#', '').padEnd(6, '0');
    const clamp = (v) => Math.max(0, Math.min(255, v));
    const r = clamp(parseInt(c.slice(0, 2), 16) + amount);
    const g = clamp(parseInt(c.slice(2, 4), 16) + amount);
    const b = clamp(parseInt(c.slice(4, 6), 16) + amount);
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
export class OvenWidget extends BaseWidget {
    constructor() {
        super(...arguments);
        this._coilEls = [];
        this._windowEl = null;
        this._glowEl = null;
        this._statusDot = null;
        this._tempText = null;
        this._runtimeLcdEl = null;
        this._runtimeText = null;
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
        const W = this.offsetWidth || 80;
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
        // --- 치수 계산 ---
        const bx = 1, by = 1, bw = W - 2, bh = H - 2;
        const panelH = Math.round(H * 0.30);
        const doorX = bx + 4, doorY = by + panelH + 5;
        const doorW = Math.round(W * 0.76), doorH = H - doorY - 3;
        const winX = doorX + 4, winY = doorY + 4;
        const winW = doorW - 8, winH = doorH - 8;
        const handleX = doorX + doorW + 2;
        const handleY = doorY + Math.round(doorH * 0.35);
        const handleW = Math.round(W * 0.1);
        const handleH = Math.round(doorH * 0.3);
        // --- 외부 바디 ---
        const body = document.createElementNS(ns, 'rect');
        body.setAttribute('x', String(bx));
        body.setAttribute('y', String(by));
        body.setAttribute('width', String(bw));
        body.setAttribute('height', String(bh));
        body.setAttribute('rx', '4');
        body.setAttribute('fill', '#3c3c3c');
        body.setAttribute('stroke', '#1a1a1a');
        body.setAttribute('stroke-width', '1.5');
        svg.appendChild(body);
        // 바디 상단 하이라이트
        const bhl = document.createElementNS(ns, 'rect');
        bhl.setAttribute('x', String(bx + 1));
        bhl.setAttribute('y', String(by + 1));
        bhl.setAttribute('width', String(bw - 2));
        bhl.setAttribute('height', '4');
        bhl.setAttribute('rx', '3');
        bhl.setAttribute('fill', 'rgba(255,255,255,0.10)');
        svg.appendChild(bhl);
        // --- 컨트롤 패널 ---
        const panel = document.createElementNS(ns, 'rect');
        panel.setAttribute('x', String(bx + 3));
        panel.setAttribute('y', String(by + 3));
        panel.setAttribute('width', String(bw - 6));
        panel.setAttribute('height', String(panelH - 1));
        panel.setAttribute('rx', '2');
        panel.setAttribute('fill', '#1e1e1e');
        panel.setAttribute('stroke', '#333');
        panel.setAttribute('stroke-width', '0.5');
        svg.appendChild(panel);
        // 상태 LED
        const ledCx = bx + 10, ledCy = by + Math.round(panelH * 0.38);
        const ledR = Math.max(3, Math.round(panelH * 0.14));
        const led = document.createElementNS(ns, 'circle');
        led.setAttribute('cx', String(ledCx));
        led.setAttribute('cy', String(ledCy));
        led.setAttribute('r', String(ledR));
        led.setAttribute('fill', '#222');
        this._statusDot = led;
        svg.appendChild(led);
        // LED 반사
        const ledHL = document.createElementNS(ns, 'circle');
        ledHL.setAttribute('cx', String(ledCx - 1));
        ledHL.setAttribute('cy', String(ledCy - 1));
        ledHL.setAttribute('r', '1.2');
        ledHL.setAttribute('fill', 'rgba(255,255,255,0.35)');
        svg.appendChild(ledHL);
        // LCD 온도 표시
        const lcdX = ledCx + ledR + 6, lcdW = bw - lcdX - 6;
        const lcdH = Math.round(panelH * 0.40), lcdY = by + Math.round(panelH * 0.08);
        const lcd = document.createElementNS(ns, 'rect');
        lcd.setAttribute('x', String(lcdX));
        lcd.setAttribute('y', String(lcdY));
        lcd.setAttribute('width', String(lcdW));
        lcd.setAttribute('height', String(lcdH));
        lcd.setAttribute('rx', '2');
        lcd.setAttribute('fill', '#0a120a');
        lcd.setAttribute('stroke', '#224422');
        lcd.setAttribute('stroke-width', '0.5');
        svg.appendChild(lcd);
        const fs = Math.max(7, Math.round(lcdH * 0.65));
        const tempText = document.createElementNS(ns, 'text');
        tempText.setAttribute('x', String(lcdX + lcdW / 2));
        tempText.setAttribute('y', String(lcdY + lcdH * 0.72));
        tempText.setAttribute('text-anchor', 'middle');
        tempText.setAttribute('font-size', String(fs));
        tempText.setAttribute('font-family', 'monospace');
        tempText.setAttribute('fill', '#00cc66');
        tempText.textContent = '--';
        this._tempText = tempText;
        svg.appendChild(tempText);
        // 가동시간 표시
        const rtH = Math.round(panelH * 0.22);
        const rtY = lcdY + lcdH + Math.round(panelH * 0.05);
        const rtFs = Math.max(6, Math.round(rtH * 0.65));
        const rtLcd = document.createElementNS(ns, 'rect');
        rtLcd.setAttribute('x', String(lcdX));
        rtLcd.setAttribute('y', String(rtY));
        rtLcd.setAttribute('width', String(lcdW));
        rtLcd.setAttribute('height', String(rtH));
        rtLcd.setAttribute('rx', '2');
        rtLcd.setAttribute('fill', '#080e08');
        rtLcd.setAttribute('stroke', '#1a331a');
        rtLcd.setAttribute('stroke-width', '0.5');
        this._runtimeLcdEl = rtLcd;
        svg.appendChild(rtLcd);
        const runtimeText = document.createElementNS(ns, 'text');
        runtimeText.setAttribute('x', String(lcdX + lcdW / 2));
        runtimeText.setAttribute('y', String(rtY + rtH * 0.75));
        runtimeText.setAttribute('text-anchor', 'middle');
        runtimeText.setAttribute('font-size', String(rtFs));
        runtimeText.setAttribute('font-family', 'monospace');
        runtimeText.setAttribute('fill', '#00cc66');
        runtimeText.textContent = '--';
        this._runtimeText = runtimeText;
        svg.appendChild(runtimeText);
        // --- 도어 ---
        const door = document.createElementNS(ns, 'rect');
        door.setAttribute('x', String(doorX));
        door.setAttribute('y', String(doorY));
        door.setAttribute('width', String(doorW));
        door.setAttribute('height', String(doorH));
        door.setAttribute('rx', '2');
        door.setAttribute('fill', '#282828');
        door.setAttribute('stroke', '#4a4a4a');
        door.setAttribute('stroke-width', '1');
        svg.appendChild(door);
        // 도어 안쪽 테두리 (오목한 느낌)
        const doorInner = document.createElementNS(ns, 'rect');
        doorInner.setAttribute('x', String(doorX + 3));
        doorInner.setAttribute('y', String(doorY + 3));
        doorInner.setAttribute('width', String(doorW - 6));
        doorInner.setAttribute('height', String(doorH - 6));
        doorInner.setAttribute('rx', '1');
        doorInner.setAttribute('fill', 'none');
        doorInner.setAttribute('stroke', '#555');
        doorInner.setAttribute('stroke-width', '0.5');
        svg.appendChild(doorInner);
        // 오븐 창 (가열 상태에 따른 글로우)
        const win = document.createElementNS(ns, 'rect');
        win.setAttribute('x', String(winX));
        win.setAttribute('y', String(winY));
        win.setAttribute('width', String(winW));
        win.setAttribute('height', String(winH));
        win.setAttribute('rx', '1');
        win.setAttribute('fill', 'rgba(0,0,0,0.88)');
        win.setAttribute('stroke', '#555');
        win.setAttribute('stroke-width', '0.5');
        this._windowEl = win;
        svg.appendChild(win);
        // 창 글로우 레이어
        const glow = document.createElementNS(ns, 'rect');
        glow.setAttribute('x', String(winX));
        glow.setAttribute('y', String(winY));
        glow.setAttribute('width', String(winW));
        glow.setAttribute('height', String(winH));
        glow.setAttribute('rx', '1');
        glow.setAttribute('fill', 'rgba(255,90,0,0.3)');
        glow.setAttribute('opacity', '0');
        this._glowEl = glow;
        svg.appendChild(glow);
        // 가열 코일 (창 안 3개)
        this._coilEls = [];
        const coilCount = 3;
        for (let i = 0; i < coilCount; i++) {
            const cy = winY + Math.round(winH * (0.2 + i * 0.28));
            const coil = document.createElementNS(ns, 'line');
            coil.setAttribute('x1', String(winX + 4));
            coil.setAttribute('y1', String(cy));
            coil.setAttribute('x2', String(winX + winW - 4));
            coil.setAttribute('y2', String(cy));
            coil.setAttribute('stroke', '#333');
            coil.setAttribute('stroke-width', '2');
            coil.setAttribute('stroke-linecap', 'round');
            this._coilEls.push(coil);
            svg.appendChild(coil);
        }
        // 경첩 (도어 왼쪽)
        for (const hy of [doorY + 6, doorY + doorH - 14]) {
            const hinge = document.createElementNS(ns, 'rect');
            hinge.setAttribute('x', String(doorX - 3));
            hinge.setAttribute('y', String(hy));
            hinge.setAttribute('width', '5');
            hinge.setAttribute('height', '8');
            hinge.setAttribute('rx', '1');
            hinge.setAttribute('fill', '#888');
            svg.appendChild(hinge);
        }
        // 도어 핸들
        const hndl = document.createElementNS(ns, 'rect');
        hndl.setAttribute('x', String(handleX));
        hndl.setAttribute('y', String(handleY));
        hndl.setAttribute('width', String(handleW));
        hndl.setAttribute('height', String(handleH));
        hndl.setAttribute('rx', String(Math.round(handleW * 0.4)));
        hndl.setAttribute('fill', '#aaaaaa');
        hndl.setAttribute('stroke', '#777');
        hndl.setAttribute('stroke-width', '0.5');
        svg.appendChild(hndl);
        const hndlHL = document.createElementNS(ns, 'rect');
        hndlHL.setAttribute('x', String(handleX + 1.5));
        hndlHL.setAttribute('y', String(handleY + 1.5));
        hndlHL.setAttribute('width', String(handleW - 3));
        hndlHL.setAttribute('height', '3');
        hndlHL.setAttribute('rx', '1.5');
        hndlHL.setAttribute('fill', 'rgba(255,255,255,0.35)');
        svg.appendChild(hndlHL);
        // 라벨
        const labelText = String(this._widget.properties.label ?? '');
        if (labelText) {
            const lbl = this.createLabelElement(labelText, this.getLabelSide());
            this.appendChild(lbl);
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
        const isActive = this._hasSetValue && Number(this._value) !== 0;
        const anim = this.getActiveAnimation();
        const baseColor = this._widget.styles.baseColor;
        const indicatorColor = anim ? anim.value : (isActive ? baseColor : '#333333');
        const labelColor = String(this._widget.properties.labelColor ?? '#00cc66');
        if (this._statusDot) {
            this._statusDot.setAttribute('fill', indicatorColor);
        }
        if (this._tempText) {
            const unit = String(this._widget.properties.unit ?? '°C');
            const val = this._hasSetValue ? this.getDisplayValue() : '--';
            this._tempText.textContent = this._hasSetValue && unit ? `${val} ${unit}` : val;
            this._tempText.setAttribute('fill', labelColor);
        }
        if (this._windowEl) {
            this._windowEl.setAttribute('fill', isActive ? 'rgba(180,55,0,0.58)' : 'rgba(0,0,0,0.88)');
        }
        const hasRuntime = !!this._widget.extraBindings?.runtime;
        const runtimeVis = hasRuntime ? 'visible' : 'hidden';
        this._runtimeLcdEl?.setAttribute('visibility', runtimeVis);
        if (this._runtimeText) {
            this._runtimeText.setAttribute('visibility', runtimeVis);
            if (hasRuntime) {
                const runtimeUnit = String(this._widget.properties.runtimeUnit ?? 'min');
                let runtimeVal;
                if (this._extraValues.has('runtime')) {
                    runtimeVal = String(this._extraValues.get('runtime'));
                }
                else {
                    const pv = this._widget.properties.runtimePreviewValue;
                    runtimeVal = (pv !== undefined && String(pv) !== '') ? String(pv) : '--';
                }
                this._runtimeText.textContent = `${runtimeVal} ${runtimeUnit}`;
                this._runtimeText.setAttribute('fill', labelColor);
                this._runtimeText.setAttribute('opacity', '0.6');
            }
        }
        for (const coil of this._coilEls) {
            coil.setAttribute('stroke', indicatorColor);
        }
        if (isActive) {
            this._startShimmer();
        }
        if (anim?.effect === 'blink')
            this.startBlink(anim.value);
        else if (anim?.effect === 'pulse')
            this.startPulse(anim.value);
    }
    applyColor(color) {
        for (const coil of this._coilEls)
            coil.setAttribute('stroke', color);
        if (this._statusDot)
            this._statusDot.setAttribute('fill', color);
    }
    _startShimmer() {
        const animate = () => {
            this._phase += 0.06;
            const flicker = 0.40 + Math.sin(this._phase) * 0.12;
            if (this._glowEl)
                this._glowEl.setAttribute('opacity', String(flicker));
            this._animFrame = requestAnimationFrame(animate);
        };
        this._animFrame = requestAnimationFrame(animate);
    }
    _stopAnim() {
        if (this._animFrame !== null) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
        if (this._glowEl)
            this._glowEl.setAttribute('opacity', '0');
    }
    disconnectedCallback() {
        this._stopAnim();
        super.disconnectedCallback();
    }
}
customElements.define('hmi-oven', OvenWidget);
