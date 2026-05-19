// HTTP 폴링 방식으로 태그 값을 주기적으로 배치 조회하는 데이터소스
import type { TagValue } from '@wzhmi/core';
import type { IDataSource, TagCallback } from './DataBindingEngine';

export type PollFetchFn = (tagIds: string[]) => Promise<TagValue[]>;

export class PollingDataSource implements IDataSource {
  private httpUrl: string;
  private intervalMs: number;
  private fetchFn: PollFetchFn;
  private subscribers = new Map<string, Set<TagCallback>>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(serverUrl: string, intervalMs = 2000, fetchFn?: PollFetchFn) {
    this.httpUrl = serverUrl
      .replace(/^ws:\/\//, 'http://')
      .replace(/^wss:\/\//, 'https://');
    this.intervalMs = intervalMs;
    this.fetchFn = fetchFn ?? this.defaultFetch.bind(this);
  }

  connect() {
    this.poll();
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }

  disconnect() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  subscribe(tagId: string, cb: TagCallback) {
    if (!this.subscribers.has(tagId)) this.subscribers.set(tagId, new Set());
    this.subscribers.get(tagId)!.add(cb);
    this.pollBatch([tagId]);
  }

  unsubscribe(tagId: string, cb: TagCallback) {
    const set = this.subscribers.get(tagId);
    set?.delete(cb);
    if (set?.size === 0) this.subscribers.delete(tagId);
  }

  private async defaultFetch(tagIds: string[]): Promise<TagValue[]> {
    const res = await fetch(`${this.httpUrl}/api/tags/values`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagIds }),
    });
    if (!res.ok) return [];
    return res.json();
  }

  private async poll() {
    const tagIds = Array.from(this.subscribers.keys());
    if (tagIds.length === 0) return;
    await this.pollBatch(tagIds);
  }

  private async pollBatch(tagIds: string[]) {
    try {
      const values = await this.fetchFn(tagIds);
      for (const tv of values) {
        this.subscribers.get(tv.tagId)?.forEach((cb) => cb(tv.value));
      }
    } catch {}
  }
}
