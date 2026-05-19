import { create } from 'zustand';
import type { HmiSchema, Widget, WidgetType, LineConnection } from '@wzhmi/core';
import { emptySchema, defaultWidget, LINE_PAD } from '@wzhmi/core';

type HistoryEntry = HmiSchema;

interface EditorState {
  schema: HmiSchema;
  selectedId: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  fileName: string;
  canvasScale: number;

  setCanvas: (canvas: Partial<HmiSchema['canvas']>) => void;
  setCanvasScale: (scale: number) => void;
  addWidget: (type: WidgetType, customProperties?: Partial<Widget['properties']>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, patch: Partial<Widget>) => void;
  selectWidget: (id: string | null) => void;
  moveWidget: (id: string, x: number, y: number) => void;
  moveLineEndpoint: (id: string, endpoint: 'start' | 'end', x: number, y: number) => void;
  finalizeLineEndpoint: (id: string, endpoint: 'start' | 'end', x: number, y: number, connection: LineConnection | null) => void;
  addLineWaypoint: (id: string, segmentIndex: number, x: number, y: number) => void;
  removeLineWaypoint: (id: string, index: number) => void;
  moveLineWaypoint: (id: string, index: number, x: number, y: number) => void;
  resizeWidget: (id: string, width: number, height: number) => void;
  loadSchema: (schema: HmiSchema, name?: string) => void;
  setFileName: (name: string) => void;
  undo: () => void;
  redo: () => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  duplicateWidget: (id: string) => void;
}

let idCounter = 1;
function genId() {
  return `W${String(idCounter++).padStart(3, '0')}`;
}

