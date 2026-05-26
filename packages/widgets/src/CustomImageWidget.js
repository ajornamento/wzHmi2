import { BaseWidget } from "./base/BaseWidget";
import { getCustomWidgetDef } from "./customWidgetRegistry";
class CustomImageWidget extends BaseWidget {
  render() {
    this.innerHTML = "";
    const W = this.offsetWidth || 120;
    const H = this.offsetHeight || 120;
    const def = getCustomWidgetDef(this._widget?.type ?? "");
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      width: `${W}px`,
      height: `${H}px`,
      position: "relative",
      overflow: "hidden"
    });
    if (def?.imageData) {
      const img = document.createElement("img");
      img.src = def.imageData;
      img.style.cssText = "width:100%;height:100%;object-fit:contain;pointer-events:none;display:block;";
      img.draggable = false;
      wrapper.appendChild(img);
    } else {
      const fallback = document.createElement("div");
      Object.assign(fallback.style, {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#2a2a3a",
        border: "1px dashed #666",
        color: "#888",
        fontSize: "11px",
        textAlign: "center",
        padding: "4px",
        boxSizing: "border-box"
      });
      fallback.textContent = this._widget?.type.replace("CUSTOM_", "") ?? "?";
      wrapper.appendChild(fallback);
    }
    this.appendChild(wrapper);
    const labelText = this._widget?.properties.label;
    if (labelText) {
      this._labelElement = this.createLabelElement(labelText, this.getLabelSide());
      this.appendChild(this._labelElement);
    }
    this.updateVisuals();
  }
  updateVisuals() {
    if (!this._widget) return;
    this.stopBlink();
    this.stopPulse();
    const anim = this.getActiveAnimation();
    if (!anim) return;
    if (anim.effect === "blink") this.startBlink(anim.value);
    else if (anim.effect === "pulse") this.startPulse(anim.value);
  }
  applyColor(_color) {
  }
}
customElements.define("hmi-custom-image", CustomImageWidget);
export {
  CustomImageWidget
};
