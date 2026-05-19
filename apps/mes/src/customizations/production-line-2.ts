// 생산 라인 2 커스터마이징 — 전용 DB 폴링 함수 포함
import type { TagValue } from '@wzhmi/core';

export async function fetchTagValues(tagIds: string[]): Promise<TagValue[]> {
  const res = await fetch('http://localhost:3001/api/tags/values', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagIds }),
  });
  if (!res.ok) return [];
  return res.json();
}

export const actions = {
  myCustomClickAction: (widget: any) => {
    console.log('생산 라인 2: 위젯 클릭됨', widget);
    alert('생산 라인 2 전용 액션 실행');
  },
};

export const styles = {
  theme: 'dark',
};
