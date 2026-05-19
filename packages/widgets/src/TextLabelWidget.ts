import type { Widget } from '@wzhmi/core';
import { BaseWidget } from './base/BaseWidget';

type ShapeType = 'rect' | 'rounded' | 'ellipse' | 'triangle' | 'diamond' | 'freeform';

const DEFAULT_FREEFORM = '50,2 96,26 96,74 50,98 4,74 4,26'; // hexagon

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  const full = c.length === 3
    ? c.split('').map(x => x + x).join('')
    : c.padEnd(6, '0');
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildSvgShape(ns: string, shape: ShapeType, cornerRadius: number, points: string, sw: number, pad: number): SVGElement {
  switch (shape) {
    case 'ellipse': {
      const el = document.createElementNS(ns, 'ellipse') as SVGElement;
      el.setAttribute('cx', '50');
      el.setAttribute('cy', '50');
      el.setAttribute('rx', String(50 - pad));
      el.setAttribute('ry', String(50 - pad));
      return el;
    }
    case 'rounded': {
      const el = document.createElementNS(ns, 'rect') as SVGElement;
      el.setAttribute('x', String(pad));
      el.setAttribute('y', String(pad));
      el.setAttribute('width', String(100 - pad * 2));
      el.setAttribute('height', String(100 - pad * 2));
      el.setAttribute('rx', String(Math.min(50 - pad, Math.max(0, cornerRadius))));
      el.setAttribute('ry', String(Math.min(50 - pad, Math.max(0, cornerRadius))));
      return el;
    }
    case 'triangle': {
      const el = document.createElementNS(ns, 'polygon') as SVGElement;
      el.setAttribute('points', `50,${pad} ${100 - pad},${100 - pad} ${pad},${100 - pad}`);
      return el;
    }
    case 'diamond': {
      const el = document.createElementNS(ns, 'polygon') as SVGElement;
      el.setAttribute('points', `50,${pad} ${100 - pad},50 50,${100 - pad} ${pad},50`);
      return el;
    }
    case 'freeform': {
      const el = document.createElementNS(ns, 'polygon') as SVGElement;
      el.setAttribute('points', points || DEFAULT_FREEFORM);
      return el;
    }
    default: { // rect
      const el = document.createElementNS(ns, 'rect') as SVGElement;
      el.setAttribute('x', String(pad));
      el.setAttribute('y', String(pad));
      el.setAttribute('width', String(100 - pad * 2));
      el.setAttribute('height', String(100 - pad * 2));
      el.setAttribute('rx', '2');
      el.setAttribute('ry', '2');
      return el;
    }
  }
}

export class TextLabelWidget extends BaseWidget {
  private _textEl: HTMLDivElement | null = null;
  private _shapeEl: SVGElement | null = null;
  private _hasSetValue = false;

  configure(widget: Widget) {
    this._hasSetValue = false;
    super.configure(widget);
  }

  setValue(value: number | string | boolean) {
    this._hasSetValue = true;
    super.setValue(value);
  }

  private get showValue(): boolean {
    return this._widget?.properties.showValue !== false;
  }

