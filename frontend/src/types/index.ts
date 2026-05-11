export interface User {
  id: number;
  username: string;
  role: 'admin' | 'operator' | 'viewer';
  phone?: string;
}

export interface Device {
  id: number;
  name: string;
  did: string;
  type: 'sensor' | 'camera' | 'controller' | 'weather';
  sim_imei: string;
  sim_date: string;
  status: 'online' | 'offline';
  created_at: string;
  updated_at: string;
}

export interface SensorData {
  did: string;
  ph: number;
  salt: number;
  o2: number;
  nh3: number;
  health: number;
  timestamp: string;
}

export interface ControlCommand {
  did: string;
  action: 'open' | 'close';
  target: 'oxygen_pump' | 'feeder';
}

export interface ControlLog {
  id: number;
  did: string;
  action: string;
  target: string;
  result: 'success' | 'failed';
  operator: string;
  timestamp: string;
}

export interface Alert {
  id: number;
  did: string;
  level: 'I' | 'II' | 'III';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface AlertRule {
  id: number;
  metric: string;
  level: 'I' | 'II' | 'III';
  operator: '>' | '<' | '>=' | '<=';
  threshold: number;
  auto_action: string | null;
}

export interface DeviceShare {
  id: number;
  device_id: number;
  user_id: number;
  permission: 'view' | 'view_and_control';
  shared_at: string;
}

export interface PredictionPoint {
  timestamp: string;
  value: number;
  lower_bound: number;
  upper_bound: number;
}