function pushHistory(state: EditorState, newSchema: HmiSchema): Partial<EditorState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newSchema);
  if (newHistory.length > 50) newHistory.shift();
  return {
    schema: newSchema,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  schema: emptySchema(),
  selectedId: null,
  history: [emptySchema()],
  historyIndex: 0,
  fileName: 'untitled.json',
  canvasScale: 1,

  setCanvasScale: (scale) => set({ canvasScale: scale }),

  setCanvas: (canvas) => set((s) => {
    const newSchema = { ...s.schema, canvas: { ...s.schema.canvas, ...canvas } };
    return pushHistory(s, newSchema);
  }),

  addWidget: (type, customProperties) => set((s) => {
    const id = genId();
    const widget = defaultWidget(type, id);
    if (customProperties) {
      widget.properties = { ...widget.properties, ...customProperties };
    }
    const snapTo10 = (v: number) => Math.round(v / 10) * 10;
    const newX = snapTo10(100 + Math.random() * 200);
    const newY = snapTo10(100 + Math.random() * 200);
    if (type === 'LINE') {
      const dx = newX - widget.geometry.x;
      const dy = newY - widget.geometry.y;
      widget.geometry.x = newX;
      widget.geometry.y = newY;
      widget.properties.x1 = Number(widget.properties.x1) + dx;
      widget.properties.y1 = Number(widget.properties.y1) + dy;
      widget.properties.x2 = Number(widget.properties.x2) + dx;
      widget.properties.y2 = Number(widget.properties.y2) + dy;
    } else {
      widget.geometry.x = newX;
      widget.geometry.y = newY;
    }
    widget.geometry.zIndex = s.schema.widgets.length + 1;
    const newSchema = { ...s.schema, widgets: [...s.schema.widgets, widget] };
    return { ...pushHistory(s, newSchema), selectedId: id };
  }),

  removeWidget: (id) => set((s) => {
    const newWidgets = s.schema.widgets
      .filter((w) => w.id !== id)
      .map((w) => {
        if (w.type !== 'LINE') return w;
        const sc = w.properties.startConnection as LineConnection | undefined;
        const ec = w.properties.endConnection as LineConnection | undefined;
        if (sc?.widgetId !== id && ec?.widgetId !== id) return w;
        return {
          ...w,
          properties: {
            ...w.properties,
            ...(sc?.widgetId === id ? { startConnection: undefined } : {}),
            ...(ec?.widgetId === id ? { endConnection: undefined } : {}),
          },
        };
      });
    return { ...pushHistory(s, { ...s.schema, widgets: newWidgets }), selectedId: null };
  }),

  updateWidget: (id, patch) => set((s) => {
    const newWidgets = s.schema.widgets.map((w) =>
      w.id === id ? mergeWidget(w, patch) : w
    );
    const newSchema = { ...s.schema, widgets: newWidgets };
    return pushHistory(s, newSchema);
  }),

  selectWidget: (id) => set({ selectedId: id }),

  moveWidget: (id, x, y) => set((s) => {
    const target = s.schema.widgets.find((w) => w.id === id);
    if (!target) return {};
    const nx = Math.round(x), ny = Math.round(y);
    const movedTarget = { ...target, geometry: { ...target.geometry, x: nx, y: ny } };
    const newWidgets = s.schema.widgets.map((w) => {
      if (w.id === id) {
        if (w.type === 'LINE') {
          const dx = nx - w.geometry.x;
          const dy = ny - w.geometry.y;
          const wps = ((w.properties.waypoints as Waypoint[] | undefined) ?? []).map(wp => ({ x: wp.x + dx, y: wp.y + dy }));
          return {
            ...w,
            geometry: { ...w.geometry, x: nx, y: ny },
            properties: {
              ...w.properties,
              x1: Number(w.properties.x1 ?? 0) + dx,
              y1: Number(w.properties.y1 ?? 0) + dy,
              x2: Number(w.properties.x2 ?? 0) + dx,
              y2: Number(w.properties.y2 ?? 0) + dy,
              waypoints: wps,
            },
          };
        }
        return { ...w, geometry: { ...w.geometry, x: nx, y: ny } };
      }
      if (w.type !== 'LINE') return w;
      const sc = w.properties.startConnection as LineConnection | undefined;
      const ec = w.properties.endConnection as LineConnection | undefined;
      if (sc?.widgetId !== id && ec?.widgetId !== id) return w;
      let x1 = Number(w.properties.x1 ?? 0), y1 = Number(w.properties.y1 ?? 0);
      let x2 = Number(w.properties.x2 ?? 0), y2 = Number(w.properties.y2 ?? 0);
      if (sc?.widgetId === id) { const pt = getConnectionPoint(movedTarget, sc.point); x1 = pt.x; y1 = pt.y; }
      if (ec?.widgetId === id) { const pt = getConnectionPoint(movedTarget, ec.point); x2 = pt.x; y2 = pt.y; }
      const wps = (w.properties.waypoints as Waypoint[] | undefined) ?? [];
      return {
        ...w,
        geometry: { ...w.geometry, ...recalcLineGeometry(x1, y1, x2, y2, wps) },
        properties: { ...w.properties, x1, y1, x2, y2 },
      };
    });
    return { schema: { ...s.schema, widgets: newWidgets } };
  }),

  moveLineEndpoint: (id, endpoint, x, y) => set((s) => {
    const newWidgets = s.schema.widgets.map((w) => {
      if (w.id !== id || w.type !== 'LINE') return w;
      const nx = Math.round(x), ny = Math.round(y);
      const x1 = endpoint === 'start' ? nx : Number(w.properties.x1 ?? 0);
      const y1 = endpoint === 'start' ? ny : Number(w.properties.y1 ?? 0);
      const x2 = endpoint === 'end'   ? nx : Number(w.properties.x2 ?? 0);
      const y2 = endpoint === 'end'   ? ny : Number(w.properties.y2 ?? 0);
      const waypoints = (w.properties.waypoints as Waypoint[] | undefined) ?? [];
      return {
        ...w,
        geometry: { ...w.geometry, ...recalcLineGeometry(x1, y1, x2, y2, waypoints) },
        properties: { ...w.properties, x1, y1, x2, y2 },
      };
    });
    return pushHistory(s, { ...s.schema, widgets: newWidgets });
  }),

  finalizeLineEndpoint: (id, endpoint, x, y, connection) => set((s) => {
    const newWidgets = s.schema.widgets.map((w) => {
      if (w.id !== id || w.type !== 'LINE') return w;
      const nx = Math.round(x), ny = Math.round(y);
      const x1 = endpoint === 'start' ? nx : Number(w.properties.x1 ?? 0);
      const y1 = endpoint === 'start' ? ny : Number(w.properties.y1 ?? 0);
      const x2 = endpoint === 'end'   ? nx : Number(w.properties.x2 ?? 0);
      const y2 = endpoint === 'end'   ? ny : Number(w.properties.y2 ?? 0);
      const waypoints = (w.properties.waypoints as Waypoint[] | undefined) ?? [];
      return {
        ...w,
        geometry: { ...w.geometry, ...recalcLineGeometry(x1, y1, x2, y2, waypoints) },
        properties: {
          ...w.properties, x1, y1, x2, y2,
          ...(endpoint === 'start'
            ? { startConnection: connection ?? undefined }
            : { endConnection: connection ?? undefined }),
        },
      };
    });
    return pushHistory(s, { ...s.schema, widgets: newWidgets });
  }),

  addLineWaypoint: (id, segmentIndex, x, y) => set((s) => {
    const newWidgets = s.schema.widgets.map((w) => {
      if (w.id !== id || w.type !== 'LINE') return w;
      const x1 = Number(w.properties.x1 ?? 0), y1 = Number(w.properties.y1 ?? 0);
      const x2 = Number(w.properties.x2 ?? 0), y2 = Number(w.properties.y2 ?? 0);
      const wps = [...((w.properties.waypoints as Waypoint[] | undefined) ?? [])];
      wps.splice(segmentIndex, 0, { x: Math.round(x), y: Math.round(y) });
      return {
        ...w,
        geometry: { ...w.geometry, ...recalcLineGeometry(x1, y1, x2, y2, wps) },
        properties: { ...w.properties, waypoints: wps },
      };
    });
    return pushHistory(s, { ...s.schema, widgets: newWidgets });
  }),

  removeLineWaypoint: (id, index) => set((s) => {
    const newWidgets = s.schema.widgets.map((w) => {
      if (w.id !== id || w.type !== 'LINE') return w;
      const x1 = Number(w.properties.x1 ?? 0), y1 = Number(w.properties.y1 ?? 0);
      const x2 = Number(w.properties.x2 ?? 0), y2 = Number(w.properties.y2 ?? 0);
      const wps = ((w.properties.waypoints as Waypoint[] | undefined) ?? []).filter((_, i) => i !== index);
      return {
        ...w,
        geometry: { ...w.geometry, ...recalcLineGeometry(x1, y1, x2, y2, wps) },
        properties: { ...w.properties, waypoints: wps },
      };
    });
    return pushHistory(s, { ...s.schema, widgets: newWidgets });
  }),

  moveLineWaypoint: (id, index, x, y) => set((s) => {
    const newWidgets = s.schema.widgets.map((w) => {
      if (w.id !== id || w.type !== 'LINE') return w;
      const x1 = Number(w.properties.x1 ?? 0), y1 = Number(w.properties.y1 ?? 0);
      const x2 = Number(w.properties.x2 ?? 0), y2 = Number(w.properties.y2 ?? 0);
      const wps = ((w.properties.waypoints as Waypoint[] | undefined) ?? []).map((wp, i) =>
        i === index ? { x: Math.round(x), y: Math.round(y) } : wp
      );
      return {
        ...w,
        geometry: { ...w.geometry, ...recalcLineGeometry(x1, y1, x2, y2, wps) },
        properties: { ...w.properties, waypoints: wps },
      };
    });
    return { schema: { ...s.schema, widgets: newWidgets } };
  }),

  resizeWidget: (id, width, height) => set((s) => {
    const newWidgets = s.schema.widgets.map((w) =>
      w.id === id ? { ...w, geometry: { ...w.geometry, width: Math.max(20, Math.round(width)), height: Math.max(20, Math.round(height)) } } : w
    );
    return { schema: { ...s.schema, widgets: newWidgets } };
  }),

  loadSchema: (schema, name) => {
    const normalized: typeof schema = {
      ...schema,
      widgets: schema.widgets.map((w) => ({
        ...w,
        styles: { ...w.styles, animations: w.styles.animations ?? [] },
        properties: { ...w.properties },
      })),
    };
    set({
      schema: normalized,
      selectedId: null,
      history: [normalized],
      historyIndex: 0,
      fileName: name ?? 'untitled.json',
    });
  },

  setFileName: (name) => set({ fileName: name }),

  undo: () => set((s) => {
    if (s.historyIndex <= 0) return {};
    const idx = s.historyIndex - 1;
    return { schema: s.history[idx], historyIndex: idx, selectedId: null };
  }),

  redo: () => set((s) => {
    if (s.historyIndex >= s.history.length - 1) return {};
    const idx = s.historyIndex + 1;
    return { schema: s.history[idx], historyIndex: idx };
  }),

  bringForward: (id) => set((s) => {
    const w = s.schema.widgets.find((w) => w.id === id);
    if (!w) return {};
    const newWidgets = s.schema.widgets.map((ww) =>
      ww.id === id ? { ...ww, geometry: { ...ww.geometry, zIndex: ww.geometry.zIndex + 1 } } : ww
    );
    return pushHistory(s, { ...s.schema, widgets: newWidgets });
  }),

  sendBackward: (id) => set((s) => {
    const w = s.schema.widgets.find((w) => w.id === id);
    if (!w) return {};
    const newWidgets = s.schema.widgets.map((ww) =>
      ww.id === id ? { ...ww, geometry: { ...ww.geometry, zIndex: Math.max(1, ww.geometry.zIndex - 1) } } : ww
    );
    return pushHistory(s, { ...s.schema, widgets: newWidgets });
  }),

  duplicateWidget: (id) => set((s) => {
    const w = s.schema.widgets.find((w) => w.id === id);
    if (!w) return {};
    const newId = genId();
    const OFFSET = 20;
    const properties = w.type === 'LINE' ? {
      ...w.properties,
      x1: Number(w.properties.x1 ?? 0) + OFFSET,
      y1: Number(w.properties.y1 ?? 0) + OFFSET,
      x2: Number(w.properties.x2 ?? 0) + OFFSET,
      y2: Number(w.properties.y2 ?? 0) + OFFSET,
      waypoints: ((w.properties.waypoints as Waypoint[] | undefined) ?? []).map(wp => ({ x: wp.x + OFFSET, y: wp.y + OFFSET })),
    } : w.properties;
    const copy = {
      ...w,
      id: newId,
      name: `${w.name}_copy`,
      geometry: { ...w.geometry, x: w.geometry.x + OFFSET, y: w.geometry.y + OFFSET },
      properties,
    };
    const newSchema = { ...s.schema, widgets: [...s.schema.widgets, copy] };
    return { ...pushHistory(s, newSchema), selectedId: newId };
  }),
}));

