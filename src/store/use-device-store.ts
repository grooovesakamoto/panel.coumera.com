'use client';

import { create } from 'zustand';
import { Device } from '@/types';

interface DeviceState {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  fetchDevices: (clientId: string) => Promise<void>;
  createDevice: (clientId: string, device: Partial<Device>) => Promise<void>;
  updateDevice: (clientId: string, deviceId: string, device: Partial<Device>) => Promise<void>;
  deleteDevice: (clientId: string, deviceId: string) => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  isLoading: false,
  error: null,

  fetchDevices: async (clientId: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: APIを使用してデバイスを取得する
      const mockDevices: Device[] = [
        {
          id: '1',
          name: 'デバイス1',
          actName: 'Act_001',
          status: 'online',
          lastPing: new Date().toISOString(),
          version: '1.0.0',
          clientId,
          createdAt: new Date().toISOString(),
          deviceId: 'DEV001',
          hostname: 'device-001.local',
          hardwareId: 'HW001',
          wifiConfigs: [
            { ssid: 'WiFi_1', password: '********', isActive: true },
          ],
          updateBlocked: false,
          deviceStatus: {
            isOnline: true,
            firmwareVersion: '1.0.0',
            connectedSsid: 'WiFi_1',
            wifiStrength: 85,
            voltage: { value: 12.1, isNormal: true },
            temperature: { value: 35.5, isNormal: true },
          },
          installedApps: ['app1', 'app2'],
        },
      ];
      set({ devices: mockDevices, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '不明なエラーが発生しました', isLoading: false });
    }
  },

  createDevice: async (clientId: string, device: Partial<Device>) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: APIを使用してデバイスを作成する
      const newDevice: Device = {
        id: Math.random().toString(36).slice(2),
        name: device.name || '新規デバイス',
        actName: device.actName || 'Act_001',
        status: 'offline',
        lastPing: new Date().toISOString(),
        version: '1.0.0',
        clientId,
        createdAt: new Date().toISOString(),
        deviceId: `DEV${Math.random().toString(36).slice(2).toUpperCase()}`,
        hostname: `device-${Math.random().toString(36).slice(2)}.local`,
        hardwareId: `HW${Math.random().toString(36).slice(2).toUpperCase()}`,
        wifiConfigs: [
          { ssid: 'WiFi_1', password: '********', isActive: true },
        ],
        updateBlocked: false,
        deviceStatus: {
          isOnline: false,
          firmwareVersion: '1.0.0',
          connectedSsid: null,
          wifiStrength: 0,
          voltage: { value: 0, isNormal: true },
          temperature: { value: 0, isNormal: true },
        },
        installedApps: [],
      };
      set((state) => ({ devices: [...state.devices, newDevice], isLoading: false }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '不明なエラーが発生しました', isLoading: false });
    }
  },

  updateDevice: async (clientId: string, deviceId: string, device: Partial<Device>) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: APIを使用してデバイスを更新する
      set((state) => ({
        devices: state.devices.map((d) =>
          d.id === deviceId ? { ...d, ...device } : d
        ),
        error: null,
      }));
    } catch (error) {
      console.error('Failed to update device:', error);
      set({ error: 'デバイスの更新に失敗しました' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteDevice: async (clientId: string, deviceId: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: APIを使用してデバイスを削除する
      set((state) => ({
        devices: state.devices.filter((d) => d.id !== deviceId),
        error: null,
      }));
    } catch (error) {
      console.error('Failed to delete device:', error);
      set({ error: 'デバイスの削除に失敗しました' });
    } finally {
      set({ isLoading: false });
    }
  },
})); 