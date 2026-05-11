import { create } from 'zustand';
import type { Alert, AlertRule } from '@/types';
import { alertApi } from '@/utils/api';

interface AlertState {
  alerts: Alert[];
  alertRules: AlertRule[];
  loading: boolean;
  error: string | null;
  fetchAlerts: (params?: { status?: string; level?: string; page?: number; pageSize?: number }) => Promise<void>;
  acknowledgeAlert: (id: number) => Promise<void>;
  fetchRules: () => Promise<void>;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  alertRules: [],
  loading: false,
  error: null,

  fetchAlerts: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await alertApi.getAlerts(params);
      const d = res.data.data;
      set({ alerts: Array.isArray(d) ? d : d?.list || [], loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取告警列表失败';
      set({ error: message, loading: false });
    }
  },

  acknowledgeAlert: async (id) => {
    try {
      await alertApi.acknowledgeAlert(id);
      await get().fetchAlerts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '确认告警失败';
      set({ error: message });
      throw err;
    }
  },

  fetchRules: async () => {
    set({ loading: true, error: null });
    try {
      const res = await alertApi.getRules();
      set({ alertRules: Array.isArray(res.data.data) ? res.data.data : [], loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取告警规则失败';
      set({ error: message, loading: false });
    }
  },
}));
