var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class PollingDataSource {
  constructor(serverUrl, intervalMs = 2e3, fetchFn) {
    __publicField(this, "httpUrl");
    __publicField(this, "intervalMs");
    __publicField(this, "fetchFn");
    __publicField(this, "subscribers", /* @__PURE__ */ new Map());
    __publicField(this, "timer", null);
    this.httpUrl = serverUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");
    this.intervalMs = intervalMs;
    this.fetchFn = fetchFn ?? this.defaultFetch.bind(this);
  }
  connect() {
    this.poll();
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }
  disconnect() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  subscribe(tagId, cb) {
    if (!this.subscribers.has(tagId)) this.subscribers.set(tagId, /* @__PURE__ */ new Set());
    this.subscribers.get(tagId).add(cb);
    this.pollBatch([tagId]);
  }
  unsubscribe(tagId, cb) {
    const set = this.subscribers.get(tagId);
    set?.delete(cb);
    if (set?.size === 0) this.subscribers.delete(tagId);
  }
  async defaultFetch(tagIds) {
    const res = await fetch(`${this.httpUrl}/api/tags/values`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagIds })
    });
    if (!res.ok) return [];
    return res.json();
  }
  async poll() {
    const tagIds = Array.from(this.subscribers.keys());
    if (tagIds.length === 0) return;
    await this.pollBatch(tagIds);
  }
  async pollBatch(tagIds) {
    try {
      const values = await this.fetchFn(tagIds);
      for (const tv of values) {
        this.subscribers.get(tv.tagId)?.forEach((cb) => cb(tv.value));
      }
    } catch {
    }
  }
}
export {
  PollingDataSource
};
