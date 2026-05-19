// 위젯 커스텀 엘리먼트의 공통 베이스 클래스
import { findMatchingAnimation, format } from '@wzhmi/core';
export class BaseWidget extends HTMLElement {
    constructor() {
        super(...arguments);
        this._widget = null;
        this._value = 0;
        this._extraValues = new Map();
        this._blinkInterval = null;
        this._blinkState = false;
        this._blinkColor = null;
        this._blinkStopToken = 0;
        this._pulseInterval = null;
        this._pulseScale = 1;
        this._labelElement = null;
        this._valueElement = null;
        this._tooltipEl = null;
        this._handleMouseEnter = () => {
            const remarks = String(this._widget?.properties.remarks ?? '').trim();
            if (!this._widget?.properties.showTooltip || !remarks)
                return;
            if (!this._tooltipEl) {
                const el = document.createElement('div');
                Object.assign(el.style, {
                    position: 'fixed',
                    background: 'rgba(15, 15, 28, 0.96)',
                    color: '#ddd',
                    border: '1px solid #3355aa',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    maxWidth: '260px',
                    wordBreak: 'break-word',
                    lineHeight: '1.5',
                    pointerEvents: 'none',
                    zIndex: '99999',
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
                    display: 'none',
                });
                document.body.appendChild(el);
                this._tooltipEl = el;
            }
            this._tooltipEl.textContent = remarks;
            this._tooltipEl.style.display = 'block';
            const rect = this.getBoundingClientRect();
            const tipH = this._tooltipEl.offsetHeight || 40;
            const spaceBelow = window.innerHeight - rect.bottom;
            const top = spaceBelow > tipH + 8 ? rect.bottom + 4 : rect.top - tipH - 4;
            this._tooltipEl.style.top = `${Math.max(0, top)}px`;
            this._tooltipEl.style.left = `${Math.max(0, Math.min(rect.left, window.innerWidth - 270))}px`;
        };
        this._handleMouseLeave = () => {
            if (this._tooltipEl) {
                this._tooltipEl.remove();
                this._tooltipEl = null;
            }
        };
    }
    static get observedAttributes() {
        return ['data-value'];
    }
    connectedCallback() {
        this.style.display = 'block';
        this.style.position = 'absolute';
        this.style.overflow = 'visible';
        this.addEventListener('mouseenter', this._handleMouseEnter);
        this.addEventListener('mouseleave', this._handleMouseLeave);
        this.render();
    }
    attributeChangedCallback(name, _old, newVal) {
        if (name === 'data-value') {
            this._value = isNaN(Number(newVal)) ? newVal : Number(newVal);
            this.updateVisuals();
            this.updateValueDisplay();
        }
    }
    configure(widget) {
        this._widget = widget;
        this._extraValues.clear();
        this._valueElement = null; // render()가 innerHTML을 지우므로 참조 초기화
        this._handleMouseLeave(); // 재구성 시 열려 있던 툴팁 닫기
        this.applyGeometry();
        this.render();
        this.updateValueDisplay();
    }
    setValue(value) {
        this._value = value;
        this.updateVisuals();
        this.updateValueDisplay();
    }
    setExtraValue(key, value) {
        this._extraValues.set(key, value);
        this.updateVisuals();
        this.updateValueDisplay();
    }
    applyGeometry() {
        if (!this._widget)
            return;
        const { x, y, width, height, rotation, zIndex, opacity = 1 } = {
            ...this._widget.geometry,
            opacity: this._widget.styles.opacity,
        };
        Object.assign(this.style, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            transform: rotation !== 0 ? `rotate(${rotation}deg)` : '',
            transformOrigin: 'center center',
            zIndex: String(zIndex),
            opacity: String(this._widget.styles.opacity),
            display: this._widget.styles.visible ? 'block' : 'none',
        });
    }
    getLabelSide() {
        return this._widget?.properties.labelSide ?? 'bottom';
    }
    shouldDisplayLabel(side) {
        const visibility = this._widget?.properties.labelVisibility;
        if (!visibility)
            return true;
        return visibility[side] !== false;
    }
    getCounterLabelRotation(cx, cy) {
        const rotation = this._widget?.geometry.rotation ?? 0;
        return rotation ? `rotate(${-rotation}, ${cx}, ${cy})` : '';
    }
    createLabelElement(text, side = 'bottom') {
        const label = document.createElement('div');
        label.className = `widget-label widget-label-${side}`;
        label.textContent = text;
        label.style.position = 'absolute';
        label.style.pointerEvents = 'none';
        label.style.userSelect = 'none';
        label.style.fontSize = `${this.getLabelFontSize(11)}px`;
        label.style.fontFamily = this.getLabelFontFamily('sans-serif');
        label.style.color = String(this._widget?.properties.labelColor ?? '#cccccc');
        label.style.zIndex = '10';
        label.style.whiteSpace = 'nowrap';
        const rotation = this._widget?.geometry.rotation ?? 0;
        label.style.transform = rotation ? `rotate(${-rotation}deg)` : '';
        label.style.transformOrigin = 'center center';
        if (!this._widget)
            return label;
        switch (side) {
            case 'top':
                label.style.left = '50%';
                label.style.top = '-1.5em';
                label.style.transform = rotation ? `translateX(-50%) rotate(${-rotation}deg)` : 'translateX(-50%)';
                break;
            case 'bottom':
                label.style.left = '50%';
                label.style.bottom = '-1.5em';
                label.style.transform = rotation ? `translateX(-50%) rotate(${-rotation}deg)` : 'translateX(-50%)';
                break;
            case 'left':
                label.style.right = 'calc(100% + 4px)';
                label.style.top = '50%';
                label.style.transform = rotation ? `translateY(-50%) rotate(${-rotation}deg)` : 'translateY(-50%)';
                break;
            case 'right':
                label.style.left = 'calc(100% + 4px)';
                label.style.top = '50%';
                label.style.transform = rotation ? `translateY(-50%) rotate(${-rotation}deg)` : 'translateY(-50%)';
                break;
        }
        return label;
    }
    getActiveAnimation() {
        if (!this._widget)
            return null;
        return findMatchingAnimation(this._widget.styles.animations, this._value);
    }
    getDisplayValue() {
        if (!this._widget)
            return String(this._value);
        return format(this._widget.binding.formatter, this._value);
    }
    updateValueDisplay() {
        // TEXT_LABEL은 자체적으로 값 표시를 처리함
        if (!this._widget || this._widget.type === 'TEXT_LABEL')
            return;
        const showValue = this._widget.properties.showValue ?? false;
        if (!showValue) {
            if (this._valueElement) {
                this._valueElement.remove();
                this._valueElement = null;
            }
            return;
        }
        if (!this._valueElement) {
            const el = document.createElement('div');
            el.className = 'widget-value-display';
            Object.assign(el.style, {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: '10',
                whiteSpace: 'nowrap',
                background: 'rgba(0,0,0,0.55)',
                borderRadius: '3px',
                padding: '1px 5px',
            });
            this.appendChild(el);
            this._valueElement = el;
        }
        const unit = String(this._widget.properties.unit ?? '');
        const text = this.getDisplayValue();
        this._valueElement.textContent = unit ? `${text} ${unit}` : text;
        this._valueElement.style.fontSize = `${this.getLabelFontSize(11)}px`;
        this._valueElement.style.fontFamily = this.getLabelFontFamily('monospace');
        this._valueElement.style.color = String(this._widget.properties.labelColor ?? '#ffffff');
    }
    getLabelFontSize(defaultSize) {
        const size = this._widget?.properties.fontSize;
        return size != null ? String(size) : String(defaultSize);
    }
    getLabelFontFamily(defaultFamily = 'sans-serif') {
        return String(this._widget?.properties.fontFamily ?? defaultFamily);
    }
    applyLabelFont(el, defaultSize, defaultFamily = 'sans-serif') {
        el.setAttribute('font-size', this.getLabelFontSize(defaultSize));
        el.setAttribute('font-family', this.getLabelFontFamily(defaultFamily));
    }
    startBlink(color) {
        // deferred stop 취소 — 같은 tick 내에서 stopBlink 직후 startBlink 호출 시 인터벌 유지
        this._blinkStopToken++;
        // 이미 동일한 색으로 깜박이고 있으면 재시작 불필요
        if (this._blinkInterval !== null && this._blinkColor === color)
            return;
        // 다른 색으로 실행 중이면 즉시 정리 후 재시작
        if (this._blinkInterval !== null) {
            clearInterval(this._blinkInterval);
            this._blinkInterval = null;
        }
        this._blinkColor = color;
        this._blinkState = true;
        this.applyColor(color);
        this._blinkInterval = setInterval(() => {
            this._blinkState = !this._blinkState;
            this.applyColor(this._blinkState ? color : this._widget?.styles.baseColor ?? '#808080');
        }, 500);
    }
    stopBlink() {
        if (this._blinkInterval === null)
            return;
        // 마이크로태스크로 지연 — 같은 tick 내 startBlink 호출 시 취소됨
        const token = ++this._blinkStopToken;
        queueMicrotask(() => {
            if (this._blinkStopToken !== token)
                return;
            clearInterval(this._blinkInterval);
            this._blinkInterval = null;
            this._blinkColor = null;
        });
    }
    startPulse(color) {
        this.stopPulse();
        this._pulseScale = 1;
        this._pulseInterval = setInterval(() => {
            this._pulseScale = this._pulseScale === 1 ? 1.2 : 1;
            this.style.transform = `scale(${this._pulseScale})`;
            this.applyColor(this._pulseScale === 1.2 ? color : this._widget?.styles.baseColor ?? '#808080');
        }, 600);
    }
    stopPulse() {
        if (this._pulseInterval !== null) {
            clearInterval(this._pulseInterval);
            this._pulseInterval = null;
        }
        this._pulseScale = 1;
        this.style.transform = '';
    }
    disconnectedCallback() {
        // deferred stop 무시하고 즉시 정리
        this._blinkStopToken++;
        if (this._blinkInterval !== null) {
            clearInterval(this._blinkInterval);
            this._blinkInterval = null;
            this._blinkColor = null;
        }
        this.stopPulse();
        this._handleMouseLeave();
        this.removeEventListener('mouseenter', this._handleMouseEnter);
        this.removeEventListener('mouseleave', this._handleMouseLeave);
    }
    applyColor(_color) { }
}
