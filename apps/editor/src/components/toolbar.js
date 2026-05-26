import $ from "jquery";
import { useEditorStore } from "../store/editorStore";
const store = useEditorStore;
let fileHandle = null;
async function openFile() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "HMI JSON", accept: { "application/json": [".json"] } }]
    });
    fileHandle = handle;
    const file = await handle.getFile();
    const text = await file.text();
    const json = JSON.parse(text);
    store.getState().loadSchema(json, handle.name);
  } catch {
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
  await saveFileAs();
}
async function saveFileAs() {
  const { schema } = store.getState();
  const json = JSON.stringify(schema, null, 2);
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: store.getState().fileName,
      types: [{ description: "HMI JSON", accept: { "application/json": [".json"] } }]
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
function downloadJson(json, name) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function openViewer() {
  const viewerUrl = import.meta.env?.VITE_VIEWER_URL ?? "http://localhost:5174/";
  const viewer = window.open(viewerUrl, "_blank");
  if (!viewer) return;
  const schema = JSON.stringify(store.getState().schema);
  const send = () => viewer.postMessage({ type: "preview-schema", schema }, "*");
  window.addEventListener("message", function onMsg(e) {
    if (e.data?.type === "viewer-ready") {
      send();
      window.removeEventListener("message", onMsg);
    }
  });
  setTimeout(send, 1e3);
}
function updateToolbar() {
  const { historyIndex, history } = store.getState();
  $("#btn-undo").prop("disabled", historyIndex <= 0);
  $("#btn-redo").prop("disabled", historyIndex >= history.length - 1);
  $("#file-name-display").text(store.getState().fileName);
}
function initToolbar() {
  $("#btn-open").on("click", openFile);
  $("#btn-save").on("click", saveFile);
  $("#btn-save-as").on("click", saveFileAs);
  $(document).on("keydown.toolbar", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (e.shiftKey) saveFileAs();
      else saveFile();
    }
  });
  $("#btn-undo").on("click", () => store.getState().undo());
  $("#btn-redo").on("click", () => store.getState().redo());
  $("#btn-open-viewer").on("click", openViewer);
  store.subscribe(() => updateToolbar());
  updateToolbar();
}
export {
  initToolbar
};
