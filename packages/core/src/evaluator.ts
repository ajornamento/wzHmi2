import type { Animation } from './types';

export function evaluateCondition(condition: string, value: number | string | boolean): boolean {
  const trimmed = condition.trim();
  const numVal = Number(value);

  const patterns: Array<[RegExp, (match: string) => boolean]> = [
    [/^==\s*(.+)$/, (m) => {
      const rhs = m.trim();
      return String(value) === rhs || numVal === Number(rhs);
    }],
    [/^!=\s*(.+)$/, (m) => {
      const rhs = m.trim();
      return String(value) !== rhs && numVal !== Number(rhs);
    }],
    [/^>=\s*(.+)$/, (m) => numVal >= Number(m.trim())],
    [/^>\s*(.+)$/, (m) => numVal > Number(m.trim())],
    [/^<=\s*(.+)$/, (m) => numVal <= Number(m.trim())],
    [/^<\s*(.+)$/, (m) => numVal < Number(m.trim())],
    [/^between\s+(\S+)\s+and\s+(\S+)$/i, (m) => {
      const parts = m.split(/\s+and\s+/i);
      return numVal >= Number(parts[0]) && numVal <= Number(parts[1]);
    }],
  ];

  for (const [regex, test] of patterns) {
    const match = trimmed.match(regex);
    if (match) return test(match[1] ?? match[0]);
  }

  return false;
}

export function findMatchingAnimation(
  animations: Animation[],
  value: number | string | boolean
): Animation | null {
  for (const anim of animations) {
    if (evaluateCondition(anim.condition, value)) {
      return anim;
    }
  }
  return null;
}
