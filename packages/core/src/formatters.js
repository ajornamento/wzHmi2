const registry = {
    motorStatus: (v) => {
        const n = Number(v);
        if (n === 0)
            return '정지';
        if (n === 1)
            return '가동';
        if (n === 2)
            return '오류';
        return String(v);
    },
    valveState: (v) => {
        const n = Number(v);
        if (n === 0)
            return '닫힘';
        if (n === 1)
            return '열림';
        return `${n}%`;
    },
    onOff: (v) => (v ? 'ON' : 'OFF'),
    yesNo: (v) => (v ? 'Yes' : 'No'),
    percent: (v) => `${Number(v).toFixed(1)}%`,
    temperature: (v) => `${Number(v).toFixed(1)}°C`,
    pressure: (v) => `${Number(v).toFixed(2)} bar`,
    rpm: (v) => `${Number(v)} RPM`,
};
export function format(formatterName, value) {
    if (!formatterName)
        return String(value);
    const fn = registry[formatterName];
    if (fn)
        return fn(value);
    // 직접 포맷 문자열: JS 템플릿 리터럴로 평가 (`value` 변수 사용)
    try {
        // eslint-disable-next-line no-new-func
        return new Function('value', `return \`${formatterName}\``)(value);
    }
    catch {
        return String(value);
    }
}
export function registerFormatter(name, fn) {
    registry[name] = fn;
}
