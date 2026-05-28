import axios from 'axios';
import type { ControlCommand, AlertRule } from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:666/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

export const deviceApi = {
  getDevices: (params?: { type?: string; status?: string; page?: number; pageSize?: number }) =>
    api.get('/devices', { params }),
  getDevice: (id: number) => api.get(`/devices/${id}`),
  addDevice: (data: Partial<import('@/types').Device>) => api.post('/devices', data),
  updateDevice: (id: number, data: Partial<import('@/types').Device>) => api.put(`/devices/${id}`, data),
  deleteDevice: (id: number) => api.delete(`/devices/${id}`),
  getShares: (deviceId: number) => api.get(`/devices/${deviceId}/shares`),
  addShare: (deviceId: number, data: { user_id: number; permission: string }) =>
    api.post(`/devices/${deviceId}/shares`, data),
  deleteShare: (deviceId: number, shareId: number) =>
    api.delete(`/devices/${deviceId}/shares/${shareId}`),
};

export const sensorApi = {
  getRealtime: (did?: string) => api.get('/sensor/realtime', { params: { did } }),
  getHistory: (params: { did?: string; start?: string; end?: string; metric?: string; page?: number; pageSize?: number }) =>
    api.get('/sensor/history', { params }),
  exportData: (params: { did?: string; start?: string; end?: string; format?: string }) =>
    api.get('/sensor/export', { params, responseType: 'blob' }),
};

export const controlApi = {
  sendCommand: (data: ControlCommand) => api.post('/control/command', data),
  getLogs: (params?: { did?: string; page?: number; pageSize?: number }) =>
    api.get('/control/logs', { params }),
  getStatus: (did: string) => api.get('/control/status', { params: { did } }),
};

export const alertApi = {
  getAlerts: (params?: { status?: string; level?: string; page?: number; pageSize?: number }) =>
    api.get('/alerts', { params }),
  acknowledgeAlert: (id: number) => api.put(`/alerts/${id}/acknowledge`),
  getRules: () => api.get('/alerts/rules'),
  addRule: (data: Omit<AlertRule, 'id'>) => api.post('/alerts/rules', data),
  updateRule: (id: number, data: Partial<AlertRule>) => api.put(`/alerts/rules/${id}`, data),
  deleteRule: (id: number) => api.delete(`/alerts/rules/${id}`),
};

export const encryptionApi = {
  encrypt: (plaintext: string, algorithm: 'aes-256-cbc' = 'aes-256-cbc') =>
    api.post('/encryption/encrypt', { plaintext, algorithm }),
  decrypt: (ciphertext: string, iv: string, algorithm: 'aes-256-cbc' = 'aes-256-cbc') =>
    api.post('/encryption/decrypt', { ciphertext, iv, algorithm }),
  getHistory: (params?: { page?: number; pageSize?: number }) =>
    api.get('/encryption/history', { params }),
};

export const predictionApi = {
  getPrediction: (params: { did: string; metric: string; hours: number }) =>
    api.get('/prediction', { params }),
};

export const iotApi = {
  login: () => api.post('/iot/login'),
  getDevices: () => api.post('/iot/devices'),
  getData: (data: Record<string, unknown>) => api.post('/iot/data', data),
  getOp: (data: Record<string, unknown>) => api.post('/iot/op', data),
  sendCmd: (data: Record<string, unknown>) => api.post('/iot/cmd', data),
  getHistory: (data: Record<string, unknown>) => api.post('/iot/history', data),
};

export const oldPlatformApi = {
  login: () => api.post('/iot-proxy/login'),
  getDeviceList: (data?: Record<string, unknown>) => api.post('/iot-proxy/devices', data || {}),
  getRealtimeData: (data: { did?: string; [key: string]: unknown }) => api.post('/iot-proxy/data', data),
  getOpStatus: (data: { did?: string; [key: string]: unknown }) => api.post('/iot-proxy/op', data),
  sendCommand: (params: Record<string, unknown>) => api.post('/iot-proxy/cmd', params),
  getHistoryData: (params: { did?: string; [key: string]: unknown }) => api.post('/iot-proxy/history', params),
};

export default api;
