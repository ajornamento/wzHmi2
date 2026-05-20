// MES HMI 뷰어 — 메뉴 ID로 스키마 로드 및 커스터마이징 적용
import type { HmiSchema } from '@wzhmi/core';
import { useViewerStore } from '@viewer/store/viewerStore';
import * as customLine1 from '../customizations/production-line-1';
import * as customLine2 from '../customizations/production-line-2';

const store = useViewerStore;
const HMI_API_BASE = 'http://localhost:3001/api/hmi';

interface Customization {
  fetchTagValues?: (tagIds: string[]) => Promise<unknown[]>;
  actions?: Record<string, (widget: unknown) => void>;
  styles?: Record<string, unknown>;
}

const CUSTOM_MAP: Record<string, Customization> = {
  'production-line-1': customLine1 as Customization,
  'production-line-2': customLine2 as Customization,
};

export async function loadScreen(menuId: string): Promise<void> {
  // 스키마 로드
  try {
    const res = await fetch(`${HMI_API_BASE}/${menuId}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const schema: HmiSchema = await res.json();
    store.getState().setSchema(schema);
  } catch (e) {
    console.error(`[MES] 스키마 로드 실패 (${menuId}):`, e);
    return;
  }

  // 커스터마이징 로드
  const custom: Customization = CUSTOM_MAP[menuId] ?? {};

  // 액션 등록
  if (custom.actions) {
    for (const [name, fn] of Object.entries(custom.actions)) {
      (window as unknown as Record<string, unknown>)[name] = fn;
    }
  }

  // 커스텀 폴링 함수 등록
  if (typeof custom.fetchTagValues === 'function') {
    store.getState().setCustomPollFn(custom.fetchTagValues as never);
  } else {
    store.getState().setCustomPollFn(null);
  }
}
