import { ActcastGroupConfig, ACTCAST_API_BASE_URL, ACTCAST_GROUPS } from '@/config/actcast';
import { useState, useCallback, useEffect, useMemo } from 'react';

export interface ActcastDevice {
  id: string;
  device: {
    id: string;
    name: string;
    hostname: string;
    mac_addr: string;
    target_triple: string;
    device_type: string;
    registered_at: string;
    hardware_id: string;
    firmware_version: string;
    firmware_version_timestamp: string;
    host_version: string;
    foundness: 'Found' | 'Lost' | string;
    last_os_booted_at: string;
    act?: {
      id: number;
      name: string;
      release_id: number;
      artifact_id: number;
      created_at: string;
      base_settings: Record<string, any>;
      device_specific_settings: Record<string, any>;
      settings: Record<string, any>;
    };
    reported_act?: {
      id: number;
      name: string;
      release_id: number;
      artifact_id: number;
      created_at: string;
      installed_at: string;
      settings: Record<string, any>;
    };
    access_points: Array<{
      ssid: string;
    }>;
  };
  status?: {
    foundness: 'Found' | 'Lost' | string;
    act_status?: string;
    last_updated: string;
    connected_ssid?: string;
    signal_strength?: number;
    uptime: number;
    memory: number;
    disk: number;
    memory_usage: number;
    disk_usage: number;
    cpu_temperature: number;
  };
  clientId?: string;
}

export interface ActcastDeviceListResponse {
  items: ActcastDevice[];
  total: number;
  next: string | null;
}

export class ActcastClient {
  private readonly baseUrl: string;
  private readonly config: ActcastGroupConfig;

  constructor(config: ActcastGroupConfig) {
    this.baseUrl = ACTCAST_API_BASE_URL || 'https://api.actcast.io/v0';
    this.config = config;
    console.log('ActcastClient initialized with baseUrl:', this.baseUrl);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Authorization': `token ${this.config.apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Actcast API error: ${response.status} ${response.statusText}`);
    }

