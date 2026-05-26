var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class DataBindingEngine {
  constructor(url) {
    __publicField(this, "ws", null);
    __publicField(this, "subscribers", /* @__PURE__ */ new Map());
    __publicField(this, "reconnectTimer", null);
    __publicField(this, "url");
    this.url = url;
  }
  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        for (const tagId of this.subscribers.keys()) {
          this.ws.send(JSON.stringify({ type: "subscribe", tagId }));
        }
      };
      this.ws.onmessage = (e) => this.handleMessage(e.data);
      this.ws.onclose = () => this.scheduleReconnect();
      this.ws.onerror = () => this.ws?.close();
    } catch {
      this.scheduleReconnect();
    }
  }
  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
  subscribe(tagId, cb) {
    if (!this.subscribers.has(tagId)) {
      this.subscribers.set(tagId, /* @__PURE__ */ new Set());
    }
    this.subscribers.get(tagId).add(cb);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "subscribe", tagId }));
    }
  }
  unsubscribe(tagId, cb) {
    this.subscribers.get(tagId)?.delete(cb);
  }
  handleMessage(raw) {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === "tag_update") {
        this.dispatch(msg.data);
      }
    } catch {
    }
  }
  dispatch(tag) {
    const cbs = this.subscribers.get(tag.tagId);
    if (cbs) {
      cbs.forEach((cb) => cb(tag.value));
    }
  }
  scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => this.connect(), 3e3);
  }
}
export {
  DataBindingEngine
};
