// MQTT 브로커에서 태그 값을 구독하는 데이터소스 (WebSocket 전송)
import mqtt from 'mqtt';
import type { IDataSource, TagCallback } from './DataBindingEngine';

const TOPIC_PREFIX = 'hmi/tags/';

export class MqttDataSource implements IDataSource {
  private client: mqtt.MqttClient | null = null;
  private subscribers = new Map<string, Set<TagCallback>>();
  private brokerUrl: string;

  constructor(brokerUrl: string) {
    this.brokerUrl = brokerUrl;
  }

  connect() {
    this.client = mqtt.connect(this.brokerUrl);

    this.client.on('connect', () => {
      for (const tagId of this.subscribers.keys()) {
        this.client!.subscribe(`${TOPIC_PREFIX}${tagId}`);
      }
    });

    this.client.on('message', (topic, payload) => {
      const tagId = topic.slice(TOPIC_PREFIX.length);
      try {
        const value = JSON.parse(payload.toString());
        this.subscribers.get(tagId)?.forEach((cb) => cb(value));
      } catch {}
    });

    this.client.on('error', () => this.client?.end());
  }

  disconnect() {
    this.client?.end();
    this.client = null;
  }

  subscribe(tagId: string, cb: TagCallback) {
    if (!this.subscribers.has(tagId)) this.subscribers.set(tagId, new Set());
    this.subscribers.get(tagId)!.add(cb);
    if (this.client?.connected) {
      this.client.subscribe(`${TOPIC_PREFIX}${tagId}`);
    }
  }

  unsubscribe(tagId: string, cb: TagCallback) {
    const set = this.subscribers.get(tagId);
    set?.delete(cb);
    if (set?.size === 0) {
      this.subscribers.delete(tagId);
      if (this.client?.connected) {
        this.client.unsubscribe(`${TOPIC_PREFIX}${tagId}`);
      }
    }
  }
}
