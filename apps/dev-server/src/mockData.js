const MOCK_TAGS = [
  { tagId: "PLC_01.MTR_STATUS", description: "\uBA54\uC778 \uBAA8\uD130 \uC0C1\uD0DC", min: 0, max: 2, type: "step", period: 5e3, states: [0, 1, 1, 1, 2] },
  { tagId: "PLC_01.MTR2_STATUS", description: "\uBCF4\uC870 \uBAA8\uD130 \uC0C1\uD0DC", min: 0, max: 2, type: "step", period: 7e3, states: [0, 0, 1, 1] },
  { tagId: "PLC_01.VALVE1", description: "\uBC38\uBE0C1 \uC0C1\uD0DC", min: 0, max: 1, type: "bool", period: 6e3 },
  { tagId: "PLC_01.VALVE2", description: "\uBC38\uBE0C2 \uC0C1\uD0DC", min: 0, max: 100, type: "sawtooth", period: 1e4 },
  { tagId: "PLC_01.TANK_LEVEL", description: "\uD0F1\uD06C \uC218\uC704", min: 0, max: 100, type: "sine", period: 15e3 },
  { tagId: "PLC_01.PRESSURE", description: "\uC2DC\uC2A4\uD15C \uC555\uB825", min: 0, max: 10, type: "sine", period: 8e3 },
  { tagId: "PLC_01.TEMP_01", description: "\uC628\uB3C4 \uC13C\uC11C 1", min: 20, max: 80, type: "sine", period: 12e3 },
  { tagId: "PLC_01.TEMP_02", description: "\uC628\uB3C4 \uC13C\uC11C 2", min: 15, max: 70, type: "sine", period: 9e3 },
  { tagId: "PLC_01.CONVEYOR1", description: "\uCEE8\uBCA0\uC774\uC5B41 \uC0C1\uD0DC", min: 0, max: 1, type: "bool", period: 4e3 },
  { tagId: "PLC_01.ALARM_HIGH", description: "\uACE0\uC628 \uC54C\uB78C", min: 0, max: 1, type: "bool", period: 11e3 },
  { tagId: "PLC_01.ALARM_PRESS", description: "\uC555\uB825 \uC54C\uB78C", min: 0, max: 1, type: "bool", period: 13e3 },
  { tagId: "PLC_01.RPM_01", description: "\uBAA8\uD130 RPM", min: 0, max: 3e3, type: "sine", period: 7e3 },
  { tagId: "PLC_01.FLOW_01", description: "\uC720\uB7C9\uACC4 1", min: 0, max: 500, type: "random", period: 1e3 },
  { tagId: "TANK1.LEVEL", description: "TANK1 \uC218\uC704", min: 0, max: 100, type: "sine", period: 15e3 }
];
function computeValue(tag, elapsed) {
  const t = elapsed % tag.period / tag.period;
  switch (tag.type) {
    case "sine": {
      const v = (Math.sin(t * 2 * Math.PI) + 1) / 2;
      return Number((tag.min + v * (tag.max - tag.min)).toFixed(2));
    }
    case "sawtooth": {
      return Number((tag.min + t * (tag.max - tag.min)).toFixed(2));
    }
    case "step": {
      const states = tag.states ?? [0, 1];
      return states[Math.floor(t * states.length)];
    }
    case "bool": {
      return t < 0.5 ? 0 : 1;
    }
    case "random": {
      return Number((tag.min + Math.random() * (tag.max - tag.min)).toFixed(2));
    }
  }
}
export {
  MOCK_TAGS,
  computeValue
};
