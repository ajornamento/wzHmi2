// 생산 라인 1 커스터마이징 — 전용 DB 폴링 함수 포함
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
  Tank1Click: (widget: any) => {
    const engine = (window as any).__hmiEngine;

    document.getElementById('__tank1-popup')?.remove();

    const popup = document.createElement('div');
    popup.id = '__tank1-popup';
    Object.assign(popup.style, {
      position: 'fixed',
      background: '#2a2a3a', border: '1px solid #555', borderRadius: '8px',
      padding: '24px 32px', zIndex: '9999', minWidth: '220px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', color: '#fff',
      fontFamily: 'sans-serif', textAlign: 'center',
    });

    const widgetEl = document.querySelector(`[data-widget-id="${widget.id}"]`);
    if (widgetEl) {
      const rect = widgetEl.getBoundingClientRect();
      popup.style.top = `${rect.top + rect.height / 2}px`;
      popup.style.left = `${rect.right + 8}px`;
      popup.style.transform = 'translateY(-50%)';
    } else {
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
    }

    const title = document.createElement('div');
    title.textContent = widget.properties?.label ?? widget.name;
    Object.assign(title.style, { fontSize: '14px', color: '#aaa', marginBottom: '12px' });

    const levelEl = document.createElement('div');
    levelEl.textContent = '탱크레벨: -';
    Object.assign(levelEl.style, { fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '닫기';
    Object.assign(closeBtn.style, {
      padding: '6px 20px', background: '#555', border: 'none',
      borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '13px',
    });

    const onValue = (value: any) => { levelEl.textContent = `탱크레벨: ${value}`; };

    closeBtn.onclick = () => {
      popup.remove();
      engine?.unsubscribe(widget.binding?.tagId, onValue);
    };

    popup.appendChild(title);
    popup.appendChild(levelEl);
    popup.appendChild(closeBtn);
    document.body.appendChild(popup);

    if (engine && widget.binding?.tagId) {
      engine.subscribe(widget.binding.tagId, onValue);
    }
  },
};

export const styles = {
  theme: 'light',
};