  protected render() {
    this.innerHTML = '';
    if (!this._widget) return;

    const baseColor = this._widget.styles.baseColor ?? '#ffffff';
    const labelColor = String(this._widget.properties.labelColor ?? '#888888');
    const fontSize = Number(this._widget.properties.fontSize ?? 12);
    const fontFamily = this.getLabelFontFamily('sans-serif');
    const shape = (this._widget.properties.shape as ShapeType | undefined) ?? 'rect';
    const cornerRadius = Number(this._widget.properties.cornerRadius ?? 10);
    const shapePoints = String(this._widget.properties.shapePoints ?? DEFAULT_FREEFORM);
    const sw = Math.max(0, Number(this._widget.properties.strokeWidth ?? 3));
    const pad = sw / 2 + 0.5;
    const rotation = this._widget.geometry.rotation ?? 0;

    const ns = 'http://www.w3.org/2000/svg';

    const outer = document.createElement('div');
    Object.assign(outer.style, {
      position: 'relative',
      width: '100%',
      height: '100%',
      userSelect: 'none',
      transform: rotation ? `rotate(${-rotation}deg)` : '',
      transformOrigin: 'center center',
    });

    // SVG 도형 배경
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    Object.assign(svg.style, {
      position: 'absolute',
      top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none',
      overflow: 'visible',
    });

    const bgColor = String(this._widget.properties.bgColor ?? 'rgba(0,0,0,0.4)');
    const shapeEl = buildSvgShape(ns, shape, cornerRadius, shapePoints, sw, pad);
    shapeEl.setAttribute('fill', bgColor);
    shapeEl.setAttribute('stroke', hexToRgba(baseColor, 0.7));
    shapeEl.setAttribute('stroke-width', String(sw));
    this._shapeEl = shapeEl;
    svg.appendChild(shapeEl);
    outer.appendChild(svg);

    // 텍스트 콘텐츠
    const textDiv = document.createElement('div');
    Object.assign(textDiv.style, {
      position: 'relative',
      zIndex: '1',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily,
      textAlign: 'center',
      padding: '6px',
      boxSizing: 'border-box',
    });

    if (this.showValue) {
      const labelEl = document.createElement('div');
      Object.assign(labelEl.style, {
        fontSize: `${fontSize}px`,
        color: labelColor,
        marginBottom: '2px',
        lineHeight: '1.2',
      });
      labelEl.textContent = this._widget.properties.label ?? '';

      const valueEl = document.createElement('div');
      Object.assign(valueEl.style, {
        fontSize: `${Math.round(fontSize * 1.5)}px`,
        fontWeight: 'bold',
        color: baseColor,
        lineHeight: '1.2',
      });
      valueEl.textContent = '';
      this._textEl = valueEl;

      const unit = String(this._widget.properties.unit ?? '');
      textDiv.appendChild(labelEl);
      textDiv.appendChild(valueEl);
      if (unit) {
        const unitEl = document.createElement('div');
        Object.assign(unitEl.style, {
          fontSize: `${Math.max(8, fontSize - 2)}px`,
          color: labelColor,
          marginTop: '2px',
          lineHeight: '1.2',
        });
        unitEl.textContent = unit;
        textDiv.appendChild(unitEl);
      }
    } else {
      const labelEl = document.createElement('div');
      Object.assign(labelEl.style, {
        fontSize: `${fontSize}px`,
        color: this._widget.properties.labelColor ? labelColor : baseColor,
        fontWeight: 'bold',
        lineHeight: '1.4',
        wordBreak: 'break-word',
      });
      labelEl.textContent = this._widget.properties.label ?? '';
      this._textEl = labelEl;
      textDiv.appendChild(labelEl);
    }

    outer.appendChild(textDiv);
    this.appendChild(outer);
    this.updateVisuals();
  }

  protected updateVisuals() {
    if (!this._textEl || !this._widget) return;
    this.stopBlink();
    this.stopPulse();

    const anim = this._hasSetValue ? this.getActiveAnimation() : null;
    const color = anim ? anim.value : this._widget.styles.baseColor;
    const sw = Math.max(0, Number(this._widget.properties.strokeWidth ?? 3));

    this._textEl.style.color = color;
    if (this._shapeEl) {
      const bgColor = String(this._widget.properties.bgColor ?? 'rgba(0,0,0,0.4)');
      this._shapeEl.setAttribute('stroke-width', String(sw));
      this._shapeEl.setAttribute('stroke', hexToRgba(color, 0.75));
      if (anim?.effect === 'static' || anim?.effect === 'blink' || anim?.effect === 'pulse') {
        this._shapeEl.setAttribute('fill', hexToRgba(color, 0.3));
      } else {
        this._shapeEl.setAttribute('fill', bgColor);
      }
    }

    if (this.showValue) {
      this._textEl.textContent = this._hasSetValue ? this.getDisplayValue() : '';
    }

    if (anim?.effect === 'blink') this.startBlink(color);
    else if (anim?.effect === 'pulse') this.startPulse(color);
  }

  protected applyColor(color: string) {
    if (this._textEl) this._textEl.style.color = color;
    if (this._shapeEl && this._widget) {
      this._shapeEl.setAttribute('fill', hexToRgba(color, 0.3));
      this._shapeEl.setAttribute('stroke', hexToRgba(color, 0.75));
    }
  }
}

customElements.define('hmi-text-label', TextLabelWidget);
