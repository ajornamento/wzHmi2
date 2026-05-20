// 브라우저 내 타이머 기반 가상 태그 값을 생성하는 Mock 데이터소스
import type { IDataSource, TagCallback } from './DataBindingEngine';

interface MockTagDef {
  tagId: string;
  min: number;
  max: number;
  type: 'sine' | 'step' | 'random' | 'bool' | 'sawtooth';
  period: number;
  states?: number[];
}

const MOCK_TAGS: MockTagDef[] = [
  { tagId: 'PLC_01.MTR_STATUS',  min: 0, max: 2,    type: 'step',     period: 5000,  states: [0, 1, 1, 1, 2] },
  { tagId: 'PLC_01.MTR2_STATUS', min: 0, max: 2,    type: 'step',     period: 7000,  states: [0, 0, 1, 1] },
  { tagId: 'PLC_01.VALVE1',      min: 0, max: 1,    type: 'bool',     period: 6000 },
  { tagId: 'PLC_01.VALVE2',      min: 0, max: 100,  type: 'sawtooth', period: 10000 },
  { tagId: 'PLC_01.TANK_LEVEL',  min: 0, max: 100,  type: 'sine',     period: 15000 },
  { tagId: 'PLC_01.PRESSURE',    min: 0, max: 10,   type: 'sine',     period: 8000 },
  { tagId: 'PLC_01.TEMP_01',     min: 20, max: 80,  type: 'sine',     period: 12000 },
  { tagId: 'PLC_01.TEMP_02',     min: 15, max: 70,  type: 'sine',     period: 9000 },
  { tagId: 'PLC_01.CONVEYOR1',   min: 0, max: 1,    type: 'bool',     period: 4000 },
  { tagId: 'PLC_01.ALARM_HIGH',  min: 0, max: 1,    type: 'bool',     period: 11000 },
  { tagId: 'PLC_01.ALARM_PRESS', min: 0, max: 1,    type: 'bool',     period: 13000 },
  { tagId: 'PLC_01.RPM_01',      min: 0, max: 3000, type: 'sine',     period: 7000 },
  { tagId: 'PLC_01.FLOW_01',     min: 0, max: 500,  type: 'random',   period: 1000 },
  { tagId: 'TANK1.LEVEL',        min: 0, max: 100,  type: 'sine',     period: 15000 },
];

function computeValue(tag: MockTagDef, elapsed: number): number {
  const t = (elapsed % tag.period) / tag.period;
  switch (tag.type) {
    case 'sine': {
      const v = (Math.sin(t * 2 * Math.PI) + 1) / 2;
      return Number((tag.min + v * (tag.max - tag.min)).toFixed(2));
    }
    case 'sawtooth':
      return Number((tag.min + t * (tag.max - tag.min)).toFixed(2));
    case 'step': {
      const states = tag.states ?? [0, 1];
      return states[Math.floor(t * states.length)];
    }
    case 'bool':
      return t < 0.5 ? 0 : 1;
    case 'random':
      return Number((tag.min + Math.random() * (tag.max - tag.min)).toFixed(2));
  }
}

const TICK_MS = 500;

export class MockDataSource implements IDataSource {
  private subscribers = new Map<string, Set<TagCallback>>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

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

  subscribe(tagId: string, cb: TagCallback) {
    if (!this.subscribers.has(tagId)) this.subscribers.set(tagId, new Set());
    this.subscribers.get(tagId)!.add(cb);
    const tag = MOCK_TAGS.find((t) => t.tagId === tagId);
    if (tag) cb(computeValue(tag, Date.now() - this.startTime));
  }

  unsubscribe(tagId: string, cb: TagCallback) {
    const set = this.subscribers.get(tagId);
    set?.delete(cb);
    if (set?.size === 0) this.subscribers.delete(tagId);
  }

  private tick() {
    const elapsed = Date.now() - this.startTime;
    for (const [tagId, cbs] of this.subscribers) {
      const tag = MOCK_TAGS.find((t) => t.tagId === tagId);
      if (!tag) continue;
      const value = computeValue(tag, elapsed);
      cbs.forEach((cb) => cb(value));
    }
  }
}
