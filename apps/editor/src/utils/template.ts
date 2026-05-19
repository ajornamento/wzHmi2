// x-template 렌더러 — <script type="text/x-template" id="tmpl-xxx"> 블록을 읽어 치환

export function render(templateId: string, data: Record<string, unknown>): string {
  const el = document.getElementById(templateId);
  if (!el) throw new Error(`Template not found: #${templateId}`);
  return el.innerHTML.replace(/\$\{([^}]+)\}/g, (_, expr: string) => {
    const val = expr.trim().split('.').reduce(
      (obj: unknown, k: string) => (obj as Record<string, unknown>)?.[k],
      data as unknown
    );
    return val !== undefined && val !== null ? String(val) : '';
  });
}