type Waypoint = { x: number; y: number };

function getConnectionPoint(w: Widget, point: string): { x: number; y: number } {
  const { x, y, width, height } = w.geometry;
  if (point === 'top')    return { x: x + width / 2, y };
  if (point === 'bottom') return { x: x + width / 2, y: y + height };
  if (point === 'left')   return { x, y: y + height / 2 };
  return { x: x + width, y: y + height / 2 };
}

function recalcLineGeometry(x1: number, y1: number, x2: number, y2: number, waypoints: Waypoint[]) {
  const allX = [x1, x2, ...waypoints.map(wp => wp.x)];
  const allY = [y1, y2, ...waypoints.map(wp => wp.y)];
  const minX = Math.min(...allX), minY = Math.min(...allY);
  const maxX = Math.max(...allX), maxY = Math.max(...allY);
  return {
    x: minX - LINE_PAD,
    y: minY - LINE_PAD,
    width:  Math.max(maxX - minX + LINE_PAD * 2, 20),
    height: Math.max(maxY - minY + LINE_PAD * 2, 20),
  };
}

function mergeWidget(w: Widget, patch: Partial<Widget>): Widget {
  return {
    ...w,
    ...patch,
    geometry: patch.geometry ? { ...w.geometry, ...patch.geometry } : w.geometry,
    binding: patch.binding ? { ...w.binding, ...patch.binding } : w.binding,
    styles: patch.styles ? { ...w.styles, ...patch.styles } : w.styles,
    actions: patch.actions ? { ...w.actions, ...patch.actions } : w.actions,
    properties: patch.properties ? { ...w.properties, ...patch.properties } : w.properties,
  };
}
