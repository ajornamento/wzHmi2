export interface TagDef {
  tagId: string;
  description: string;
  min: number;
  max: number;
  type: 'sine' | 'step' | 'random' | 'bool' | 'sawtooth';
  period: number;
  states?: number[];
}

export const MOCK_TAGS: TagDef[] = [
  { tagId: 'PLC_01.MTR_STATUS', description: '메인 모터 상태', min: 0, max: 2, type: 'step', period: 5000, states: [0, 1, 1, 1, 2] },
  { tagId: 'PLC_01.MTR2_STATUS', description: '보조 모터 상태', min: 0, max: 2, type: 'step', period: 7000, states: [0, 0, 1, 1] },
  { tagId: 'PLC_01.VALVE1', description: '밸브1 상태', min: 0, max: 1, type: 'bool', period: 6000 },
  { tagId: 'PLC_01.VALVE2', description: '밸브2 상태', min: 0, max: 100, type: 'sawtooth', period: 10000 },
  { tagId: 'PLC_01.TANK_LEVEL', description: '탱크 수위', min: 0, max: 100, type: 'sine', period: 15000 },
  { tagId: 'PLC_01.PRESSURE', description: '시스템 압력', min: 0, max: 10, type: 'sine', period: 8000 },
  { tagId: 'PLC_01.TEMP_01', description: '온도 센서 1', min: 20, max: 80, type: 'sine', period: 12000 },
  { tagId: 'PLC_01.TEMP_02', description: '온도 센서 2', min: 15, max: 70, type: 'sine', period: 9000 },
  { tagId: 'PLC_01.CONVEYOR1', description: '컨베이어1 상태', min: 0, max: 1, type: 'bool', period: 4000 },
  { tagId: 'PLC_01.ALARM_HIGH', description: '고온 알람', min: 0, max: 1, type: 'bool', period: 11000 },
  { tagId: 'PLC_01.ALARM_PRESS', description: '압력 알람', min: 0, max: 1, type: 'bool', period: 13000 },
  { tagId: 'PLC_01.RPM_01', description: '모터 RPM', min: 0, max: 3000, type: 'sine', period: 7000 },
  { tagId: 'PLC_01.FLOW_01', description: '유량계 1', min: 0, max: 500, type: 'random', period: 1000 },
  { tagId: 'TANK1.LEVEL', description: 'TANK1 수위', min: 0, max: 100, type: 'sine', period: 15000 },
];

export function computeValue(tag: TagDef, elapsed: number): number {
  const t = (elapsed % tag.period) / tag.period;
  switch (tag.type) {
    case 'sine': {
      const v = (Math.sin(t * 2 * Math.PI) + 1) / 2;
      return Number((tag.min + v * (tag.max - tag.min)).toFixed(2));
    }
    case 'sawtooth': {
      return Number((tag.min + t * (tag.max - tag.min)).toFixed(2));
    }
    case 'step': {
      const states = tag.states ?? [0, 1];
      return states[Math.floor(t * states.length)];
    }
    case 'bool': {
      return t < 0.5 ? 0 : 1;
    }
    case 'random': {
      return Number((tag.min + Math.random() * (tag.max - tag.min)).toFixed(2));
    }
  }
}
