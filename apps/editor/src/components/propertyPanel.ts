// 속성 패널 — 선택된 위젯의 모든 속성 편집 (x-template 섹션별)
import $ from 'jquery';
import type { Widget } from '@wzhmi/core';
import { useEditorStore } from '../store/editorStore';

const store = useEditorStore;

type Animation = { condition: string; property: string; value: string; effect: string };

function renderPanel() {
  const { schema, selectedId } = store.getState();
  const $panel = $('#property-panel');

  if (!selectedId) {
    $panel.html('<div class="prop-empty">위젯을 선택하세요</div>');
    return;
  }
  const w = schema.widgets.find(x => x.id === selectedId);
  if (!w) { $panel.empty(); return; }

  $panel.html(buildHtml(w));
  bindEvents($panel, w);
}

function buildHtml(w: Widget): string {
  const isLine   = w.type === 'LINE';
  const isGauge  = w.type === 'GAUGE' || w.type === 'TANK';
  const isText   = w.type === 'TEXT_LABEL';
  const isOven   = w.type === 'OVEN';
  const isPipe   = w.type === 'PIPE';

  const anims   = (w.styles.animations ?? []) as Animation[];
  const shape   = String(w.properties.shape ?? 'rect');
  const flanges = w.properties.flanges !== false;

  const fontOptions = [
    ['', '기본'],
    ['sans-serif', 'Sans-serif'],
    ['monospace', 'Monospace'],
    ['Arial', 'Arial'],
    ['Verdana', 'Verdana'],
    ['Segoe UI', 'Segoe UI'],
    ['Courier New', 'Courier New'],
    ['Nanum Gothic', '나눔고딕'],
  ].map(([val, lbl]) =>
    `<option value="${val}"${(w.properties.fontFamily ?? '') === val ? ' selected' : ''}>${lbl}</option>`
  ).join('');

  const bgColorVal = (() => {
    const c = String(w.properties.bgColor ?? '');
    return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(c) ? c : '#000000';
  })();

  return `
    <!-- 기본 정보 -->
    <div class="prop-section">
      <div class="prop-section-title">기본 정보</div>
      <div class="prop-row"><label>ID</label><span class="prop-static">${esc(w.id)}</span></div>
      <div class="prop-row"><label>이름</label>
        <input type="text" class="prop-input" data-field="name" value="${esc(w.name)}" /></div>
      ${!isLine ? `
      <div class="prop-row"><label>라벨</label>
        <input type="text" class="prop-input" data-field="properties.label" value="${esc(String(w.properties.label ?? ''))}" /></div>
      <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <label>라벨 위치</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;width:100%">
          ${([['top','위쪽'],['right','오른쪽'],['bottom','아래쪽'],['left','왼쪽']] as const).map(([side, lbl]) => `
            <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:#ccc">
              <input type="radio" name="label-side-${w.id}" data-field="properties.labelSide"
                value="${side}" ${(w.properties.labelSide ?? 'bottom') === side ? 'checked' : ''} />
              ${lbl}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="properties.showValue"
            ${(w.type === 'TEXT_LABEL' ? w.properties.showValue !== false : !!w.properties.showValue) ? 'checked' : ''} />
          <span style="color:#ccc;font-size:12px">태그값 표시</span>
        </label>
      </div>` : ''}
      <div class="prop-row"><label>라벨 색상</label>
        <div style="display:flex;gap:6px;align-items:center;flex:1">
          <input type="color" style="width:36px;height:26px;padding:0;border:none;background:none;cursor:pointer"
            data-field="properties.labelColor"
            value="${/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(w.properties.labelColor ?? '')) ? String(w.properties.labelColor) : '#cccccc'}" />
          <input type="text" class="prop-input" data-field="properties.labelColor" style="flex:1"
            placeholder="기본 (#ccc)" value="${esc(String(w.properties.labelColor ?? ''))}" />
        </div>
      </div>
      <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <label>비고</label>
        <textarea class="prop-input" data-field="properties.remarks"
          style="width:100%;height:52px;resize:vertical" placeholder="설명 또는 메모">${esc(String(w.properties.remarks ?? ''))}</textarea>
      </div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="properties.showTooltip"
            ${w.properties.showTooltip !== false ? 'checked' : ''} />
          <span style="color:#ccc;font-size:12px">뷰어에서 비고 툴팁 표시</span>
        </label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 72px;gap:6px;align-items:center">
        <div class="prop-row"><label>폰트</label>
          <select class="prop-input" data-field="properties.fontFamily">${fontOptions}</select></div>
        <input type="number" class="prop-input" data-field="properties.fontSize" min="6" max="72"
          placeholder="크기" title="폰트 크기" value="${w.properties.fontSize != null ? Number(w.properties.fontSize) : ''}" />
      </div>
    </div>

    ${isText ? `
    <!-- TEXT_LABEL 도형 -->
    <div class="prop-section">
      <div class="prop-section-title">도형</div>
      <div class="prop-row"><label>도형</label>
        <select class="prop-input" data-field="properties.shape">
          ${(['rect','rounded','ellipse','triangle','diamond','freeform'] as const).map(s =>
            `<option value="${s}"${shape === s ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row"><label>외곽선</label>
        <input type="number" class="prop-input" data-field="properties.strokeWidth"
          min="0" max="20" step="0.5" value="${Number(w.properties.strokeWidth ?? 1)}" /></div>
      ${shape === 'rounded' ? `
      <div class="prop-row"><label>모서리 반경</label>
        <input type="range" class="prop-input" data-field="properties.cornerRadius"
          min="0" max="50" step="1" value="${Number(w.properties.cornerRadius ?? 10)}" /></div>` : ''}
      ${shape === 'freeform' ? `
      <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <label>꼭짓점 (100×100)</label>
        <textarea class="prop-input" data-field="properties.shapePoints"
          style="width:100%;height:56px;resize:vertical;font-family:monospace;font-size:11px"
          placeholder="예: 50,2 96,26 96,74 50,98 4,74 4,26">${esc(String(w.properties.shapePoints ?? '50,2 96,26 96,74 50,98 4,74 4,26'))}</textarea>
        <span style="font-size:10px;color:#666">x,y 쌍을 공백으로 구분 · 범위 0~100</span>
      </div>` : ''}
      <div class="prop-row"><label>배경색</label>
        <div style="display:flex;gap:6px;align-items:center;flex:1">
          <input type="color" style="width:36px;height:26px;padding:0;border:none;background:none;cursor:pointer"
            data-field="properties.bgColor" value="${bgColorVal}" />
          <input type="text" class="prop-input" data-field="properties.bgColor" style="flex:1"
            placeholder="기본 (어두운 반투명)" value="${esc(String(w.properties.bgColor ?? ''))}" />
        </div>
      </div>
    </div>` : ''}

    ${!isLine ? `
    <!-- 위치/크기 -->
    <div class="prop-section">
      <div class="prop-section-title">위치 / 크기</div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>X</label><input type="number" class="prop-input" data-field="geometry.x" value="${w.geometry.x}" /></div>
        <div class="prop-row"><label>Y</label><input type="number" class="prop-input" data-field="geometry.y" value="${w.geometry.y}" /></div>
      </div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>W</label><input type="number" class="prop-input" data-field="geometry.width" value="${w.geometry.width}" /></div>
        <div class="prop-row"><label>H</label><input type="number" class="prop-input" data-field="geometry.height" value="${w.geometry.height}" /></div>
      </div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>회전</label><input type="number" class="prop-input" data-field="geometry.rotation" value="${w.geometry.rotation ?? 0}" /></div>
        <div class="prop-row"><label>Z</label><input type="number" class="prop-input" data-field="geometry.zIndex" value="${w.geometry.zIndex}" /></div>
      </div>
    </div>` : ''}

    <!-- 데이터 바인딩 -->
    <div class="prop-section">
      <div class="prop-section-title">데이터 바인딩</div>
      <div class="prop-row"><label>미리보기 값</label>
        <input type="text" class="prop-input" data-field="properties.previewValue"
          placeholder="예: 1, 0, true" value="${esc(String(w.properties.previewValue ?? ''))}" /></div>
      <div class="prop-row"><label>태그 ID</label>
        <input type="text" class="prop-input" data-field="binding.tagId" value="${esc(w.binding.tagId ?? '')}" /></div>
      <div class="prop-row"><label>타입</label>
        <select class="prop-input" data-field="binding.dataType">
          ${['INT','FLOAT','BOOL','STRING'].map(t =>
            `<option value="${t}"${w.binding.dataType === t ? ' selected' : ''}>${t}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row"><label>갱신주기(ms)</label>
        <input type="number" class="prop-input" data-field="binding.refreshRate" value="${w.binding.refreshRate ?? 500}" /></div>
      <div class="prop-row"><label>포매터</label>
        <input type="text" class="prop-input" data-field="binding.formatter"
          placeholder="없음 또는 직접 입력" value="${esc(String(w.binding.formatter ?? ''))}" /></div>
      ${buildFormatterSamples()}
    </div>

    <!-- 스타일 -->
    <div class="prop-section">
      <div class="prop-section-title">스타일</div>
      <div class="prop-row"><label>기본색</label>
        <div style="display:flex;gap:6px;align-items:center;flex:1">
          <input type="color" style="width:36px;height:26px;padding:0;border:none;background:none;cursor:pointer"
            data-field="styles.baseColor" value="${esc(w.styles.baseColor ?? '#808080')}" />
          <input type="text" class="prop-input" data-field="styles.baseColor" style="flex:1"
            value="${esc(w.styles.baseColor ?? '#808080')}" />
        </div>
      </div>
      <div class="prop-row"><label>투명도</label>
        <input type="range" class="prop-input" data-field="styles.opacity"
          min="0" max="1" step="0.05" value="${w.styles.opacity ?? 1}" /></div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="styles.visible"
            ${w.styles.visible !== false ? 'checked' : ''} />
          <span style="color:#ccc;font-size:12px">표시</span>
        </label>
      </div>
    </div>

    <!-- 애니메이션 조건 -->
    <div class="prop-section">
      <div class="prop-section-title">
        애니메이션 조건
        <button class="prop-btn-sm js-add-anim">+ 추가</button>
      </div>
      <div id="anim-list">
        ${anims.map((anim, i) => buildAnimRow(anim, i, isLine || isPipe)).join('')}
      </div>
    </div>

    <!-- 인터랙션 -->
    <div class="prop-section">
      <div class="prop-section-title">인터랙션</div>
      <div class="prop-row"><label>클릭 액션</label>
        <input type="text" class="prop-input" data-field="actions.onClick"
          value="${esc(String(w.actions.onClick ?? ''))}" /></div>
      <div class="prop-row"><label>권한</label>
        <select class="prop-input" data-field="actions.role">
          <option value="">없음</option>
          ${['VIEWER','OPERATOR','ADMIN'].map(r =>
            `<option value="${r}"${w.actions.role === r ? ' selected' : ''}>${r}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="actions.confirmRequired"
            ${w.actions.confirmRequired ? 'checked' : ''} />
          <span style="color:#ccc;font-size:12px">조작 전 확인 창</span>
        </label>
      </div>
    </div>

    ${isPipe ? `
    <!-- PIPE 설정 -->
    <div class="prop-section">
      <div class="prop-section-title">파이프 설정</div>
      <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <label>방향</label>
        <div style="display:flex;gap:16px">
          ${(['horizontal','vertical'] as const).map(val => `
            <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:#ccc">
              <input type="radio" name="pipe-orient-${w.id}" data-field="properties.orientation"
                value="${val}" ${(w.properties.orientation ?? 'horizontal') === val ? 'checked' : ''} />
              ${val === 'horizontal' ? '수평' : '수직'}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="prop-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;width:100%">
          <input type="checkbox" class="prop-checkbox" data-field="properties.flanges"
            ${flanges ? 'checked' : ''} />
          <span style="color:#ccc;font-size:12px">플랜지 표시</span>
        </label>
      </div>
      ${flanges ? `
      <div class="prop-row"><label>플랜지 크기</label>
        <input type="number" class="prop-input" data-field="properties.flangeSize"
          min="2" max="30" value="${Number(w.properties.flangeSize ?? 8)}" /></div>` : ''}
      <div class="prop-row"><label>흐름 속도</label>
        <input type="number" class="prop-input" data-field="properties.flowSpeed"
          min="0.5" max="30" step="0.5" value="${Number(w.properties.flowSpeed ?? 3)}" /></div>
    </div>` : ''}

    ${isGauge ? `
    <!-- GAUGE/TANK 범위 -->
    <div class="prop-section">
      <div class="prop-section-title">범위 설정</div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>최솟값</label><input type="number" class="prop-input" data-field="properties.min" value="${Number(w.properties.min ?? 0)}" /></div>
        <div class="prop-row"><label>최댓값</label><input type="number" class="prop-input" data-field="properties.max" value="${Number(w.properties.max ?? 100)}" /></div>
      </div>
      <div class="prop-row"><label>단위</label>
        <input type="text" class="prop-input" data-field="properties.unit"
          value="${esc(String(w.properties.unit ?? ''))}" /></div>
    </div>` : ''}

    ${isLine ? `
    <!-- LINE 설정 -->
    <div class="prop-section">
      <div class="prop-section-title">라인 설정</div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>시작 X</label><input type="number" class="prop-input" data-field="properties.x1" value="${Number(w.properties.x1 ?? 0)}" /></div>
        <div class="prop-row"><label>시작 Y</label><input type="number" class="prop-input" data-field="properties.y1" value="${Number(w.properties.y1 ?? 0)}" /></div>
      </div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>끝 X</label><input type="number" class="prop-input" data-field="properties.x2" value="${Number(w.properties.x2 ?? 0)}" /></div>
        <div class="prop-row"><label>끝 Y</label><input type="number" class="prop-input" data-field="properties.y2" value="${Number(w.properties.y2 ?? 0)}" /></div>
      </div>
      <div class="prop-row"><label>두께</label>
        <input type="number" class="prop-input" data-field="properties.lineWidth"
          min="1" max="20" value="${Number(w.properties.lineWidth ?? 2)}" /></div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>선 스타일</label>
          <select class="prop-input" data-field="properties.lineStyle">
            ${['solid','dashed','dotted'].map(s =>
              `<option value="${s}"${(w.properties.lineStyle ?? 'solid') === s ? ' selected' : ''}>${s === 'solid' ? '실선' : s === 'dashed' ? '파선' : '점선'}</option>`
            ).join('')}
          </select>
        </div>
        <div class="prop-row"><label>경로 유형</label>
          <select class="prop-input" data-field="properties.lineType">
            ${['straight','orthogonal','curved'].map(s =>
              `<option value="${s}"${(w.properties.lineType ?? 'straight') === s ? ' selected' : ''}>${s === 'straight' ? '직선' : s === 'orthogonal' ? '직각' : '곡선'}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="prop-row" style="gap:16px">
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:#ccc">
          <input type="checkbox" class="prop-checkbox" data-field="properties.arrowStart"
            ${!!w.properties.arrowStart ? 'checked' : ''} />시작 화살표
        </label>
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:12px;color:#ccc">
          <input type="checkbox" class="prop-checkbox" data-field="properties.arrowEnd"
            ${w.properties.arrowEnd !== false ? 'checked' : ''} />끝 화살표
        </label>
      </div>
      <div class="prop-row"><label>화살표 크기</label>
        <input type="number" class="prop-input" data-field="properties.arrowSize"
          min="4" max="60" value="${Number(w.properties.arrowSize ?? 10)}" /></div>
      <div class="prop-row"><label>흐름 속도</label>
        <input type="number" class="prop-input" data-field="properties.flowSpeed"
          min="0.5" max="30" step="0.5" value="${Number(w.properties.flowSpeed ?? 2)}" /></div>
      <div class="prop-row" style="justify-content:space-between">
        <span style="font-size:12px;color:#aaa">관절: ${((w.properties.waypoints as unknown[]) ?? []).length}개</span>
        <span style="font-size:11px;color:#666">더블클릭으로 추가/제거</span>
        ${((w.properties.waypoints as unknown[]) ?? []).length > 0 ? `
        <button class="prop-btn-sm js-clear-waypoints" style="color:#f66;border-color:#5a2a2a">모두 제거</button>` : ''}
      </div>
    </div>` : ''}

    ${isOven ? `
    <!-- OVEN 가동시간 바인딩 -->
    <div class="prop-section">
      <div class="prop-section-title">가동시간 바인딩</div>
      <div class="prop-row"><label>미리보기 값</label>
        <input type="text" class="prop-input" data-field="properties.runtimePreviewValue"
          placeholder="예: 1234" value="${esc(String(w.properties.runtimePreviewValue ?? ''))}" /></div>
      <div class="prop-row"><label>태그 ID</label>
        <input type="text" class="prop-input" data-field="extraBindings.runtime.tagId"
          placeholder="없으면 숨김" value="${esc(String((w.extraBindings?.runtime as {tagId?: string} | undefined)?.tagId ?? ''))}" /></div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>타입</label>
          <select class="prop-input" data-field="extraBindings.runtime.dataType">
            ${['INT','FLOAT','BOOL','STRING'].map(t =>
              `<option value="${t}"${((w.extraBindings?.runtime as {dataType?: string} | undefined)?.dataType ?? 'INT') === t ? ' selected' : ''}>${t}</option>`
            ).join('')}
          </select>
        </div>
        <div class="prop-row"><label>갱신주기</label>
          <input type="number" class="prop-input" data-field="extraBindings.runtime.refreshRate"
            value="${Number((w.extraBindings?.runtime as {refreshRate?: number} | undefined)?.refreshRate ?? 1000)}" /></div>
      </div>
      <div class="prop-row"><label>단위</label>
        <input type="text" class="prop-input" data-field="properties.runtimeUnit"
          value="${esc(String(w.properties.runtimeUnit ?? 'h'))}" /></div>
    </div>` : ''}
  `;
}

function buildAnimRow(anim: Animation, i: number, showFlow = false): string {
  const colorVal = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(anim.value) ? anim.value : '#ff0000';
  return `
    <div class="anim-row" data-anim-idx="${i}"
         style="flex-direction:column;align-items:stretch;background:#12121e;border:1px solid #2a2a3a;border-radius:4px;padding:6px 8px;gap:6px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:10px;color:#666">조건 #${i + 1}</span>
        <button class="prop-btn-sm js-del-anim" data-anim-idx="${i}" style="color:#f66;border-color:#5a2a2a">✕</button>
      </div>
      <div class="prop-row" style="margin:0">
        <label>조건</label>
        <input type="text" class="prop-input anim-field" data-anim-idx="${i}" data-anim-field="condition"
               placeholder="예: == 1, > 50" value="${esc(anim.condition)}" />
      </div>
      <div class="prop-row" style="margin:0">
        <label>색상</label>
        <div style="display:flex;gap:4px;flex:1;min-width:0">
          <input type="color" class="anim-field" data-anim-idx="${i}" data-anim-field="value"
                 value="${colorVal}" style="width:28px;height:24px;padding:0;border:none;background:none;cursor:pointer;flex-shrink:0" />
          <input type="text" class="prop-input anim-field" data-anim-idx="${i}" data-anim-field="value"
                 value="${esc(anim.value)}" />
        </div>
      </div>
      <div class="prop-row" style="margin:0">
        <label>효과</label>
        <select class="prop-input anim-field" data-anim-idx="${i}" data-anim-field="effect">
          <option value="static" ${anim.effect === 'static' ? 'selected' : ''}>static</option>
          <option value="blink"  ${anim.effect === 'blink'  ? 'selected' : ''}>blink</option>
          <option value="pulse"  ${anim.effect === 'pulse'  ? 'selected' : ''}>pulse</option>
          ${showFlow ? `<option value="flow" ${anim.effect === 'flow' ? 'selected' : ''}>flow</option>` : ''}
        </select>
      </div>
    </div>
  `;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function buildFormatterSamples(): string {
  const rowStyle = 'display:flex;justify-content:space-between;align-items:center;padding:2px 5px;margin-bottom:2px;border-radius:3px;cursor:pointer;background:#14141f;border:1px solid #2a2a3a';
  const codeStyle = 'font-size:10px;color:#7ab;font-family:monospace;word-break:break-all';
  const descStyle = 'font-size:10px;color:#556;white-space:nowrap;margin-left:6px';
  const chipStyle = 'padding:2px 6px;background:#14141f;border:1px solid #2a2a3a;border-radius:3px;cursor:pointer;font-size:10px;color:#7ab;font-family:monospace';
  const hStyle = 'font-size:10px;color:#445;margin-bottom:3px';

  const unitSamples: [string, string][] = [
    ['${value}°C',                   '온도 단위'],
    ['${value.toFixed(1)} bar',      '소수 1자리 + 단위'],
    ['${value} L/min',               '유량 단위'],
    ['${Number(value).toFixed(2)}%', '소수 2자리 퍼센트'],
  ];

  const rangeSamples: [string, string][] = [
    ["${value > 0 ? '가동' : '정지'}",                              '2단계 상태'],
    ["${value >= 80 ? '⚠고온' : value >= 50 ? '정상' : '저온'}",  '3단계 범위'],
    ["${value >= 100 ? '만수위' : value + '%'}",                    '조건부 단위'],
  ];

  const builtins: [string, string][] = [
    ['temperature', '36.5°C'],
    ['pressure',    '1.23 bar'],
    ['percent',     '75.0%'],
    ['rpm',         '1200 RPM'],
    ['motorStatus', '정지/가동/오류'],
    ['valveState',  '닫힘/열림'],
    ['onOff',       'ON/OFF'],
    ['yesNo',       'Yes/No'],
  ];

  const rows = (list: [string, string][]) =>
    list.map(([s, d]) =>
      `<div class="js-fmt-sample" data-sample="${esc(s)}" style="${rowStyle}">` +
      `<code style="${codeStyle}">${esc(s)}</code>` +
      `<span style="${descStyle}">${d}</span></div>`
    ).join('');

  return (
    `<div style="margin-top:6px;padding-top:5px;border-top:1px solid #1e1e30">` +
    `<div style="font-size:10px;color:#556;margin-bottom:5px">포매터 샘플 · 클릭하면 입력</div>` +
    `<div style="${hStyle}">단위 표시</div>${rows(unitSamples)}` +
    `<div style="${hStyle};margin-top:5px">범위별 표시</div>${rows(rangeSamples)}` +
    `<div style="${hStyle};margin-top:5px">내장 포매터</div>` +
    `<div style="display:flex;flex-wrap:wrap;gap:3px">` +
    builtins.map(([n, d]) =>
      `<span class="js-fmt-sample" data-sample="${n}" title="${d}" style="${chipStyle}">${n}</span>`
    ).join('') +
    `</div></div>`
  );
}

function parsePath(field: string): { parts: string[] } {
  return { parts: field.split('.') };
}

function applyPatch(w: Widget, parts: string[], rawValue: unknown): Partial<Widget> {
  if (parts[0] === 'name') return { name: String(rawValue) };

  const numFields = new Set([
    'x', 'y', 'width', 'height', 'rotation', 'zIndex',
    'min', 'max', 'lineWidth', 'strokeWidth', 'opacity',
    'flowSpeed', 'cornerRadius', 'fontSize', 'flangeSize',
    'arrowSize', 'refreshRate', 'x1', 'y1', 'x2', 'y2',
  ]);
  const boolFields = new Set([
    'visible', 'confirmRequired', 'arrowStart', 'arrowEnd',
    'showTooltip', 'showValue', 'flanges',
  ]);

  let value: unknown = rawValue;
  const lastKey = parts[parts.length - 1];
  if (numFields.has(lastKey)) value = Number(rawValue);
  if (boolFields.has(lastKey)) value = Boolean(rawValue);

  if (parts[0] === 'geometry' && parts.length === 2)
    return { geometry: { [parts[1]]: value } as never };
  if (parts[0] === 'binding' && parts.length === 2)
    return { binding: { [parts[1]]: value } as never };
  if (parts[0] === 'styles' && parts.length === 2)
    return { styles: { [parts[1]]: value } as never };
  if (parts[0] === 'actions' && parts.length === 2)
    return { actions: { [parts[1]]: value } as never };
  if (parts[0] === 'properties' && parts.length === 2)
    return { properties: { [parts[1]]: value } as never };
  if (parts[0] === 'extraBindings' && parts.length === 3) {
    const existing = (w.extraBindings ?? {}) as unknown as Record<string, Record<string, unknown>>;
    return {
      extraBindings: {
        ...existing,
        [parts[1]]: { ...(existing[parts[1]] ?? {}), [parts[2]]: value },
      } as never,
    };
  }
  return {};
}

function bindEvents($panel: JQuery, w: Widget) {
  const id = w.id;

  $panel.off('.prop');

  // 색상·범위 슬라이더 — input 이벤트로 실시간 반영
  $panel.on('input.prop', 'input[type=color][data-field], input[type=range][data-field]', function () {
    const { parts } = parsePath($(this).data('field') as string);
    const patch = applyPatch(w, parts, $(this).val());
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });

  // 텍스트·숫자·select·textarea — change(blur/Enter)만 사용해 커서 위치 보존
  $panel.on('change.prop', '.prop-input[data-field]', function () {
    const { parts } = parsePath($(this).data('field') as string);
    const patch = applyPatch(w, parts, $(this).val());
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });

  // 라디오 (labelSide, orientation)
  $panel.on('change.prop', 'input[type=radio][data-field]', function () {
    const { parts } = parsePath($(this).data('field') as string);
    const patch = applyPatch(w, parts, $(this).val());
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });

  // 체크박스
  $panel.on('change.prop', '.prop-checkbox[data-field]', function () {
    const { parts } = parsePath($(this).data('field') as string);
    const patch = applyPatch(w, parts, (this as HTMLInputElement).checked);
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });

  // 애니메이션 조건 편집 — 색상은 input, 나머지는 change
  $panel.on('input.prop', '.anim-field[type=color]', function () {
    const idx = Number($(this).data('anim-idx'));
    const field = $(this).data('anim-field') as string;
    const widget = store.getState().schema.widgets.find(x => x.id === id);
    if (!widget) return;
    const anims = [...((widget.styles.animations ?? []) as Animation[])];
    anims[idx] = { ...anims[idx], [field]: $(this).val() };
    store.getState().updateWidget(id, { styles: { animations: anims } as never });
  });
  $panel.on('change.prop', '.anim-field', function () {
    const idx = Number($(this).data('anim-idx'));
    const field = $(this).data('anim-field') as string;
    const widget = store.getState().schema.widgets.find(x => x.id === id);
    if (!widget) return;
    const anims = [...((widget.styles.animations ?? []) as Animation[])];
    anims[idx] = { ...anims[idx], [field]: $(this).val() };
    store.getState().updateWidget(id, { styles: { animations: anims } as never });
  });

  // 애니메이션 추가
  $panel.on('click.prop', '.js-add-anim', () => {
    const widget = store.getState().schema.widgets.find(x => x.id === id);
    if (!widget) return;
    const anims = [...((widget.styles.animations ?? []) as Animation[])];
    anims.push({ condition: '== 1', property: 'fill', value: '#00ff00', effect: 'static' });
    store.getState().updateWidget(id, { styles: { animations: anims } as never });
  });

  // 애니메이션 삭제
  $panel.on('click.prop', '.js-del-anim', function () {
    const idx = Number($(this).data('anim-idx'));
    const widget = store.getState().schema.widgets.find(x => x.id === id);
    if (!widget) return;
    const anims = ((widget.styles.animations ?? []) as Animation[]).filter((_, i) => i !== idx);
    store.getState().updateWidget(id, { styles: { animations: anims } as never });
  });

  // LINE 관절 전체 제거
  $panel.on('click.prop', '.js-clear-waypoints', () => {
    store.getState().updateWidget(id, { properties: { waypoints: [] } as never });
  });

  // 포매터 샘플 클릭 → 입력창에 채우기
  $panel.on('click.prop', '.js-fmt-sample', function () {
    const sample = $(this).data('sample') as string;
    $panel.find('input[data-field="binding.formatter"]').val(sample).trigger('change');
  });
}

export function initPropertyPanel() {
  store.subscribe(() => renderPanel());
  renderPanel();
}
