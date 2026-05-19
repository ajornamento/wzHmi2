import { create } from 'zustand';
import type { HmiSchema, UserRole } from '@wzhmi/core';
import { emptySchema } from '@wzhmi/core';
import type { PollFetchFn } from '../engine/PollingDataSource';

export type DataSourceMode = 'websocket' | 'polling' | 'mqtt';
export type { PollFetchFn };

interface ViewerState {
  schema: HmiSchema;
  serverUrl: string;
  scale: number;
  currentUser: { id: string; role: UserRole };
  dataSourceMode: DataSourceMode;
  pollInterval: number;
  customPollFn: PollFetchFn | null;
  mqttBrokerUrl: string;
  setSchema: (schema: HmiSchema) => void;
  setServerUrl: (url: string) => void;
  setScale: (scale: number) => void;
  setCurrentUser: (user: { id: string; role: UserRole }) => void;
  setDataSourceMode: (mode: DataSourceMode) => void;
  setPollInterval: (ms: number) => void;
  setCustomPollFn: (fn: PollFetchFn | null) => void;
  setMqttBrokerUrl: (url: string) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  schema: emptySchema(),
  serverUrl: 'ws://localhost:3001',
  scale: 1,
  currentUser: { id: 'user1', role: 'VIEWER' },
  dataSourceMode: 'websocket',
  pollInterval: 2000,
  customPollFn: null,
  mqttBrokerUrl: 'ws://localhost:9001',
  setSchema: (schema) => set({
    schema: {
      ...schema,
      widgets: schema.widgets.map((w) => ({
        ...w,
        styles: { ...w.styles, animations: w.styles.animations ?? [] },
      })),
    },
  }),
  setServerUrl: (serverUrl) => set({ serverUrl }),
  setScale: (scale) => set({ scale }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setDataSourceMode: (dataSourceMode) => set({ dataSourceMode }),
  setPollInterval: (pollInterval) => set({ pollInterval }),
  setCustomPollFn: (customPollFn) => set({ customPollFn }),
  setMqttBrokerUrl: (mqttBrokerUrl) => set({ mqttBrokerUrl }),
}));
