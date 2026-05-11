import { create } from 'zustand';
import type { Device } from '@/types';
import { deviceApi } from '@/utils/api';

interface DeviceState {
  devices: Device[];
  loading: boolean;
  error: string | null;
  fetchDevices: (params?: { type?: string; status?: string; page?: number; pageSize?: number }) => Promise<void>;
  addDevice: (data: Partial<Device>) => Promise<void>;
  updateDevice: (id: number, data: Partial<Device>) => Promise<void>;
  deleteDevice: (id: number) => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  loading: false,
  error: null,

  fetchDevices: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await deviceApi.getDevices(params);
      const responseData = res.data.data;
      set({ devices: Array.isArray(responseData) ? responseData : responseData?.list || [], loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取设备列表失败';
      set({ error: message, loading: false });
    }
  },

  addDevice: async (data) => {
    try {
      await deviceApi.addDevice(data);
      await get().fetchDevices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '添加设备失败';
      set({ error: message });
      throw err;
    }
  },

  updateDevice: async (id, data) => {
    try {
      await deviceApi.updateDevice(id, data);
      await get().fetchDevices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '更新设备失败';
      set({ error: message });
      throw err;
    }
  },

  deleteDevice: async (id) => {
    try {
      await deviceApi.deleteDevice(id);
      await get().fetchDevices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '删除设备失败';
      set({ error: message });
      throw err;
    }
  },
}));
