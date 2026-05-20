// 에디터 툴바 — 파일 I/O, 실행취소/재실행, 뷰어 열기
import $ from 'jquery';
import type { HmiSchema } from '@wzhmi/core';
import { useEditorStore } from '../store/editorStore';

const store = useEditorStore;
let fileHandle: FileSystemFileHandle | null = null;

async function openFile() {
  try {
    const [handle] = await (window as unknown as { showOpenFilePicker: (o: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
      types: [{ description: 'HMI JSON', accept: { 'application/json': ['.json'] } }],
    });
    fileHandle = handle;
    const file = await handle.getFile();
    const text = await file.text();
    const json: HmiSchema = JSON.parse(text);
    store.getState().loadSchema(json, handle.name);
  } catch {
    // 취소 시 무시
  }
}

async function saveFile() {
  const { schema } = store.getState();
  const json = JSON.stringify(schema, null, 2);

  if (fileHandle) {
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(json);
      await writable.close();
      return;
    } catch {
      fileHandle = null;
    }
  }

  // 열려있는 파일 없으면 다른이름으로 저장 흐름으로 — 이후 저장은 다이얼로그 없음
  await saveFileAs();
}

async function saveFileAs() {
  const { schema } = store.getState();
  const json = JSON.stringify(schema, null, 2);
  try {
    const handle = await (window as unknown as { showSaveFilePicker: (o: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
      suggestedName: store.getState().fileName,
      types: [{ description: 'HMI JSON', accept: { 'application/json': ['.json'] } }],
    });
    fileHandle = handle;
    store.getState().setFileName(handle.name);
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
  } catch {
    downloadJson(json, store.getState().fileName);
  }
}

function downloadJson(json: string, name: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function openViewer() {
  // 뷰어는 별도 Vite 서버(5174)로 실행됨 — 같은 오리진의 /viewer/ 경로가 아님
  const viewerUrl = (import.meta as { env?: { VITE_VIEWER_URL?: string } }).env?.VITE_VIEWER_URL ?? 'http://localhost:5174/';
  const viewer = window.open(viewerUrl, '_blank');
  if (!viewer) return;
  const schema = JSON.stringify(store.getState().schema);
  const send = () => viewer.postMessage({ type: 'preview-schema', schema }, '*');
  // 뷰어가 ready 메시지를 보내면 스키마 전송
  window.addEventListener('message', function onMsg(e: MessageEvent) {
    if (e.data?.type === 'viewer-ready') {
      send();
      window.removeEventListener('message', onMsg);
    }
  });
  // fallback: 1초 후 전송
  setTimeout(send, 1000);
}

function updateToolbar() {
  const { historyIndex, history } = store.getState();
  $('#btn-undo').prop('disabled', historyIndex <= 0);
  $('#btn-redo').prop('disabled', historyIndex >= history.length - 1);
  $('#file-name-display').text(store.getState().fileName);
}

export function initToolbar() {
  $('#btn-open').on('click', openFile);
  $('#btn-save').on('click', saveFile);
  $('#btn-save-as').on('click', saveFileAs);

  $(document).on('keydown.toolbar', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (e.shiftKey) saveFileAs(); else saveFile();
    }
  });
  $('#btn-undo').on('click', () => store.getState().undo());
  $('#btn-redo').on('click', () => store.getState().redo());
  $('#btn-open-viewer').on('click', openViewer);

  store.subscribe(() => updateToolbar());
  updateToolbar();
}
