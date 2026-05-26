var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { BaseWidget } from "./base/BaseWidget";
class ConveyorWidget extends BaseWidget {
  constructor() {
    super(...arguments);
    __publicField(this, "_belt", null);
    __publicField(this, "_slatsG", null);
    __publicField(this, "_clipId", "");
  }
  render() {
    this.innerHTML = "";
    const W = this.offsetWidth || 200;
    const H = this.offsetHeight || 80;
    const beltH = H * 0.45;
    const beltY = (H - beltH) / 2;
    const rollerR = beltH / 2;
    const beltX = rollerR;
    const beltW = W - beltH;
    const baseColor = this._widget?.styles.baseColor ?? "#808080";
    const SLOT = 20;
    const id = this._widget?.id ?? "c";
    this._clipId = `conv-clip-${id}`;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const defs = document.createElementNS(ns, "defs");
    const clip = document.createElementNS(ns, "clipPath");
    clip.id = this._clipId;
    const clipRect = document.createElementNS(ns, "rect");
    clipRect.setAttribute("x", String(beltX));
    clipRect.setAttribute("y", String(beltY));
    clipRect.setAttribute("width", String(beltW));
    clipRect.setAttribute("height", String(beltH));
    clip.appendChild(clipRect);
    defs.appendChild(clip);
    svg.appendChild(defs);
    const style = document.createElementNS(ns, "style");
    style.textContent = [
      `@keyframes conv-belt-${id} { to { transform: translateX(${SLOT}px); } }`,
      `.conv-slats-${id} { animation: conv-belt-${id} 0.8s linear infinite; animation-play-state: paused; }`,
      `.conv-running-${id} { animation-play-state: running; }`
    ].join("\n");
    svg.appendChild(style);
    const roller1 = document.createElementNS(ns, "circle");
    roller1.setAttribute("cx", String(rollerR));
    roller1.setAttribute("cy", String(H / 2));
    roller1.setAttribute("r", String(rollerR));
    roller1.setAttribute("fill", "#555");
    const roller2 = document.createElementNS(ns, "circle");
    roller2.setAttribute("cx", String(W - rollerR));
    roller2.setAttribute("cy", String(H / 2));
    roller2.setAttribute("r", String(rollerR));
    roller2.setAttribute("fill", "#555");
    const belt = document.createElementNS(ns, "rect");
    belt.setAttribute("x", String(beltX));
    belt.setAttribute("y", String(beltY));
    belt.setAttribute("width", String(beltW));
    belt.setAttribute("height", String(beltH));
    belt.setAttribute("fill", baseColor);
    this._belt = belt;
    const slatsG = document.createElementNS(ns, "g");
    slatsG.setAttribute("clip-path", `url(#${this._clipId})`);
    slatsG.classList.add(`conv-slats-${id}`);
    this._slatsG = slatsG;
    const slotCount = Math.ceil(beltW / SLOT) + 2;
    for (let i = 0; i < slotCount; i++) {
      const x = beltX + i * SLOT;
      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", String(x));
      line.setAttribute("y1", String(beltY));
      line.setAttribute("x2", String(x));
      line.setAttribute("y2", String(beltY + beltH));
      line.setAttribute("stroke", "rgba(0,0,0,0.3)");
      line.setAttribute("stroke-width", "2");
      slatsG.appendChild(line);
    }
    const topLine = document.createElementNS(ns, "line");
    topLine.setAttribute("x1", String(beltX));
    topLine.setAttribute("y1", String(beltY));
    topLine.setAttribute("x2", String(W - rollerR));
    topLine.setAttribute("y2", String(beltY));
    topLine.setAttribute("stroke", "#333");
    topLine.setAttribute("stroke-width", "2");
    const botLine = document.createElementNS(ns, "line");
    botLine.setAttribute("x1", String(beltX));
    botLine.setAttribute("y1", String(beltY + beltH));
    botLine.setAttribute("x2", String(W - rollerR));
    botLine.setAttribute("y2", String(beltY + beltH));
    botLine.setAttribute("stroke", "#333");
    botLine.setAttribute("stroke-width", "2");
    svg.appendChild(roller1);
    svg.appendChild(roller2);
    svg.appendChild(belt);
    svg.appendChild(slatsG);
    svg.appendChild(topLine);
    svg.appendChild(botLine);
    this.appendChild(svg);
    this._labelElement = this.createLabelElement(
      this._widget?.properties.label ?? "CONVEYOR",
      this.getLabelSide()
    );
    this.appendChild(this._labelElement);
    this.updateVisuals();
  }
  updateVisuals() {
    if (!this._widget) return;
    this.stopBlink();
    this.stopPulse();
    const isRunning = Number(this._value) === 1;
    const id = this._widget.id;
    if (this._slatsG) {
      this._slatsG.classList.toggle(`conv-running-${id}`, isRunning);
    }
    const anim = this.getActiveAnimation();
    const color = anim ? anim.value : this._widget.styles.baseColor;
    if (this._belt) this._belt.setAttribute("fill", color);
    if (this._labelElement) {
      this._labelElement.textContent = this._widget.properties.label ?? "CONVEYOR";
    }
    if (anim?.effect === "blink") this.startBlink(color);
    else if (anim?.effect === "pulse") this.startPulse(color);
    else {
      this.stopBlink();
      this.stopPulse();
    }
  }
  applyColor(color) {
    this._belt?.setAttribute("fill", color);
  }
}
customElements.define("hmi-conveyor", ConveyorWidget);
export {
  ConveyorWidget
};