    // レスポンスが空の場合は空のオブジェクトを返す
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  async getDevices(params: {
    limit?: number;
    next?: string;
    includeStatus?: boolean;
  } = {}): Promise<ActcastDeviceListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params.next) {
      searchParams.append('next', params.next);
    }
    if (params.includeStatus) {
      searchParams.append('include_status', '1');
    }

    const query = searchParams.toString();
    const path = `/groups/${this.config.groupId}/devices${query ? `?${query}` : ''}`;
    
    const response = await this.request<ActcastDeviceListResponse>(path);
    console.log('API Response:', JSON.stringify(response, null, 2));
    return response;
  }

  // デバイスの写真撮影を要求（POST）
  async requestPhotoCapture(groupId: string, deviceId: string): Promise<void> {
    if (!groupId || !deviceId) {
      console.error('写真撮影要求エラー: groupIdまたはdeviceIdが未指定', { groupId, deviceId });
      throw new Error('グループIDまたはデバイスIDが指定されていません');
    }
    
    const url = `${this.baseUrl}/groups/${groupId}/devices/${deviceId}/photo`;
    console.log(`写真撮影を要求します: ${url}, グループID: ${groupId}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.config.apiToken}`,
        }
      });

      console.log(`写真撮影要求レスポンス: ステータス ${response.status} ${response.statusText}`);
      
      // APIの仕様: 202 Acceptedが成功レスポンス
      if (response.status !== 202) {
        const errorText = await response.text().catch(() => '(レスポンステキストなし)');
        console.error(`写真撮影要求エラー: 予期せぬレスポンスステータス ${response.status}`, errorText);
        throw new Error(`写真撮影要求に失敗しました (${response.status}): ${response.statusText}`);
      }
      
      // レスポンスボディ（存在する場合）をログに出力
      try {
        const responseText = await response.text();
        if (responseText) {
          console.log('写真撮影要求レスポンスボディ:', responseText);
        }
      } catch (e) {
        // レスポンスボディ取得エラーは無視
      }
    } catch (error) {
      console.error('写真撮影要求エラー:', error);
      throw error;
    }
  }
  
  // 後方互換性のため元のメソッド名を維持
  async requestDevicePhoto(groupId: string, deviceId: string): Promise<void> {
    return this.requestPhotoCapture(groupId, deviceId);
  }

  // 直近に撮影された写真を取得（GET）
  async getLastCapturedPhoto(groupId: string, deviceId: string): Promise<string | null> {
    try {
      if (!groupId || !deviceId) {
        console.error('写真取得エラー: groupIdまたはdeviceIdが未指定', { groupId, deviceId });
        return null;
      }
      
      console.log(`写真データの取得開始 - デバイスID: ${deviceId}, グループID: ${groupId}, APIトークン: ${this.config.apiToken.substring(0, 5)}...`);
      
      const url = `${this.baseUrl}/groups/${groupId}/devices/${deviceId}/photo`;
      console.log(`写真データ取得リクエスト: ${url}, グループID: ${groupId}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.config.apiToken}`,
        }
      });

      console.log(`写真データ取得レスポンス: ステータス ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.error(`写真データの取得に失敗: ${response.status} ${response.statusText}`);
        if (response.status === 404) {
          console.error('写真取得エラー: デバイスが指定されたグループに存在しないか、写真がまだ準備されていません。デバイスのグループを確認してください。');
        }
        return null;
      }

      // JSONレスポンスを解析
      const data = await response.json();
      console.log('写真データ取得結果:', JSON.stringify(data, null, 2));
      
      // photoプロパティが存在しない場合のエラーハンドリング
      if (!data.photo) {
        console.error('写真データがAPIレスポンスに存在しません。写真がまだ準備中の可能性があります。', data);
        return null;
      }
      
      // photoがnullでもURLが含まれていない場合
      if (!data.photo.url) {
        console.error('写真URLがAPIレスポンスに存在しません。', data);
        return null;
      }

      return data.photo.url;
    } catch (error) {
      console.error('写真データ取得処理でエラーが発生:', error);
      return null;
    }
  }
  
  // 後方互換性のため元のメソッド名を維持
  async getDevicePhoto(groupId: string, deviceId: string): Promise<string | null> {
    return this.getLastCapturedPhoto(groupId, deviceId);
  }

  // デバイス設定の更新
  async updateDeviceSettings(deviceId: string, actId: number, requestData: Record<string, any>): Promise<any> {
    const url = `${this.baseUrl}/groups/${this.config.groupId}/devices/${deviceId}/act`;
    
    try {
      console.log('Updating device settings...');
      console.log('Request data:', JSON.stringify(requestData, null, 2));
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${this.config.apiToken}`,
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errBody = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errBody,
          url
        });
        throw new Error(`API Error: ${response.status} - ${errBody}`);
      }
      
      // 成功したら応答を返す
      const responseData = await response.json().catch(() => {
        console.log('Response is not JSON or empty, returning empty object');
        return {};
      });
      
      return responseData;
    } catch (error) {
      console.error('Error in updateDeviceSettings:', error);
      throw error;
    }
  }

  // Wi-Fi設定を更新するメソッド
  async updateDeviceWifiSettings(deviceId: string, wifiNetworks: Array<{ ssid: string, password?: string }>): Promise<any> {
    const url = `${this.baseUrl}/groups/${this.config.groupId}/devices/${deviceId}/wifi`;
    
    try {
      console.log('Updating Wi-Fi settings...');
      console.log('Request data:', JSON.stringify({ wifi_networks: wifiNetworks }, null, 2));
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${this.config.apiToken}`,
        },
        body: JSON.stringify({ wifi_networks: wifiNetworks })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errBody = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errBody,
          url
        });
        throw new Error(`API Error: ${response.status} - ${errBody}`);
      }
      
      // 成功したら応答を返す
      const responseData = await response.json().catch(() => {
        console.log('Response is not JSON or empty, returning empty object');
        return {};
      });
      
      return responseData;
    } catch (error) {
      console.error('Error in updateDeviceWifiSettings:', error);
      throw error;
    }
  }
}

// 複数グループのデバイス一覧を取得するユーティリティ関数
export async function getAllGroupDevices(configs: ActcastGroupConfig[]): Promise<ActcastDevice[]> {
  const allDevices: ActcastDevice[] = [];

  for (const config of configs) {
    const client = new ActcastClient(config);
    let nextToken: string | null = null;

    try {
      do {
        const response = await client.getDevices({ 
          limit: 100,
          includeStatus: true,
          next: nextToken || undefined
        });
        console.log('Received devices:', response.items.map(d => ({ id: d.id, name: d.device.name })));
        
        // デバイスにclientIdを設定（ホスト名から取得）
        const devicesWithIds = response.items.map(device => ({
          ...device,
          clientId: device.device.hostname
        }));
        
        allDevices.push(...devicesWithIds);
        nextToken = response.next;
      } while (nextToken);
    } catch (error) {
      console.error(`Failed to fetch devices for group ${config.groupId}:`, error);
    }
  }

  return allDevices;
}

// 自動更新のためのカスタムフック
export function useDevices() {
  const [devices, setDevices] = useState<ActcastDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const configs = [
        {
          apiToken: 'dUGqz6SwJyrcqQX8QsOD2727eTSQ4A3a',
          groupId: 2581,
        },
        {
          apiToken: '3RxIXlc4z9O3feKP279B6OlDlCI6y42a',
          groupId: 2236,
        },
      ];
      const allDevices = await getAllGroupDevices(configs);
      setDevices(allDevices);
      setError(null);
    } catch (err) {
      setError('デバイス一覧の取得に失敗しました');
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return { devices, loading, error, refetch: fetchDevices };
}

// デバイス写真を取得するカスタムフック
export function useDevicePhoto(groupId?: string, deviceId?: string) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchPhoto = useCallback(async () => {
    if (!groupId || !deviceId) {
      setError('グループIDまたはデバイスIDが指定されていません');
      console.error('デバイス写真取得エラー: パラメータが不足しています', { groupId, deviceId });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 以下の条件でActcastClientを作成
      let client: ActcastClient;
      
      if (groupId === '2236') {
        // キラリナ・Lindt用のクライアント
        client = new ActcastClient({
          apiToken: '3RxIXlc4z9O3feKP279B6OlDlCI6y42a',
          groupId: 2236
        });
        console.log('キラリナ/Lindt用のクライアントで写真を取得します: グループID=2236');
      } else {
        // その他デフォルト用のクライアント
        client = new ActcastClient({
          apiToken: 'dUGqz6SwJyrcqQX8QsOD2727eTSQ4A3a',
          groupId: 2581
        });
        console.log('デフォルトクライアントで写真を取得します: グループID=2581');
      }
      
      console.log(`写真取得処理: グループID=${groupId}, デバイスID=${deviceId}`);
      
      // ステップ1: 写真撮影を要求（POSTリクエスト - 1回のみ実行）
      try {
        console.log(`ステップ1: デバイスに写真撮影を要求します`);
        await client.requestPhotoCapture(groupId, deviceId);
        console.log(`写真撮影の要求が完了しました。デバイスが処理中です。`);
      } catch (err) {
        // 撮影要求自体が失敗した場合はここで処理を終了
        const message = err instanceof Error ? err.message : '不明なエラー';
        console.error('写真撮影の要求に失敗しました:', err);
        setError(`写真撮影の要求に失敗しました: ${message}`);
        setLoading(false);
        return;
      }
      
      // ステップ2: 写真データの取得（GETリクエスト - リトライあり）
      console.log(`ステップ2: 撮影された写真データの取得を開始します`);
      
      // 写真取得のリトライロジック
      const maxRetries = 12; // リトライ回数を増やして約1分間の処理を実現
      const waitTimePattern = [
        3, // 1回目: 3秒
        4, // 2回目: 4秒
        5, // 3回目: 5秒
        5, // 4回目: 5秒
        5, // 5回目: 5秒
        5, // 6回目: 5秒
        6, // 7回目: 6秒
        6, // 8回目: 6秒
        7, // 9回目: 7秒
        7, // 10回目: 7秒
        8, // 11回目: 8秒
        9  // 12回目: 9秒
      ]; // 合計: 約70秒
      
      let retryCount = 0;
      let photoData = null;
      
      while (retryCount < maxRetries) {
        // 待機時間を取得
        const waitTime = waitTimePattern[retryCount] * 1000;
        const elapsedTime = waitTimePattern.slice(0, retryCount).reduce((sum, time) => sum + time, 0);
        const totalTime = elapsedTime + waitTimePattern[retryCount];
        
        console.log(`写真データ取得の待機中... (${retryCount + 1}/${maxRetries}回目, ${waitTime}ms, 経過時間: ${elapsedTime}秒, 合計待機時間: 約${totalTime}秒)`);
        
        // 指定時間待機
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // 写真を取得（GETリクエスト）
        console.log(`写真データの取得を試行します (${retryCount + 1}/${maxRetries}回目)`);
        photoData = await client.getLastCapturedPhoto(groupId, deviceId);
        
        // 写真が取得できたらループを抜ける
        if (photoData) {
          console.log(`写真データの取得に成功しました (${retryCount + 1}回目の試行, 経過時間: 約${elapsedTime}秒)`);
          break;
        }
        
        console.log(`写真データがまだ準備できていません (${retryCount + 1}/${maxRetries}回目の試行)`);
        retryCount++;
      }
      
      if (photoData) {
        setPhotoUrl(photoData);
      } else {
        setError('写真データの準備が完了しませんでした。ネットワーク状態をご確認の上、再度お試しください。');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラー';
      console.error('写真取得処理でエラーが発生:', err);
      setError(`写真の取得中にエラーが発生しました: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [groupId, deviceId]);
  
  return { photoUrl, loading, error, fetchPhoto };
} 