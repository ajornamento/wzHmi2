var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import mqtt from "mqtt";
const TOPIC_PREFIX = "hmi/tags/";
class MqttDataSource {
  constructor(brokerUrl) {
    __publicField(this, "client", null);
    __publicField(this, "subscribers", /* @__PURE__ */ new Map());
    __publicField(this, "brokerUrl");
    this.brokerUrl = brokerUrl;
  }
  connect() {
    this.client = mqtt.connect(this.brokerUrl, { reconnectPeriod: 0 });
    this.client.on("connect", () => {
      for (const tagId of this.subscribers.keys()) {
        this.client.subscribe(`${TOPIC_PREFIX}${tagId}`);
      }
    });
    this.client.on("message", (topic, payload) => {
      const tagId = topic.slice(TOPIC_PREFIX.length);
      try {
        const value = JSON.parse(payload.toString());
        this.subscribers.get(tagId)?.forEach((cb) => cb(value));
      } catch {
      }
    });
    this.client.on("error", (err) => {
      console.error(`[MQTT] \uBE0C\uB85C\uCEE4 \uC5F0\uACB0 \uC2E4\uD328 (${this.brokerUrl}):`, err.message);
      this.client?.end();
    });
  }
  disconnect() {
    this.client?.end();
    this.client = null;
  }
  subscribe(tagId, cb) {
    if (!this.subscribers.has(tagId)) this.subscribers.set(tagId, /* @__PURE__ */ new Set());
    this.subscribers.get(tagId).add(cb);
    if (this.client?.connected) {
      this.client.subscribe(`${TOPIC_PREFIX}${tagId}`);
    }
  }
  unsubscribe(tagId, cb) {
    const set = this.subscribers.get(tagId);
    set?.delete(cb);
    if (set?.size === 0) {
      this.subscribers.delete(tagId);
      if (this.client?.connected) {
        this.client.unsubscribe(`${TOPIC_PREFIX}${tagId}`);
      }
    }
  }
}
export {
  MqttDataSource
};
