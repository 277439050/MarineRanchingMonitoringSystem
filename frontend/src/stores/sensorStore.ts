import { create } from 'zustand';
import type { SensorData } from '@/types';
import { sensorApi } from '@/utils/api';

interface SensorState {
  realtimeData: SensorData[];
  historyData: SensorData[];
  loading: boolean;
  error: string | null;
  fetchRealtime: (did?: string) => Promise<void>;
  fetchHistory: (params: { did?: string; start?: string; end?: string; metric?: string; page?: number; pageSize?: number }) => Promise<void>;
}

export const useSensorStore = create<SensorState>((set) => ({
  realtimeData: [],
  historyData: [],
  loading: false,
  error: null,

  fetchRealtime: async (did) => {
    set({ loading: true, error: null });
    try {
      const res = await sensorApi.getRealtime(did);
      const d = res.data.data;
      set({ realtimeData: Array.isArray(d) ? d : d ? [d] : [], loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取实时数据失败';
      set({ error: message, loading: false });
    }
  },

  fetchHistory: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await sensorApi.getHistory(params);
      const d = res.data.data;
      set({ historyData: Array.isArray(d) ? d : d?.list || [], loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取历史数据失败';
      set({ error: message, loading: false });
    }
  },
}));
