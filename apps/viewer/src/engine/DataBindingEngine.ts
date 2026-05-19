import type { TagValue, TagUpdate } from '@wzhmi/core';

export type TagCallback = (value: number | string | boolean) => void;

export interface IDataSource {
  connect(): void;
  disconnect(): void;
  subscribe(tagId: string, cb: TagCallback): void;
  unsubscribe(tagId: string, cb: TagCallback): void;
}

export class DataBindingEngine implements IDataSource {
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<TagCallback>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        for (const tagId of this.subscribers.keys()) {
          this.ws!.send(JSON.stringify({ type: 'subscribe', tagId }));
        }
      };
      this.ws.onmessage = (e) => this.handleMessage(e.data);
      this.ws.onclose = () => this.scheduleReconnect();
      this.ws.onerror = () => this.ws?.close();
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  subscribe(tagId: string, cb: TagCallback) {
    if (!this.subscribers.has(tagId)) {
      this.subscribers.set(tagId, new Set());
    }
    this.subscribers.get(tagId)!.add(cb);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', tagId }));
    }
  }

  unsubscribe(tagId: string, cb: TagCallback) {
    this.subscribers.get(tagId)?.delete(cb);
  }

  private handleMessage(raw: string) {
    try {
      const msg: TagUpdate = JSON.parse(raw);
      if (msg.type === 'tag_update') {
        this.dispatch(msg.data);
      }
    } catch {}
  }

  private dispatch(tag: TagValue) {
    const cbs = this.subscribers.get(tag.tagId);
    if (cbs) {
      cbs.forEach((cb) => cb(tag.value));
    }
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }
}
