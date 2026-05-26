var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const MOCK_TAGS = [
  { tagId: "PLC_01.MTR_STATUS", min: 0, max: 2, type: "step", period: 5e3, states: [0, 1, 1, 1, 2] },
  { tagId: "PLC_01.MTR2_STATUS", min: 0, max: 2, type: "step", period: 7e3, states: [0, 0, 1, 1] },
  { tagId: "PLC_01.VALVE1", min: 0, max: 1, type: "bool", period: 6e3 },
  { tagId: "PLC_01.VALVE2", min: 0, max: 100, type: "sawtooth", period: 1e4 },
  { tagId: "PLC_01.TANK_LEVEL", min: 0, max: 100, type: "sine", period: 15e3 },
  { tagId: "PLC_01.PRESSURE", min: 0, max: 10, type: "sine", period: 8e3 },
  { tagId: "PLC_01.TEMP_01", min: 20, max: 80, type: "sine", period: 12e3 },
  { tagId: "PLC_01.TEMP_02", min: 15, max: 70, type: "sine", period: 9e3 },
  { tagId: "PLC_01.CONVEYOR1", min: 0, max: 1, type: "bool", period: 4e3 },
  { tagId: "PLC_01.ALARM_HIGH", min: 0, max: 1, type: "bool", period: 11e3 },
  { tagId: "PLC_01.ALARM_PRESS", min: 0, max: 1, type: "bool", period: 13e3 },
  { tagId: "PLC_01.RPM_01", min: 0, max: 3e3, type: "sine", period: 7e3 },
  { tagId: "PLC_01.FLOW_01", min: 0, max: 500, type: "random", period: 1e3 },
  { tagId: "TANK1.LEVEL", min: 0, max: 100, type: "sine", period: 15e3 }
];
function computeValue(tag, elapsed) {
  const t = elapsed % tag.period / tag.period;
  switch (tag.type) {
    case "sine": {
      const v = (Math.sin(t * 2 * Math.PI) + 1) / 2;
      return Number((tag.min + v * (tag.max - tag.min)).toFixed(2));
    }
    case "sawtooth":
      return Number((tag.min + t * (tag.max - tag.min)).toFixed(2));
    case "step": {
      const states = tag.states ?? [0, 1];
      return states[Math.floor(t * states.length)];
    }
    case "bool":
      return t < 0.5 ? 0 : 1;
    case "random":
      return Number((tag.min + Math.random() * (tag.max - tag.min)).toFixed(2));
  }
}
const TICK_MS = 500;
class MockDataSource {
  constructor() {
    __publicField(this, "subscribers", /* @__PURE__ */ new Map());
    __publicField(this, "timer", null);
    __publicField(this, "startTime", 0);
  }
  connect() {
    this.startTime = Date.now();
    this.timer = setInterval(() => this.tick(), TICK_MS);
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
    const tag = MOCK_TAGS.find((t) => t.tagId === tagId);
    if (tag) cb(computeValue(tag, Date.now() - this.startTime));
  }
  unsubscribe(tagId, cb) {
    const set = this.subscribers.get(tagId);
    set?.delete(cb);
    if (set?.size === 0) this.subscribers.delete(tagId);
  }
  tick() {
    const elapsed = Date.now() - this.startTime;
    for (const [tagId, cbs] of this.subscribers) {
      const tag = MOCK_TAGS.find((t) => t.tagId === tagId);
      if (!tag) continue;
      const value = computeValue(tag, elapsed);
      cbs.forEach((cb) => cb(value));
    }
  }
}
export {
  MockDataSource
};
