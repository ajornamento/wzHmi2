import { create } from "zustand";
import { emptySchema } from "@wzhmi/core";
const useViewerStore = create((set) => ({
  schema: emptySchema(),
  serverUrl: "ws://localhost:3001",
  scale: 1,
  currentUser: { id: "user1", role: "VIEWER" },
  dataSourceMode: "mock",
  pollInterval: 2e3,
  customPollFn: null,
  mqttBrokerUrl: "ws://localhost:9001",
  setSchema: (schema) => set({
    schema: {
      ...schema,
      widgets: schema.widgets.map((w) => ({
        ...w,
        styles: { ...w.styles, animations: w.styles.animations ?? [] }
      }))
    }
  }),
  setServerUrl: (serverUrl) => set({ serverUrl }),
  setScale: (scale) => set({ scale }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setDataSourceMode: (dataSourceMode) => set({ dataSourceMode }),
  setPollInterval: (pollInterval) => set({ pollInterval }),
  setCustomPollFn: (customPollFn) => set({ customPollFn }),
  setMqttBrokerUrl: (mqttBrokerUrl) => set({ mqttBrokerUrl })
}));
export {
  useViewerStore
};
