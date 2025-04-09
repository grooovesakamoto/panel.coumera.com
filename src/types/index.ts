export interface Client {
  id: string;
  name: string;
  deviceCount: number;
  createdAt: string;
}

export interface WiFiConfig {
  ssid: string;
  password: string;
  isActive: boolean;
}

export interface DeviceStatus {
  isOnline: boolean;
  firmwareVersion: string;
  connectedSsid: string | null;
  wifiStrength: number; // 0-100
  voltage: {
    value: number;
    isNormal: boolean;
  };
  temperature: {
    value: number;
    isNormal: boolean;
  };
}

export interface InstalledApp {
  id: string;
  name: string;
  version: string;
  settings?: AppSettings;
}

export interface AppSettings {
  cameraMode?: 'normal' | 'night' | 'auto';
  captureInterval?: number;
  detectionModel?: 'head' | 'body';
  hdmiDisplay?: boolean;
  imageRotation?: 0 | 180;
}

export interface Device {
  id: string;
  name: string;
  actName: string;
  status: 'online' | 'offline';
  lastPing: string;
  version: string;
  clientId: string;
  createdAt: string;
  deviceId: string;
  hostname: string;
  hardwareId: string;
  wifiConfigs: WiFiConfig[];
  updateBlocked: boolean;
  deviceStatus: DeviceStatus;
  installedApps: string[];
} 