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
  const isLine = w.type === 'LINE';
  const isGauge = w.type === 'GAUGE' || w.type === 'TANK';
  const isText = w.type === 'TEXT_LABEL';
  const isOven = w.type === 'OVEN';

  const anims: Animation[] = (w.styles.animations ?? []) as Animation[];

  return `
    <!-- 기본 정보 -->
    <div class="prop-section">
      <div class="prop-section-title">기본 정보</div>
      <div class="prop-row"><label>ID</label><span class="prop-static">${w.id}</span></div>
      <div class="prop-row"><label>이름</label>
        <input type="text" class="prop-input" data-field="name" value="${esc(w.name)}" /></div>
      <div class="prop-row"><label>라벨</label>
        <input type="text" class="prop-input" data-field="properties.label" value="${esc(String(w.properties.label ?? ''))}" /></div>
    </div>

    <!-- 위치/크기 -->
    <div class="prop-section">
      <div class="prop-section-title">위치 / 크기</div>
      ${isLine ? '' : `
      <div class="prop-row-2col">
        <div class="prop-row"><label>X</label><input type="number" class="prop-input" data-field="geometry.x" value="${w.geometry.x}" /></div>
        <div class="prop-row"><label>Y</label><input type="number" class="prop-input" data-field="geometry.y" value="${w.geometry.y}" /></div>
      </div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>W</label><input type="number" class="prop-input" data-field="geometry.width" value="${w.geometry.width}" /></div>
        <div class="prop-row"><label>H</label><input type="number" class="prop-input" data-field="geometry.height" value="${w.geometry.height}" /></div>
      </div>
      <div class="prop-row"><label>회전</label>
        <input type="number" class="prop-input" data-field="geometry.rotation" value="${w.geometry.rotation ?? 0}" /></div>
      <div class="prop-row"><label>zIndex</label>
        <input type="number" class="prop-input" data-field="geometry.zIndex" value="${w.geometry.zIndex}" /></div>
      `}
    </div>

    <!-- TEXT_LABEL 도형 -->
    ${isText ? `
    <div class="prop-section">
      <div class="prop-section-title">도형</div>
      <div class="prop-row"><label>도형</label>
        <select class="prop-input" data-field="properties.shape">
          ${['rect','rounded','ellipse','triangle','diamond','freeform'].map(s =>
            `<option value="${s}"${w.properties.shape === s ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row"><label>외곽선</label>
        <input type="number" class="prop-input" data-field="properties.strokeWidth" value="${w.properties.strokeWidth ?? 1}" /></div>
    </div>` : ''}

    <!-- 데이터 바인딩 -->
    <div class="prop-section">
      <div class="prop-section-title">데이터 바인딩</div>
      <div class="prop-row"><label>태그 ID</label>
        <input type="text" class="prop-input" data-field="binding.tagId" value="${esc(w.binding.tagId ?? '')}" /></div>
      <div class="prop-row"><label>타입</label>
        <select class="prop-input" data-field="binding.dataType">
          ${['INT','FLOAT','BOOL','STRING'].map(t =>
            `<option value="${t}"${w.binding.dataType === t ? ' selected' : ''}>${t}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row"><label>포매터</label>
        <input type="text" class="prop-input" data-field="binding.formatter" value="${esc(String(w.binding.formatter ?? ''))}" /></div>
    </div>

    <!-- 스타일 -->
    <div class="prop-section">
      <div class="prop-section-title">스타일</div>
      <div class="prop-row"><label>기본색</label>
        <input type="color" class="prop-input" data-field="styles.baseColor" value="${w.styles.baseColor ?? '#2a3a5a'}" /></div>
      <div class="prop-row"><label>투명도</label>
        <input type="range" class="prop-input" data-field="styles.opacity" min="0" max="1" step="0.05" value="${w.styles.opacity ?? 1}" /></div>
      <div class="prop-row"><label>표시</label>
        <input type="checkbox" class="prop-checkbox" data-field="styles.visible" ${w.styles.visible !== false ? 'checked' : ''} /></div>
    </div>

    <!-- GAUGE/TANK 범위 -->
    ${isGauge ? `
    <div class="prop-section">
      <div class="prop-section-title">범위</div>
      <div class="prop-row-2col">
        <div class="prop-row"><label>최소</label><input type="number" class="prop-input" data-field="properties.min" value="${w.properties.min ?? 0}" /></div>
        <div class="prop-row"><label>최대</label><input type="number" class="prop-input" data-field="properties.max" value="${w.properties.max ?? 100}" /></div>
      </div>
      <div class="prop-row"><label>단위</label>
        <input type="text" class="prop-input" data-field="properties.unit" value="${esc(String(w.properties.unit ?? ''))}" /></div>
    </div>` : ''}

    <!-- LINE 전용 -->
    ${isLine ? `
    <div class="prop-section">
      <div class="prop-section-title">라인 설정</div>
      <div class="prop-row"><label>선 스타일</label>
        <select class="prop-input" data-field="properties.lineStyle">
          ${['solid','dashed','dotted'].map(s =>
            `<option value="${s}"${w.properties.lineStyle === s ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row"><label>경로 유형</label>
        <select class="prop-input" data-field="properties.lineType">
          ${['straight','orthogonal','curved'].map(s =>
            `<option value="${s}"${w.properties.lineType === s ? ' selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row"><label>선 굵기</label>
        <input type="number" class="prop-input" data-field="properties.lineWidth" value="${w.properties.lineWidth ?? 2}" /></div>
    </div>` : ''}

    <!-- OVEN 추가 바인딩 -->
    ${isOven ? `
    <div class="prop-section">
      <div class="prop-section-title">가동시간 바인딩</div>
      <div class="prop-row"><label>태그 ID</label>
        <input type="text" class="prop-input" data-field="extraBindings.runtime.tagId"
               value="${esc(String((w.extraBindings?.['runtime'] as {tagId?: string})?.tagId ?? ''))}" /></div>
    </div>` : ''}

    <!-- 애니메이션 조건 -->
    <div class="prop-section">
      <div class="prop-section-title">
        애니메이션 조건
        <button class="prop-btn-sm js-add-anim">+ 추가</button>
      </div>
      <div id="anim-list">
        ${anims.map((anim, i) => buildAnimRow(anim, i)).join('')}
      </div>
    </div>

    <!-- 인터랙션 -->
    <div class="prop-section">
      <div class="prop-section-title">인터랙션</div>
      <div class="prop-row"><label>클릭 액션</label>
        <input type="text" class="prop-input" data-field="actions.onClick" value="${esc(String(w.actions.onClick ?? ''))}" /></div>
      <div class="prop-row"><label>권한</label>
        <select class="prop-input" data-field="actions.role">
          <option value="">없음</option>
          ${['VIEWER','OPERATOR','ADMIN'].map(r =>
            `<option value="${r}"${w.actions.role === r ? ' selected' : ''}>${r}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row"><label>확인 필요</label>
        <input type="checkbox" class="prop-checkbox" data-field="actions.confirmRequired" ${w.actions.confirmRequired ? 'checked' : ''} /></div>
    </div>
  `;
}

function buildAnimRow(anim: Animation, i: number): string {
  return `
    <div class="anim-row" data-anim-idx="${i}">
      <input type="text" class="prop-input anim-field" data-anim-idx="${i}" data-anim-field="condition"
             placeholder="조건 (예: >=80)" value="${esc(anim.condition)}" />
      <input type="color" class="anim-field" data-anim-idx="${i}" data-anim-field="value"
             value="${anim.value || '#ff0000'}" style="width:36px;height:28px;padding:0;border:none;cursor:pointer" />
      <select class="prop-input anim-field" data-anim-idx="${i}" data-anim-field="effect" style="width:80px">
        ${['static','blink','pulse','flow'].map(e =>
          `<option value="${e}"${anim.effect === e ? ' selected' : ''}>${e}</option>`
        ).join('')}
      </select>
      <button class="prop-btn-sm js-del-anim" data-anim-idx="${i}">×</button>
    </div>
  `;
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

// 중첩 경로 파싱: "geometry.x" → { root: 'geometry', key: 'x' }
function parsePath(field: string): { parts: string[] } {
  return { parts: field.split('.') };
}

function applyPatch(w: Widget, parts: string[], rawValue: unknown): Partial<Widget> {
  if (parts[0] === 'name') return { name: String(rawValue) };

  const numFields = new Set(['x','y','width','height','rotation','zIndex','min','max','lineWidth','strokeWidth','opacity','flowSpeed','cornerRadius','fontSize']);
  const boolFields = new Set(['visible','confirmRequired','arrowStart','arrowEnd','showTooltip','showValue']);

  let value: unknown = rawValue;
  if (numFields.has(parts[parts.length - 1])) value = Number(rawValue);
  if (boolFields.has(parts[parts.length - 1])) value = Boolean(rawValue);

  if (parts[0] === 'geometry' && parts.length === 2) {
    return { geometry: { [parts[1]]: value } as never };
  }
  if (parts[0] === 'binding' && parts.length === 2) {
    return { binding: { [parts[1]]: value } as never };
  }
  if (parts[0] === 'styles' && parts.length === 2) {
    return { styles: { [parts[1]]: value } as never };
  }
  if (parts[0] === 'actions' && parts.length === 2) {
    return { actions: { [parts[1]]: value } as never };
  }
  if (parts[0] === 'properties' && parts.length === 2) {
    return { properties: { [parts[1]]: value } as never };
  }
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

  // 일반 input/select
  $panel.on('input change', '.prop-input[data-field]', function () {
    const { parts } = parsePath($(this).data('field') as string);
    const rawValue = $(this).val();
    const patch = applyPatch(w, parts, rawValue);
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });

  // 체크박스
  $panel.on('change', '.prop-checkbox[data-field]', function () {
    const { parts } = parsePath($(this).data('field') as string);
    const patch = applyPatch(w, parts, (this as HTMLInputElement).checked);
    if (Object.keys(patch).length) store.getState().updateWidget(id, patch);
  });

  // 애니메이션 조건 편집
  $panel.on('input change', '.anim-field', function () {
    const idx = Number($(this).data('anim-idx'));
    const field = $(this).data('anim-field') as string;
    const state = store.getState();
    const widget = state.schema.widgets.find(x => x.id === id);
    if (!widget) return;
    const anims = [...((widget.styles.animations ?? []) as Animation[])];
    anims[idx] = { ...anims[idx], [field]: $(this).val() };
    store.getState().updateWidget(id, { styles: { animations: anims } as never });
  });

  // 애니메이션 추가
  $panel.on('click', '.js-add-anim', () => {
    const state = store.getState();
    const widget = state.schema.widgets.find(x => x.id === id);
    if (!widget) return;
    const anims = [...((widget.styles.animations ?? []) as Animation[])];
    anims.push({ condition: '>0', property: 'value', value: '#ff0000', effect: 'static' });
    store.getState().updateWidget(id, { styles: { animations: anims } as never });
  });

  // 애니메이션 삭제
  $panel.on('click', '.js-del-anim', function () {
    const idx = Number($(this).data('anim-idx'));
    const state = store.getState();
    const widget = state.schema.widgets.find(x => x.id === id);
    if (!widget) return;
    const anims = ((widget.styles.animations ?? []) as Animation[]).filter((_, i) => i !== idx);
    store.getState().updateWidget(id, { styles: { animations: anims } as never });
  });
}

export function initPropertyPanel() {
  store.subscribe(() => renderPanel());
  renderPanel();
}
