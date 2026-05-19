// 캔버스 설정 패널 — 해상도, 배경색, 배경 이미지
import $ from 'jquery';
import { useEditorStore } from '../store/editorStore';

const store = useEditorStore;

const PRESETS = [
  { label: '1920×1080 (16:9)', w: 1920, h: 1080 },
  { label: '1280×720 (16:9)', w: 1280, h: 720 },
  { label: '1024×768 (4:3)', w: 1024, h: 768 },
  { label: '800×600 (4:3)', w: 800, h: 600 },
  { label: '2560×1080 (21:9)', w: 2560, h: 1080 },
  { label: '3840×2160 (4K)', w: 3840, h: 2160 },
];

function renderPanel() {
  const { schema } = store.getState();
  const c = schema.canvas;

  $('#canvas-width').val(c.width);
  $('#canvas-height').val(c.height);
  $('#canvas-bg-color').val(c.backgroundColor);
  $('#canvas-bg-image').val(c.backgroundImage ?? '');
  $('#canvas-bg-fit').val(c.backgroundImageFit ?? 'cover');
}

export function initCanvasSettings() {
  // 프리셋 채우기
  const $presets = $('#canvas-presets').empty();
  PRESETS.forEach((p) => {
    $presets.append(`<option value="${p.w}x${p.h}">${p.label}</option>`);
  });
  $presets.prepend('<option value="">해상도 프리셋...</option>');

  $presets.on('change', function () {
    const val = $(this).val() as string;
    if (!val) return;
    const [w, h] = val.split('x').map(Number);
    store.getState().setCanvas({ width: w, height: h });
    $(this).val('');
  });

  // 너비/높이 입력
  $('#canvas-width').on('change', function () {
    const v = Math.max(100, Math.min(7680, Number($(this).val())));
    store.getState().setCanvas({ width: v });
  });
  $('#canvas-height').on('change', function () {
    const v = Math.max(100, Math.min(7680, Number($(this).val())));
    store.getState().setCanvas({ height: v });
  });

  // 배경색
  $('#canvas-bg-color').on('input', function () {
    store.getState().setCanvas({ backgroundColor: $(this).val() as string });
  });

  // 배경 이미지 URL
  $('#canvas-bg-image').on('change', function () {
    store.getState().setCanvas({ backgroundImage: $(this).val() as string || undefined });
  });

  // 배경 이미지 업로드
  $('#canvas-bg-upload').on('change', function () {
    const file = (this as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      store.getState().setCanvas({ backgroundImage: url });
      $('#canvas-bg-image').val(url);
    };
    reader.readAsDataURL(file);
    (this as HTMLInputElement).value = '';
  });

  // 배경 맞춤
  $('#canvas-bg-fit').on('change', function () {
    store.getState().setCanvas({ backgroundImageFit: $(this).val() as 'cover' | 'contain' | 'fill' });
  });

  // 배경 이미지 제거
  $('#btn-clear-bg').on('click', () => {
    store.getState().setCanvas({ backgroundImage: undefined });
    $('#canvas-bg-image').val('');
  });

  store.subscribe(() => renderPanel());
  renderPanel();
}
