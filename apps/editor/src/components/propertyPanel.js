import $ from "jquery";
import { useEditorStore } from "../store/editorStore";
const store = useEditorStore;
function renderPanel() {
  const { schema, selectedId } = store.getState();
  const $panel = $("#property-panel");
  if (!selectedId) {
    $panel.html('<div class="prop-empty">\uC704\uC82F\uC744 \uC120\uD0DD\uD558\uC138\uC694</div>');
    return;
  }
  const w = schema.widgets.find((x) => x.id === selectedId);
  if (!w) {
    $panel.empty();
    return;
  }
  $panel.html(buildHtml(w));
  bindEvents($panel, w);
}
function buildHtml(w) {
  const isLine = w.type === "LINE";
  const isGauge = w.type === "GAUGE" || w.type === "TANK";
  const isText = w.type === "TEXT_LABEL";
  const isOven = w.type === "OVEN";
  const isPipe = w.type === "PIPE";
  const anims = w.styles.animations ?? [];
  const shape = String(w.properties.shape ?? "rect");
  const flanges = w.properties.flanges !== false;
  const fontOptions = [
    ["", "\uAE30\uBCF8"],
    ["sans-serif", "Sans-serif"],
    ["monospace", "Monospace"],
    ["Arial", "Arial"],
    ["Verdana", "Verdana"],
    ["Segoe UI", "Segoe UI"],
    ["Courier New", "Courier New"],
    ["Nanum Gothic", "\uB098\uB214\uACE0\uB515"]
  ].map(
    ([val, lbl]) => `<option value="${val}"${(w.properties.fontFamily ?? "") === val ? " selected" : ""}>${lbl}</option>`
  ).join("");
  const bgColorVal = (() => {
    const c = String(w.properties.bgColor ?? "");
    return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(c) ? c : "#000000";
  })();
  return `
    <!-- \uAE30\uBCF8 \uC815\uBCF4 -->
    <div class="prop-section">
      <div class="prop-section-title">\uAE30\uBCF8 \uC815\uBCF4</div>
      <div class="prop-row"><label>ID</label><span class="prop-static">${esc(w.id)}</span></div>
      <div class="prop-row"><label>\uC774\uB984</label>
        <input type="text" class="prop-input" data-field="name" value="${esc(w.name)}" /></div>
      ${!isLine ? `
      <div class="prop-row"><label>\uB77C\uBCA8</label>
        <input type="text" class="prop-input" data-field="properties.label" value="${esc(String(w.properties.label ?? ""))}" /></div>
      <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <label>\uB77C\uBCA8 \uC704\uCE58</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;width:100%">
          ${[["top", "\uC704\uCABD"], ["right", "\uC624\uB978\uCABD"], ["bottom", "\uC544\uB798\uCABD"], ["left", "\uC67C\uCABD"]].map(([side, lbl]) => `
            <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:#ccc">
              <input type="radio" name="label-side-${w.id}" data-field="properties.labelSide"
                value="${side}" ${(w.properties.labelSide ?? "bottom") === side ? "checked" : ""} />
              ${lbl}
            </label>
          `).join("")}
        </div>
      </div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="properties.showValue"
            ${(w.type === "TEXT_LABEL" ? w.properties.showValue !== false : !!w.properties.showValue) ? "checked" : ""} />
          <span style="color:#ccc;font-size:12px">\uD0DC\uADF8\uAC12 \uD45C\uC2DC</span>
        </label>
      </div>` : ""}
      <div class="prop-row"><label>\uB77C\uBCA8 \uC0C9\uC0C1</label>
        <div style="display:flex;gap:6px;align-items:center;flex:1">
          <input type="color" style="width:36px;height:26px;padding:0;border:none;background:none;cursor:pointer"
            data-field="properties.labelColor"
            value="${/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(w.properties.labelColor ?? "")) ? String(w.properties.labelColor) : "#cccccc"}" />
          <input type="text" class="prop-input" data-field="properties.labelColor" style="flex:1"
            placeholder="\uAE30\uBCF8 (#ccc)" value="${esc(String(w.properties.labelColor ?? ""))}" />
        </div>
      </div>
      <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <label>\uBE44\uACE0</label>
        <textarea class="prop-input" data-field="properties.remarks"
          style="width:100%;height:52px;resize:vertical" placeholder="\uC124\uBA85 \uB610\uB294 \uBA54\uBAA8">${esc(String(w.properties.remarks ?? ""))}</textarea>
      </div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="properties.showTooltip"
            ${w.properties.showTooltip !== false ? "checked" : ""} />
          <span style="color:#ccc;font-size:12px">\uBDF0\uC5B4\uC5D0\uC11C \uBE44\uACE0 \uD234\uD301 \uD45C\uC2DC</span>
        </label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 72px;gap:6px;align-items:center">
        <div class="prop-row"><label>\uD3F0\uD2B8</label>
          <select class="prop-input" data-field="properties.fontFamily">${fontOptions}</select></div>
        <input type="number" class="prop-input" data-field="properties.fontSize" min="6" max="72"
          placeholder="\uD06C\uAE30" title="\uD3F0\uD2B8 \uD06C\uAE30" value="${w.properties.fontSize != null ? Number(w.properties.fontSize) : ""}" />
      </div>
    </div>

    ${isText ? `
    <!-- TEXT_LABEL \uB3C4\uD615 -->
    <div class="prop-section">
      <div class="prop-section-title">\uB3C4\uD615</div>
      <div class="prop-row"><label>\uB3C4\uD615</label>
        <select class="prop-input" data-field="properties.shape">
          ${["rect", "rounded", "ellipse", "triangle", "diamond", "freeform"].map(
    (s) => `<option value="${s}"${shape === s ? " selected" : ""}>${s}</option>`
  ).join("")}
        </select>
      </div>
      <div class="prop-row"><label>\uC678\uACFD\uC120</label>
        <input type="number" class="prop-input" data-field="properties.strokeWidth"
          min="0" max="20" step="0.5" value="${Number(w.properties.strokeWidth ?? 1)}" /></div>
      ${shape === "rounded" ? `
      <div class="prop-row"><label>\uBAA8\uC11C\uB9AC \uBC18\uACBD</label>
        <input type="range" class="prop-input" data-field="properties.cornerRadius"
          min="0" max="50" step="1" value="${Number(w.properties.cornerRadius ?? 10)}" /></div>` : ""}
      ${shape === "freeform" ? `
      <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <label>\uAF2D\uC9D3\uC810 (100\xD7100)</label>
        <textarea class="prop-input" data-field="properties.shapePoints"
          style="width:100%;height:56px;resize:vertical;font-family:monospace;font-size:11px"
          placeholder="\uC608: 50,2 96,26 96,74 50,98 4,74 4,26">${esc(String(w.properties.shapePoints ?? "50,2 96,26 96,74 50,98 4,74 4,26"))}</textarea>
        <span style="font-size:10px;color:#666">x,y \uC30D\uC744 \uACF5\uBC31\uC73C\uB85C \uAD6C\uBD84 \xB7 \uBC94\uC704 0~100</span>
      </div>` : ""}
      <div class="prop-row"><label>\uBC30\uACBD\uC0C9</label>
        <div style="display:flex;gap:6px;align-items:center;flex:1">
          <input type="color" style="width:36px;height:26px;padding:0;border:none;background:none;cursor:pointer"
            data-field="properties.bgColor" value="${bgColorVal}" />
          <input type="text" class="prop-input" data-field="properties.bgColor" style="flex:1"
            placeholder="\uAE30\uBCF8 (\uC5B4\uB450\uC6B4 \uBC18\uD22C\uBA85)" value="${esc(String(w.properties.bgColor ?? ""))}" />
        </div>
      </div>
    </div>` : ""}

    ${!isLine ? `
    <!-- \uC704\uCE58/\uD06C\uAE30 -->
    <div class="prop-section">
      <div class="prop-section-title">\uC704\uCE58 / \uD06C\uAE30</div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>X</label><input type="number" class="prop-input" data-field="geometry.x" value="${w.geometry.x}" /></div>
        <div class="prop-row"><label>Y</label><input type="number" class="prop-input" data-field="geometry.y" value="${w.geometry.y}" /></div>
      </div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>W</label><input type="number" class="prop-input" data-field="geometry.width" value="${w.geometry.width}" /></div>
        <div class="prop-row"><label>H</label><input type="number" class="prop-input" data-field="geometry.height" value="${w.geometry.height}" /></div>
      </div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>\uD68C\uC804</label><input type="number" class="prop-input" data-field="geometry.rotation" value="${w.geometry.rotation ?? 0}" /></div>
        <div class="prop-row"><label>Z</label><input type="number" class="prop-input" data-field="geometry.zIndex" value="${w.geometry.zIndex}" /></div>
      </div>
    </div>` : ""}

    <!-- \uB370\uC774\uD130 \uBC14\uC778\uB529 -->
    <div class="prop-section">
      <div class="prop-section-title">\uB370\uC774\uD130 \uBC14\uC778\uB529</div>
      <div class="prop-row"><label>\uBBF8\uB9AC\uBCF4\uAE30 \uAC12</label>
        <input type="text" class="prop-input" data-field="properties.previewValue"
          placeholder="\uC608: 1, 0, true" value="${esc(String(w.properties.previewValue ?? ""))}" /></div>
      <div class="prop-row"><label>\uD0DC\uADF8 ID</label>
        <input type="text" class="prop-input" data-field="binding.tagId" value="${esc(w.binding.tagId ?? "")}" /></div>
      <div class="prop-row"><label>\uD0C0\uC785</label>
        <select class="prop-input" data-field="binding.dataType">
          ${["INT", "FLOAT", "BOOL", "STRING"].map(
    (t) => `<option value="${t}"${w.binding.dataType === t ? " selected" : ""}>${t}</option>`
  ).join("")}
        </select>
      </div>
      <div class="prop-row"><label>\uAC31\uC2E0\uC8FC\uAE30(ms)</label>
        <input type="number" class="prop-input" data-field="binding.refreshRate" value="${w.binding.refreshRate ?? 500}" /></div>
      <div class="prop-row"><label>\uD3EC\uB9E4\uD130</label>
        <input type="text" class="prop-input" data-field="binding.formatter"
          placeholder="\uC5C6\uC74C \uB610\uB294 \uC9C1\uC811 \uC785\uB825" value="${esc(String(w.binding.formatter ?? ""))}" /></div>
      ${buildFormatterSamples()}
    </div>

    <!-- \uC2A4\uD0C0\uC77C -->
    <div class="prop-section">
      <div class="prop-section-title">\uC2A4\uD0C0\uC77C</div>
      <div class="prop-row"><label>\uAE30\uBCF8\uC0C9</label>
        <div style="display:flex;gap:6px;align-items:center;flex:1">
          <input type="color" style="width:36px;height:26px;padding:0;border:none;background:none;cursor:pointer"
            data-field="styles.baseColor" value="${esc(w.styles.baseColor ?? "#808080")}" />
          <input type="text" class="prop-input" data-field="styles.baseColor" style="flex:1"
            value="${esc(w.styles.baseColor ?? "#808080")}" />
        </div>
      </div>
      <div class="prop-row"><label>\uD22C\uBA85\uB3C4</label>
        <input type="range" class="prop-input" data-field="styles.opacity"
          min="0" max="1" step="0.05" value="${w.styles.opacity ?? 1}" /></div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="styles.visible"
            ${w.styles.visible !== false ? "checked" : ""} />
          <span style="color:#ccc;font-size:12px">\uD45C\uC2DC</span>
        </label>
      </div>
    </div>

    <!-- \uC560\uB2C8\uBA54\uC774\uC158 \uC870\uAC74 -->
    <div class="prop-section">
      <div class="prop-section-title">
        \uC560\uB2C8\uBA54\uC774\uC158 \uC870\uAC74
        <button class="prop-btn-sm js-add-anim">+ \uCD94\uAC00</button>
      </div>
      <div id="anim-list">
        ${anims.map((anim, i) => buildAnimRow(anim, i, isLine || isPipe)).join("")}
      </div>
    </div>

    <!-- \uC778\uD130\uB799\uC158 -->
    <div class="prop-section">
      <div class="prop-section-title">\uC778\uD130\uB799\uC158</div>
      <div class="prop-row"><label>\uD074\uB9AD \uC561\uC158</label>
        <input type="text" class="prop-input" data-field="actions.onClick"
          value="${esc(String(w.actions.onClick ?? ""))}" /></div>
      <div class="prop-row"><label>\uAD8C\uD55C</label>
        <select class="prop-input" data-field="actions.role">
          <option value="">\uC5C6\uC74C</option>
          ${["VIEWER", "OPERATOR", "ADMIN"].map(
    (r) => `<option value="${r}"${w.actions.role === r ? " selected" : ""}>${r}</option>`
  ).join("")}
        </select>
      </div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="actions.confirmRequired"
            ${w.actions.confirmRequired ? "checked" : ""} />
          <span style="color:#ccc;font-size:12px">\uC870\uC791 \uC804 \uD655\uC778 \uCC3D</span>
        </label>
      </div>
    </div>

    ${isPipe ? `
    <!-- PIPE \uC124\uC815 -->
    <div class="prop-section">
      <div class="prop-section-title">\uD30C\uC774\uD504 \uC124\uC815</div>
      <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <label>\uBC29\uD5A5</label>
        <div style="display:flex;gap:16px">
          ${["horizontal", "vertical"].map((val) => `
            <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:#ccc">
              <input type="radio" name="pipe-orient-${w.id}" data-field="properties.orientation"
                value="${val}" ${(w.properties.orientation ?? "horizontal") === val ? "checked" : ""} />
              ${val === "horizontal" ? "\uC218\uD3C9" : "\uC218\uC9C1"}
            </label>
          `).join("")}
        </div>
      </div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="properties.flanges"
            ${flanges ? "checked" : ""} />
          <span style="color:#ccc;font-size:12px">\uD50C\uB79C\uC9C0 \uD45C\uC2DC</span>
        </label>
      </div>
      ${flanges ? `
      <div class="prop-row"><label>\uD50C\uB79C\uC9C0 \uD06C\uAE30</label>
        <input type="number" class="prop-input" data-field="properties.flangeSize"
          min="2" max="30" value="${Number(w.properties.flangeSize ?? 8)}" /></div>` : ""}
      <div class="prop-row"><label>\uD750\uB984 \uC18D\uB3C4</label>
        <input type="number" class="prop-input" data-field="properties.flowSpeed"
          min="0.5" max="30" step="0.5" value="${Number(w.properties.flowSpeed ?? 3)}" /></div>
    </div>` : ""}

    ${isGauge ? `
    <!-- GAUGE/TANK \uBC94\uC704 -->
    <div class="prop-section">
      <div class="prop-section-title">\uBC94\uC704 \uC124\uC815</div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>\uCD5C\uC19F\uAC12</label><input type="number" class="prop-input" data-field="properties.min" value="${Number(w.properties.min ?? 0)}" /></div>
        <div class="prop-row"><label>\uCD5C\uB313\uAC12</label><input type="number" class="prop-input" data-field="properties.max" value="${Number(w.properties.max ?? 100)}" /></div>
      </div>
      <div class="prop-row"><label>\uB2E8\uC704</label>
        <input type="text" class="prop-input" data-field="properties.unit"
          value="${esc(String(w.properties.unit ?? ""))}" /></div>
    </div>` : ""}

    ${isLine ? `
    <!-- LINE \uC124\uC815 -->
    <div class="prop-section">
      <div class="prop-section-title">\uB77C\uC778 \uC124\uC815</div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>\uC2DC\uC791 X</label><input type="number" class="prop-input" data-field="properties.x1" value="${Number(w.properties.x1 ?? 0)}" /></div>
        <div class="prop-row"><label>\uC2DC\uC791 Y</label><input type="number" class="prop-input" data-field="properties.y1" value="${Number(w.properties.y1 ?? 0)}" /></div>
      </div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>\uB05D X</label><input type="number" class="prop-input" data-field="properties.x2" value="${Number(w.properties.x2 ?? 0)}" /></div>
        <div class="prop-row"><label>\uB05D Y</label><input type="number" class="prop-input" data-field="properties.y2" value="${Number(w.properties.y2 ?? 0)}" /></div>
      </div>
      <div class="prop-row"><label>\uB450\uAED8</label>
        <input type="number" class="prop-input" data-field="properties.lineWidth"
          min="1" max="20" value="${Number(w.properties.lineWidth ?? 2)}" /></div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>\uC120 \uC2A4\uD0C0\uC77C</label>
          <select class="prop-input" data-field="properties.lineStyle">
            ${["solid", "dashed", "dotted"].map(
    (s) => `<option value="${s}"${(w.properties.lineStyle ?? "solid") === s ? " selected" : ""}>${s === "solid" ? "\uC2E4\uC120" : s === "dashed" ? "\uD30C\uC120" : "\uC810\uC120"}</option>`
  ).join("")}
          </select>
        </div>
        <div class="prop-row"><label>\uACBD\uB85C \uC720\uD615</label>
          <select class="prop-input" data-field="properties.lineType">
            ${["straight", "orthogonal", "curved"].map(
    (s) => `<option value="${s}"${(w.properties.lineType ?? "straight") === s ? " selected" : ""}>${s === "straight" ? "\uC9C1\uC120" : s === "orthogonal" ? "\uC9C1\uAC01" : "\uACE1\uC120"}</option>`
  ).join("")}
          </select>
        </div>
      </div>
      <div class="prop-row" style="gap:16px">
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:#ccc">
          <input type="checkbox" class="prop-checkbox" data-field="properties.arrowStart"
            ${!!w.properties.arrowStart ? "checked" : ""} />\uC2DC\uC791 \uD654\uC0B4\uD45C
        </label>
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:#ccc">
          <input type="checkbox" class="prop-checkbox" data-field="properties.arrowEnd"
            ${w.properties.arrowEnd !== false ? "checked" : ""} />\uB05D \uD654\uC0B4\uD45C
        </label>
      </div>
      <div class="prop-row"><label>\uD654\uC0B4\uD45C \uD06C\uAE30</label>
        <input type="number" class="prop-input" data-field="properties.arrowSize"
          min="4" max="60" value="${Number(w.properties.arrowSize ?? 10)}" /></div>
      <div class="prop-row"><label>\uD750\uB984 \uC18D\uB3C4</label>
        <input type="number" class="prop-input" data-field="properties.flowSpeed"
          min="0.5" max="30" step="0.5" value="${Number(w.properties.flowSpeed ?? 2)}" /></div>
      <div class="prop-row" style="justify-content:space-between">
        <span style="font-size:12px;color:#aaa">\uAD00\uC808: ${(w.properties.waypoints ?? []).length}\uAC1C</span>
        <span style="font-size:11px;color:#666">\uB354\uBE14\uD074\uB9AD\uC73C\uB85C \uCD94\uAC00/\uC81C\uAC70</span>
        ${(w.properties.waypoints ?? []).length > 0 ? `
        <button class="prop-btn-sm js-clear-waypoints" style="color:#f66;border-color:#5a2a2a">\uBAA8\uB450 \uC81C\uAC70</button>` : ""}
      </div>
    </div>` : ""}

    ${isOven ? `
    <!-- OVEN \uAC00\uB3D9\uC2DC\uAC04 \uBC14\uC778\uB529 -->
    <div class="prop-section">
      <div class="prop-section-title">\uAC00\uB3D9\uC2DC\uAC04 \uBC14\uC778\uB529</div>
      <div class="prop-row"><label>\uBBF8\uB9AC\uBCF4\uAE30 \uAC12</label>
        <input type="text" class="prop-input" data-field="properties.runtimePreviewValue"
          placeholder="\uC608: 1234" value="${esc(String(w.properties.runtimePreviewValue ?? ""))}" /></div>
      <div class="prop-row"><label>\uD0DC\uADF8 ID</label>
        <input type="text" class="prop-input" data-field="extraBindings.runtime.tagId"
          placeholder="\uC5C6\uC73C\uBA74 \uC228\uAE40" value="${esc(String(w.extraBindings?.runtime?.tagId ?? ""))}" /></div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>\uD0C0\uC785</label>
          <select class="prop-input" data-field="extraBindings.runtime.dataType">
            ${["INT", "FLOAT", "BOOL", "STRING"].map(
    (t) => `<option value="${t}"${(w.extraBindings?.runtime?.dataType ?? "INT") === t ? " selected" : ""}>${t}</option>`
  ).join("")}
          </select>
        </div>
        <div class="prop-row"><label>\uAC31\uC2E0\uC8FC\uAE30</label>
          <input type="number" class="prop-input" data-field="extraBindings.runtime.refreshRate"
            value="${Number(w.extraBindings?.runtime?.refreshRate ?? 1e3)}" /></div>
      </div>
      <div class="prop-row"><label>\uB2E8\uC704</label>
        <input type="text" class="prop-input" data-field="properties.runtimeUnit"
          value="${esc(String(w.properties.runtimeUnit ?? "h"))}" /></div>
    </div>` : ""}
  `;
}
function buildAnimRow(anim, i, showFlow = false) {
  const colorVal = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(anim.value) ? anim.value : "#ff0000";
  return `
    <div class="anim-row" data-anim-idx="${i}"
         style="flex-direction:column;align-items:stretch;background:#12121e;border:1px solid #2a2a3a;border-radius:4px;padding:6px 8px;gap:6px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:10px;color:#666">\uC870\uAC74 #${i + 1}</span>
        <button class="prop-btn-sm js-del-anim" data-anim-idx="${i}" style="color:#f66;border-color:#5a2a2a">\u2715</button>
      </div>
      <div class="prop-row" style="margin:0">
        <label>\uC870\uAC74</label>
        <input type="text" class="prop-input anim-field" data-anim-idx="${i}" data-anim-field="condition"
               placeholder="\uC608: == 1, > 50" value="${esc(anim.condition)}" />
      </div>
      <div class="prop-row" style="margin:0">
        <label>\uC0C9\uC0C1</label>
        <div style="display:flex;gap:4px;flex:1;min-width:0">
          <input type="color" class="anim-field" data-anim-idx="${i}" data-anim-field="value"
                 value="${colorVal}" style="width:28px;height:24px;padding:0;border:none;background:none;cursor:pointer;flex-shrink:0" />
          <input type="text" class="prop-input anim-field" data-anim-idx="${i}" data-anim-field="value"
                 value="${esc(anim.value)}" />
        </div>
      </div>
      <div class="prop-row" style="margin:0">
        <label>\uD6A8\uACFC</label>
        <select class="prop-input anim-field" data-anim-idx="${i}" data-anim-field="effect">
          <option value="static" ${anim.effect === "static" ? "selected" : ""}>static</option>
          <option value="blink"  ${anim.effect === "blink" ? "selected" : ""}>blink</option>
          <option value="pulse"  ${anim.effect === "pulse" ? "selected" : ""}>pulse</option>
          ${showFlow ? `<option value="flow" ${anim.effect === "flow" ? "selected" : ""}>flow</option>` : ""}
        </select>
      </div>
    </div>
  `;
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function buildFormatterSamples() {
  const rowStyle = "display:flex;justify-content:space-between;align-items:center;padding:2px 5px;margin-bottom:2px;border-radius:3px;cursor:pointer;background:#14141f;border:1px solid #2a2a3a";
  const codeStyle = "font-size:10px;color:#7ab;font-family:monospace;word-break:break-all";
  const descStyle = "font-size:10px;color:#556;white-space:nowrap;margin-left:6px";
  const chipStyle = "padding:2px 6px;background:#14141f;border:1px solid #2a2a3a;border-radius:3px;cursor:pointer;font-size:10px;color:#7ab;font-family:monospace";
  const hStyle = "font-size:10px;color:#445;margin-bottom:3px";
  const unitSamples = [
    ["${value}\xB0C", "\uC628\uB3C4 \uB2E8\uC704"],
    ["${value.toFixed(1)} bar", "\uC18C\uC218 1\uC790\uB9AC + \uB2E8\uC704"],
    ["${value} L/min", "\uC720\uB7C9 \uB2E8\uC704"],
    ["${Number(value).toFixed(2)}%", "\uC18C\uC218 2\uC790\uB9AC \uD37C\uC13C\uD2B8"]
  ];
  const rangeSamples = [
    ["${value > 0 ? '\uAC00\uB3D9' : '\uC815\uC9C0'}", "2\uB2E8\uACC4 \uC0C1\uD0DC"],
    ["${value >= 80 ? '\u26A0\uACE0\uC628' : value >= 50 ? '\uC815\uC0C1' : '\uC800\uC628'}", "3\uB2E8\uACC4 \uBC94\uC704"],
    ["${value >= 100 ? '\uB9CC\uC218\uC704' : value + '%'}", "\uC870\uAC74\uBD80 \uB2E8\uC704"]
  ];
  const builtins = [
    ["temperature", "36.5\xB0C"],
    ["pressure", "1.23 bar"],
    ["percent", "75.0%"],
    ["rpm", "1200 RPM"],
    ["motorStatus", "\uC815\uC9C0/\uAC00\uB3D9/\uC624\uB958"],
    ["valveState", "\uB2EB\uD798/\uC5F4\uB9BC"],
    ["onOff", "ON/OFF"],
    ["yesNo", "Yes/No"]
  ];
  const rows = (list) => list.map(
    ([s, d]) => `<div class="js-fmt-sample" data-sample="${esc(s)}" style="${rowStyle}"><code style="${codeStyle}">${esc(s)}</code><span style="${descStyle}">${d}</span></div>`
  ).join("");
  return `<div style="margin-top:6px;padding-top:5px;border-top:1px solid #1e1e30"><div style="font-size:10px;color:#556;margin-bottom:5px">\uD3EC\uB9E4\uD130 \uC0D8\uD50C \xB7 \uD074\uB9AD\uD558\uBA74 \uC785\uB825</div><div style="${hStyle}">\uB2E8\uC704 \uD45C\uC2DC</div>${rows(unitSamples)}<div style="${hStyle};margin-top:5px">\uBC94\uC704\uBCC4 \uD45C\uC2DC</div>${rows(rangeSamples)}<div style="${hStyle};margin-top:5px">\uB0B4\uC7A5 \uD3EC\uB9E4\uD130</div><div style="display:flex;flex-wrap:wrap;gap:3px">` + builtins.map(
    ([n, d]) => `<span class="js-fmt-sample" data-sample="${n}" title="${d}" style="${chipStyle}">${n}</span>`
  ).join("") + `</div></div>`;
}
function parsePath(field) {
  return { parts: field.split(".") };
}
function applyPatch(w, parts, rawValue) {
  if (parts[0] === "name") return { name: String(rawValue) };
  const numFields = /* @__PURE__ */ new Set([
    "x",
    "y",
    "width",
    "height",
    "rotation",
    "zIndex",
    "min",
    "max",
    "lineWidth",
    "strokeWidth",
    "opacity",
    "flowSpeed",
    "cornerRadius",
    "fontSize",
    "flangeSize",
    "arrowSize",
    "refreshRate",
    "x1",
    "y1",
    "x2",
    "y2"
  ]);
  const boolFields = /* @__PURE__ */ new Set([
    "visible",
    "confirmRequired",
    "arrowStart",
    "arrowEnd",
    "showTooltip",
    "showValue",
    "flanges"
  ]);
  let value = rawValue;
  const lastKey = parts[parts.length - 1];
  if (numFields.has(lastKey)) value = Number(rawValue);
  if (boolFields.has(lastKey)) value = Boolean(rawValue);
  if (parts[0] === "geometry" && parts.length === 2)
    return { geometry: { [parts[1]]: value } };
  if (parts[0] === "binding" && parts.length === 2)
    return { binding: { [parts[1]]: value } };
  if (parts[0] === "styles" && parts.length === 2)
    return { styles: { [parts[1]]: value } };
  if (parts[0] === "actions" && parts.length === 2)
    return { actions: { [parts[1]]: value } };
  if (parts[0] === "properties" && parts.length === 2)
    return { properties: { [parts[1]]: value } };
  if (parts[0] === "extraBindings" && parts.length === 3) {
    const existing = w.extraBindings ?? {};
    return {
      extraBindings: {
        ...existing,
        [parts[1]]: { ...existing[parts[1]] ?? {}, [parts[2]]: value }
      }
    };
  }
  return {};
}
function bindEvents($panel, w) {
  const id = w.id;
  $panel.off(".prop");
  $panel.on("input.prop", "input[type=color][data-field], input[type=range][data-field]", function() {
    const { parts } = parsePath($(this).data("field"));
    const patch = applyPatch(w, parts, $(this).val());
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });
  $panel.on("change.prop", ".prop-input[data-field]", function() {
    const { parts } = parsePath($(this).data("field"));
    const patch = applyPatch(w, parts, $(this).val());
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });
  $panel.on("change.prop", "input[type=radio][data-field]", function() {
    const { parts } = parsePath($(this).data("field"));
    const patch = applyPatch(w, parts, $(this).val());
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });
  $panel.on("change.prop", ".prop-checkbox[data-field]", function() {
    const { parts } = parsePath($(this).data("field"));
    const patch = applyPatch(w, parts, this.checked);
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });
  $panel.on("input.prop", ".anim-field[type=color]", function() {
    const idx = Number($(this).data("anim-idx"));
    const field = $(this).data("anim-field");
    const widget = store.getState().schema.widgets.find((x) => x.id === id);
    if (!widget) return;
    const anims = [...widget.styles.animations ?? []];
    anims[idx] = { ...anims[idx], [field]: $(this).val() };
    store.getState().updateWidget(id, { styles: { animations: anims } });
  });
  $panel.on("change.prop", ".anim-field", function() {
    const idx = Number($(this).data("anim-idx"));
    const field = $(this).data("anim-field");
    const widget = store.getState().schema.widgets.find((x) => x.id === id);
    if (!widget) return;
    const anims = [...widget.styles.animations ?? []];
    anims[idx] = { ...anims[idx], [field]: $(this).val() };
    store.getState().updateWidget(id, { styles: { animations: anims } });
  });
  $panel.on("click.prop", ".js-add-anim", () => {
    const widget = store.getState().schema.widgets.find((x) => x.id === id);
    if (!widget) return;
    const anims = [...widget.styles.animations ?? []];
    anims.push({ condition: "== 1", property: "fill", value: "#00ff00", effect: "static" });
    store.getState().updateWidget(id, { styles: { animations: anims } });
  });
  $panel.on("click.prop", ".js-del-anim", function() {
    const idx = Number($(this).data("anim-idx"));
    const widget = store.getState().schema.widgets.find((x) => x.id === id);
    if (!widget) return;
    const anims = (widget.styles.animations ?? []).filter((_, i) => i !== idx);
    store.getState().updateWidget(id, { styles: { animations: anims } });
  });
  $panel.on("click.prop", ".js-clear-waypoints", () => {
    store.getState().updateWidget(id, { properties: { waypoints: [] } });
  });
  $panel.on("click.prop", ".js-fmt-sample", function() {
    const sample = $(this).data("sample");
    $panel.find('input[data-field="binding.formatter"]').val(sample).trigger("change");
  });
}
function initPropertyPanel() {
  store.subscribe(() => renderPanel());
  renderPanel();
}
export {
  initPropertyPanel
};
