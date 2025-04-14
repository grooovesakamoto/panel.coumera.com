"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useDevices, useDevicePhoto, ActcastClient } from '@/lib/actcast-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Camera, Loader2, PlusCircle, Save, Trash2, X, Wifi, RefreshCw, Edit } from 'lucide-react'
import Image from 'next/image'
import { ACTCAST_GROUPS } from '@/config/actcast'
import { DetectionLineEditor } from '@/components/detection-line-editor'
import type { DetectionLine } from '@/components/detection-line-editor'
import { toast } from 'sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DetectionAreaEditor, DetectionArea } from '@/components/detection-area-editor'
import { cn } from '@/lib/utils'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from '@/components/ui/card'

// インターフェース定義を上部に移動
interface Point {
  x: number
  y: number
}

export default function DeviceDetailPage() {
  const params = useParams()
  const { devices, loading, error } = useDevices()
  const device = devices.find((d) => d.device.id === params.deviceId)
  
  // デバイスのグループを特定
  const [actcastClient, setActcastClient] = useState<ActcastClient | null>(null)
  const [deviceGroup, setDeviceGroup] = useState<number>(ACTCAST_GROUPS[0].groupId)
  
  useEffect(() => {
    // デバイス名に基づいてグループを特定
    // キラリナとLindtは2236、それ以外は2581
    if (device) {
      // デバイス名またはAct名からデバイスタイプを判定
      const isKirarinaOrLindt = 
        device.device.name?.includes('キラリナ') || 
        device.device.name?.includes('Lindt') ||
        device.device.act?.name?.includes('Viewer Analysis') ||
        device.device.act?.name?.includes('WalkerInsight');
      
      console.log(`デバイス "${device.device.name}" (Act: ${device.device.act?.name}) → グループ: ${isKirarinaOrLindt ? '2236' : '2581'}`);
      
      const groupIndex = isKirarinaOrLindt ? 1 : 0 // 2236が1番目、2581が0番目
      setDeviceGroup(ACTCAST_GROUPS[groupIndex].groupId)
      setActcastClient(new ActcastClient(ACTCAST_GROUPS[groupIndex]))
    }
  }, [device])
  
  const { photoUrl, loading: photoLoading, error: photoError, fetchPhoto } = useDevicePhoto(
    deviceGroup.toString(),
    device?.device.id
  )
  const [imageSize, setImageSize] = useState<{ width: number; height: number | null }>({ width: 0, height: null })
  const [detectionLines, setDetectionLines] = useState<DetectionLine[]>([])
  const [detectionAreas, setDetectionAreas] = useState<DetectionArea[]>([])
  
  // 描画モードの状態
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [drawingType, setDrawingType] = useState<'line' | 'area' | null>(null)
  
  // 設定変更関連の状態
  const [deviceSettings, setDeviceSettings] = useState<Record<string, any>>({})
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [showDebugSettings, setShowDebugSettings] = useState(false)  // デバッグ表示のフラグ
  
  // ネットワーク設定関連の状態
  const [newSsid, setNewSsid] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isAddingNetwork, setIsAddingNetwork] = useState(false)
  const [wifiNetworks, setWifiNetworks] = useState<Array<{ssid: string, password?: string}>>([])

  // Act設定情報
  const [currentSettings, setCurrentSettings] = useState<string>('');
  
  // 設定ダイアログ関連

  // 初期設定値の読み込み
  useEffect(() => {
    if (device?.device?.act?.device_specific_settings) {
      setDeviceSettings(device.device.act.device_specific_settings)
    }
    
    if (device?.device?.access_points) {
      setWifiNetworks(device.device.access_points)
    }
  }, [device])

  // 画像のプリロード
  useEffect(() => {
    if (photoUrl) {
      const img = document.createElement('img')
      img.onload = () => {
        setImageSize({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
      img.src = photoUrl
    }
  }, [photoUrl])

  // 画像サイズを取得する関数
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    })
  }

  // 通行量と入店数の検知ラインを設定から取得
  useEffect(() => {
    if (device?.device?.act?.device_specific_settings && imageSize.width) {
      const actSettings = device.device.act.device_specific_settings;
      const actId = device.device.act.id;
      const actName = device.device.act.name || '';
      
      // 検知ラインの設定を読み込む（通行量計測とWalkerInsight）
      if ((actId === 9917 || actName.includes('WalkerInsight')) && actSettings.detection_lines) {
        try {
          // detection_linesを文字列として処理
          const linesStr = actSettings.detection_lines.toString();
          // ":"で区切られた複数のライン
          const lineStrings = linesStr.split(':');
          
          const lines: DetectionLine[] = lineStrings
            .filter((lineStr: string) => lineStr.trim() !== '')
            .map((lineStr: string, index: number) => {
              // 各ラインはx1,y1,x2,y2の形式
              const coords = lineStr.split(',').map(Number);
              if (coords.length >= 4) {
                // 点を抽出（2点のみの場合）
                let points = [];
                
                // 2点以上の場合、すべての点を取得
                for (let i = 0; i < coords.length; i += 2) {
                  if (i + 1 < coords.length) {
                    points.push({
                      x: coords[i],
                      y: coords[i + 1]
                    });
                  }
                }
          
          return {
            id: `line-${index}`,
                  name: `LINE${index}`,
            type: 'traffic',
            points
          };
              }
              return null;
            })
            .filter((line: DetectionLine | null) => line !== null) as DetectionLine[];
        
          if (lines.length > 0) {
        setDetectionLines(lines);
          }
        } catch (error) {
          console.error('Error parsing detection lines:', error);
        }
      } else if ((actId === 9918 || actId === 9919) && actSettings.detection_line) {
        try {
          // detection_lineを文字列として処理
          const lineStr = actSettings.detection_line.toString();
          const coords = lineStr.split(',').map(Number);
          
          // 複数点の場合でも、すべての点を取得
          let points = [];
          for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              points.push({
                x: coords[i],
                y: coords[i + 1]
              });
            }
          }
          
          if (points.length >= 2) {
        setDetectionLines([{
          id: 'line-0',
              name: 'LINE0',
          type: 'entry',
          points
        }]);
      }
        } catch (error) {
          console.error('Error parsing detection line:', error);
    }
      }
    }
  }, [device?.device?.act?.device_specific_settings, imageSize.width]);

  // 検知ラインの保存処理（共通処理）
  const handleSaveLines = async (lines: DetectionLine[]) => {
    if (!device?.device.id || !device?.device.act?.id) {
      toast.error('デバイスまたはActが見つかりません');
      return;
    }
    
    const actId = device.device.act.id;
    const actName = device.device.act.name || '';
    
    // アクトIDによって適切な関数を呼び出す
    if (actId === 9917 || actName.includes('WalkerInsight')) {
      // 通行量計測の場合
      await handleSaveTrafficLines(lines);
    } else if (actId === 9918 || actId === 9919) {
      // 入店計測の場合
      await handleSaveEntryLine(lines);
    }
  }
  
  // 通行量計測用の保存処理
  const handleSaveTrafficLines = async (lines: DetectionLine[]) => {
    setDetectionLines(lines);
    
    if (!device?.device.id || !device?.device.act?.id) {
      return;
    }
    
    // 既存の設定を取得（ディープコピー）
    const existingSettings = JSON.parse(JSON.stringify(device.device.act.device_specific_settings || {}));
    
    // 検知ラインのフォーマット
    let settingsToUpdate: any = { ...existingSettings };
    
      // 通行量計測の場合は複数のラインをサポート
    // 各ラインの点を文字列形式で保存 "x1,y1,x2,y2:x3,y3,x4,y4"
    const lineStrings = lines.map(line => {
      if (line.points.length < 2) return null;
      
      // 重複する点を取り除く
      const uniquePoints = [];
      for (let i = 0; i < line.points.length; i++) {
        const currentPoint = line.points[i];
        // 次の点が存在し、かつ現在の点と同じ座標の場合はスキップ
        const nextPoint = i < line.points.length - 1 ? line.points[i + 1] : null;
        if (nextPoint && currentPoint.x === nextPoint.x && currentPoint.y === nextPoint.y) {
          continue;
        }
        uniquePoints.push(currentPoint);
      }
      
      // すべての点を使用（3点以上のラインの場合も対応）
      const pointsCoordinates = uniquePoints.flatMap(point => [
        Math.round(point.x),
        Math.round(point.y)
      ]);
      
      // フォーマット: "x1,y1,x2,y2,x3,y3,..."（すべての点）
      return pointsCoordinates.join(',');
    }).filter(line => line !== null);
    
    // 複数ラインを ":" で連結
    settingsToUpdate.detection_lines = lineStrings.join(':');
    
    // 必須パラメータを設定（WalkerInsightの場合）
    const actName = device.device.act.name || '';
    if (actName.includes('WalkerInsight')) {
      if (!settingsToUpdate.hasOwnProperty('model')) {
        settingsToUpdate.model = 'body';
      }
      if (!settingsToUpdate.hasOwnProperty('display')) {
        settingsToUpdate.display = true;
      }
      if (!settingsToUpdate.hasOwnProperty('rotation')) {
        settingsToUpdate.rotation = 0;
      }
    }
    
    // APIに送信するデータ
    const requestPayload = { settings: settingsToUpdate };
    
    try {
      // APIにデータを送信
      await actcastClient?.updateDeviceSettings(
        device.device.id,
        device.device.act.id,
        requestPayload
      );
      
      toast.success('設定を保存しました');
    } catch (error) {
      console.error('Error updating settings:', error);
      if (error instanceof Error) {
        toast.error(
          <div>
            <p className="font-bold mb-1">設定の保存に失敗しました</p>
            <p className="text-xs">{error.message}</p>
          </div>
        );
      } else {
        toast.error('設定の保存に失敗しました');
      }
    }
  }
  
  // 入店計測用の保存処理
  const handleSaveEntryLine = async (lines: DetectionLine[]) => {
    setDetectionLines(lines);
    
    if (!device?.device.id || !device?.device.act?.id) {
      return;
    }
    
    // 既存の設定を取得（ディープコピー）
    const existingSettings = JSON.parse(JSON.stringify(device.device.act.device_specific_settings || {}));
    
    // 検知ラインのフォーマット
    let settingsToUpdate: any = { ...existingSettings };
    
    // 入店計測の場合でも複数点ラインをサポート
    if (lines.length > 0 && lines[0].points.length >= 2) {
      // 重複する点を取り除く
      const uniquePoints = [];
      for (let i = 0; i < lines[0].points.length; i++) {
        const currentPoint = lines[0].points[i];
        // 次の点が存在し、かつ現在の点と同じ座標の場合はスキップ
        const nextPoint = i < lines[0].points.length - 1 ? lines[0].points[i + 1] : null;
        if (nextPoint && currentPoint.x === nextPoint.x && currentPoint.y === nextPoint.y) {
          continue;
        }
        uniquePoints.push(currentPoint);
      }
      
      // すべての点を使用（複数点ラインの場合も対応）
      const pointsCoordinates = uniquePoints.flatMap(point => [
        Math.round(point.x),
        Math.round(point.y)
      ]);
      
      // フォーマット: "x1,y1,x2,y2,x3,y3,..."（すべての点）
      settingsToUpdate.detection_line = pointsCoordinates.join(',');
    }
    
    // 必須パラメータを設定
    if (!settingsToUpdate.hasOwnProperty('camera_rotation')) {
      settingsToUpdate.camera_rotation = 0; // デフォルト値
    }
    if (!settingsToUpdate.hasOwnProperty('display')) {
      settingsToUpdate.display = true;
    }
    
    // APIに送信するデータ
    const requestPayload = { settings: settingsToUpdate };
    
    try {
      // APIにデータを送信
      await actcastClient?.updateDeviceSettings(
        device.device.id,
        device.device.act.id,
        requestPayload
      );
      
      toast.success('設定を保存しました');
    } catch (error) {
      console.error('Error updating settings:', error);
      if (error instanceof Error) {
        toast.error(
          <div>
            <p className="font-bold mb-1">設定の保存に失敗しました</p>
            <p className="text-xs">{error.message}</p>
          </div>
        );
      } else {
        toast.error('設定の保存に失敗しました');
      }
    }
  }
  
  // デバイス設定の更新
  const updateDeviceSetting = (key: string, value: any) => {
    setDeviceSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }
  
  // 設定の保存処理
  const handleSaveSettings = async () => {
    if (!device?.device.id || !device?.device.act?.id) {
      toast.error('デバイスまたはActが見つかりません');
      return;
    }
    
    setIsSavingSettings(true);
    
    try {
      // 必要なパラメータが含まれているか確認
      const actId = device.device.act.id;
      const actName = device.device.act.name || '';
      
      // 最低限必要な設定をチェック
      const settingsToUpdate: Record<string, any> = {
        ...deviceSettings
      };
      
      // 視認計測（Act ID: 9960）またはViewerAnalysisを含むActの場合
      if (actId === 9960 || actName.includes('Viewer Analysis')) {
        if (settingsToUpdate.maximum_pitch === undefined) settingsToUpdate.maximum_pitch = 90;
        if (settingsToUpdate.minimum_pitch === undefined) settingsToUpdate.minimum_pitch = -90;
        if (settingsToUpdate.maximum_yaw === undefined) settingsToUpdate.maximum_yaw = 90;
        if (settingsToUpdate.minimum_yaw === undefined) settingsToUpdate.minimum_yaw = -90;
        if (settingsToUpdate.maximum_roll === undefined) settingsToUpdate.maximum_roll = 45;
        if (settingsToUpdate.minimum_roll === undefined) settingsToUpdate.minimum_roll = -45;
      }
      
      // 通行量計測（Act ID: 9917）とWalkerInsight
      if (actId === 9917 || actName.includes('WalkerInsight')) {
        if (settingsToUpdate.model === undefined) settingsToUpdate.model = 'body';
      }
      
      // リクエストデータを構築
      const requestData = {
        act_id: device.device.act.id,
        device_specific_settings: settingsToUpdate
      };
      
      console.log('設定保存リクエスト:', JSON.stringify(requestData, null, 2));
      
      // APIにデータを送信
      await actcastClient?.updateDeviceSettings(
        device.device.id,
        device.device.act.id,
        requestData
      );
      
      toast.success('設定を保存しました');
    } catch (err: any) {
      console.error('設定保存エラー:', err);
      
      // エラーメッセージの詳細表示
      if (err && err.message) {
        toast.error(
          <div>
            <p className="font-bold">設定の保存に失敗しました</p>
            <p className="text-xs">{err.message}</p>
          </div>
        );
      } else {
      toast.error('設定の保存に失敗しました');
      }
    } finally {
      setIsSavingSettings(false);
    }
  }
  
  // 写真取得の強化版
  const handleFetchPhoto = async () => {
    try {
      if (!device?.device.id) {
        toast.error('デバイスIDがありません');
        return;
      }
      
      console.log(`写真取得開始: デバイスID=${device.device.id}, グループID=${deviceGroup}, デバイス名=${device.device.name}`);
      console.log(`Act情報: ${device.device.act?.name || 'なし'} (ID: ${device.device.act?.id || 'なし'})`);
      
      // 写真を取得
      await fetchPhoto();
      
      // 成功メッセージ
      toast.success('デバイス写真を更新しました');
    } catch (error) {
      console.error('写真取得エラー:', error);
      toast.error(`写真の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }
  
  // Wi-Fi設定追加ダイアログ
  const WifiAddDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [localSsid, setLocalSsid] = useState('');
    const [localPassword, setLocalPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        // ダイアログが閉じるときに入力値をリセット
        setLocalSsid('');
        setLocalPassword('');
      }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!localSsid.trim()) {
        toast.error('SSIDを入力してください');
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        // 新しいWi-Fi設定
        const newNetwork = { 
          ssid: localSsid, 
          password: localPassword || undefined 
        };
        
        // Wi-Fi設定追加処理を呼び出し
        await handleAddWifiNetwork(newNetwork);
        
        // 成功したらダイアログを閉じる
        setIsOpen(false);
      } catch (error) {
        console.error('Wi-Fi設定の追加に失敗しました:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Wi-Fi追加
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Wi-Fi設定の追加</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ssid">SSID</Label>
                <Input
                  id="ssid"
                  value={localSsid}
                  onChange={(e) => setLocalSsid(e.target.value)}
                  placeholder="ネットワーク名"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={localPassword}
                  onChange={(e) => setLocalPassword(e.target.value)}
                  placeholder="パスワード"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-end space-x-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    追加中...
                  </>
                ) : '追加'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                閉じる
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Wi-Fi設定の追加（コンポーネントから呼び出される関数）
  const handleAddWifiNetwork = async (newNetwork: { ssid: string, password?: string }) => {
    if (!device?.device.id) {
      toast.error('デバイスIDがありません');
      throw new Error('デバイスIDがありません');
    }
    
    if (!actcastClient) {
      toast.error('APIクライアントの初期化に失敗しました');
      throw new Error('APIクライアントの初期化に失敗しました');
    }
    
    try {
      // 既存のSSIDと重複していないか確認
      const existingNetwork = wifiNetworks.find(network => network.ssid === newNetwork.ssid);
      if (existingNetwork) {
        // 確認ダイアログを表示
        if (!confirm(`「${newNetwork.ssid}」は既に登録されています。設定を上書きしますか？`)) {
          return;
        }
        
        // 上書きの場合は既存のものを削除
        const filteredNetworks = wifiNetworks.filter(network => network.ssid !== newNetwork.ssid);
        // 新しい設定を追加
        const updatedNetworks = [...filteredNetworks, newNetwork];
        
        // APIを呼び出してWi-Fi設定を更新
        console.log('Wi-Fi設定を更新します:', JSON.stringify(updatedNetworks, null, 2));
        const result = await actcastClient.updateDeviceWifiSettings(device.device.id, updatedNetworks);
        console.log('Wi-Fi設定の更新結果:', result);
        
        // フロントエンドのステートを更新
        setWifiNetworks(updatedNetworks);
        
        toast.success(`Wi-Fi設定「${newNetwork.ssid}」を更新しました`);
      } else {
        // 現在のネットワーク設定に追加
        const updatedNetworks = [...wifiNetworks, newNetwork];
        
        // APIを呼び出してWi-Fi設定を更新
        console.log('Wi-Fi設定を更新します:', JSON.stringify(updatedNetworks, null, 2));
        const result = await actcastClient.updateDeviceWifiSettings(device.device.id, updatedNetworks);
        console.log('Wi-Fi設定の更新結果:', result);
        
        // フロントエンドのステートを更新
        setWifiNetworks(updatedNetworks);
        
        toast.success(`Wi-Fi設定「${newNetwork.ssid}」を追加しました`);
      }
    } catch (error) {
      console.error('Wi-Fi設定の追加に失敗しました:', error);
      if (error instanceof Error) {
        toast.error(`Wi-Fi設定の追加に失敗しました: ${error.message}`);
      } else {
        toast.error('Wi-Fi設定の追加に失敗しました');
      }
      throw error;
    }
  };
  
  // Wi-Fi設定の削除
  const handleRemoveWifiNetwork = async (ssid: string) => {
    if (!device?.device.id) {
      toast.error('デバイスIDがありません');
      return;
    }
    
    if (!actcastClient) {
      toast.error('APIクライアントの初期化に失敗しました');
      return;
    }
    
    try {
      // 現在のネットワーク設定から削除
      const updatedNetworks = wifiNetworks.filter(network => network.ssid !== ssid);
      
      // APIを呼び出してWi-Fi設定を更新
      console.log('Wi-Fi設定を更新します:', JSON.stringify(updatedNetworks, null, 2));
      const result = await actcastClient.updateDeviceWifiSettings(device.device.id, updatedNetworks);
      console.log('Wi-Fi設定の更新結果:', result);
      
      // フロントエンドのステートを更新
      setWifiNetworks(updatedNetworks);
      
      toast.success(`Wi-Fi設定「${ssid}」を削除しました`);
    } catch (error) {
      console.error('Wi-Fi設定の削除に失敗しました:', error);
      if (error instanceof Error) {
        toast.error(`Wi-Fi設定の削除に失敗しました: ${error.message}`);
      } else {
        toast.error('Wi-Fi設定の削除に失敗しました');
      }
    }
  };
  
  // Wi-Fi設定の順番を変更する
  const handleMoveWifiNetwork = async (index: number, direction: 'up' | 'down') => {
    if (index < 0 || index >= wifiNetworks.length) return;
    
    // 移動先のインデックスを計算
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // 範囲外の場合は処理しない
    if (newIndex < 0 || newIndex >= wifiNetworks.length) return;
    
    // 配列のコピーを作成
    const updatedNetworks = [...wifiNetworks];
    
    // 要素を入れ替え
    [updatedNetworks[index], updatedNetworks[newIndex]] = [updatedNetworks[newIndex], updatedNetworks[index]];
    
    try {
      if (!device?.device.id || !actcastClient) {
        toast.error('デバイス情報の取得に失敗しました');
        return;
      }
      
      // APIを呼び出してWi-Fi設定を更新
      console.log('Wi-Fi設定の順番を変更します:', JSON.stringify(updatedNetworks, null, 2));
      const result = await actcastClient.updateDeviceWifiSettings(device.device.id, updatedNetworks);
      console.log('Wi-Fi設定の更新結果:', result);
      
      // フロントエンドのステートを更新
      setWifiNetworks(updatedNetworks);
      
      toast.success('Wi-Fi設定の順番を変更しました');
    } catch (error) {
      console.error('Wi-Fi設定の順番変更に失敗しました:', error);
      if (error instanceof Error) {
        toast.error(`Wi-Fi設定の順番変更に失敗しました: ${error.message}`);
      } else {
        toast.error('Wi-Fi設定の順番変更に失敗しました');
      }
    }
  };

  // 検知エディタの表示
  const renderDetectionEditor = () => {
    // デバイスまたはActが存在しない場合
    if (!device?.device.act) {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">このデバイスにはActがインストールされていません。</p>
        </div>
      );
    }
    
    const actId = device.device.act.id;
    const actName = device.device.act.name || '';
    
    // Lindt特有の対応 - 「WalkerInsight」という文字列が含まれる場合は通行量計測として扱う
    // "Locarise - Actcast WalkerInsight Visnu" などの特殊なAct名でも通行量計測UIを表示
    if (actId === 9917 || (actName && actName.includes('WalkerInsight'))) {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">通行量検知ライン設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative">
              {photoUrl ? (
                <div 
                  className="relative" 
                  style={{ 
                    userSelect: 'none', 
                    position: 'relative',
                    width: '448px',
                    height: '448px',
                    overflow: 'auto'
                  }}
                >
                  <div 
                    className="relative" 
                    style={{ 
                      userSelect: 'none', 
                      position: 'relative',
                      width: `${imageSize.width}px`,
                      height: imageSize.height ? `${imageSize.height}px` : 'auto',
                      overflow: 'auto'
                    }}
                    onClick={(e) => {
                      if (!isDrawingMode || drawingType !== 'line') return;
                      
                      // クリック位置を取得
                      const imgElement = e.currentTarget.querySelector('img');
                      if (!imgElement) return;
                      
                      const rect = imgElement.getBoundingClientRect();
                      
                      // クリック位置（ページ上の座標）
                      const clickX = e.clientX - rect.left;
                      const clickY = e.clientY - rect.top;
                      
                      // 点を追加
                      setCurrentPoints(prev => [...prev, { x: clickX, y: clickY }]);
                    }}
                    onDoubleClick={() => {
                      // 通行量検知は多角線として描画し、ダブルクリックで確定
                      if (!isDrawingMode || drawingType !== 'line' || currentPoints.length < 2) return;
                      
                      handleLineComplete([...currentPoints]);
                      setCurrentPoints([]);
                      setIsDrawingMode(false);
                      toast.success('検知ラインを作成しました');
                    }}
                  >
                    <Image
                      src={photoUrl}
                      alt="Camera View"
                      width={448}
                      height={448}
                      className="w-auto h-auto"
                      unoptimized
                      onLoad={handleImageLoad}
                      style={{ 
                        objectFit: 'contain',
                        width: '448px',
                        height: '448px'
                      }}
                    />
                    {/* SVG overlay for lines */}
                    <svg
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      viewBox="0 0 448 448"
                      preserveAspectRatio="none"
                    >
                      {/* 既存のライン */}
                      {detectionLines.map((line, index) => {
                        if (line.points.length < 2) return null;
                        
                        // 多角線として描画
                        const pointsStr = line.points
                          .map(point => `${point.x},${point.y}`)
                          .join(' ');
                        
                        return (
                          <polyline
                            key={index}
                            points={pointsStr}
                            fill="none"
                            stroke="red"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                        );
                      })}
                      
                      {/* 描画中のライン */}
                      {isDrawingMode && drawingType === 'line' && currentPoints.length > 0 && (
                        <g>
                          {/* 現在の点を結ぶパス */}
                          <polyline
                            points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="red"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                          
                          {/* 各点 */}
                          {currentPoints.map((point, idx) => (
                            <circle 
                              key={idx} 
                              cx={point.x} 
                              cy={point.y} 
                              r="4" 
                              fill="red"
                            />
                          ))}
                        </g>
                      )}
                    </svg>
          </div>
        </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded border">
                  <button 
                    className="flex items-center gap-2 p-3 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => handleFetchPhoto()}
                    disabled={photoLoading}
                  >
                    {photoLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                    カメラ画像を取得
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded border">
                <h3 className="font-medium mb-2">検知ライン</h3>
                {detectionLines.length > 0 ? (
                  <ul className="space-y-2">
                    {detectionLines.map((line, index) => (
                      <li key={line.id} className="flex items-center justify-between">
                        <span>{line.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newLines = detectionLines.filter(l => l.id !== line.id);
                            setDetectionLines(newLines);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">まだ検知ラインがありません</p>
                )}
              </div>
              
              <div>
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => {
                    setIsDrawingMode(true);
                    setDrawingType('line');
                    setCurrentPoints([]);
                  }}
                  disabled={isDrawingMode}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  検知ラインを追加
                </Button>
              </div>
              
              <div>
                <Button
                  variant="default"
                  className="w-full justify-center"
                  onClick={() => handleSaveLines(detectionLines)}
                  disabled={detectionLines.length === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  検知ラインを保存
                </Button>
              </div>
              
              {isDrawingMode && drawingType === 'line' && (
                <div className="text-sm p-3 bg-blue-50 text-blue-700 rounded">
                  <p className="font-medium">検知ラインの描画モード</p>
                  <p>画像上でクリックして点を追加し、ダブルクリックで確定します</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setIsDrawingMode(false);
                      setCurrentPoints([]);
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    // 視認計測の場合（キラリナ）- ViewerAnalysisを含むActも対象にする
    else if (actId === 9960 || (actName && actName.includes('Viewer Analysis'))) {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">視認計測設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative">
              {photoUrl ? (
                <div 
                  className="relative" 
                  style={{ 
                    userSelect: 'none', 
                    position: 'relative',
                    width: '448px',
                    height: '448px',
                    overflow: 'auto'
                  }}
                >
                  <Image
                    src={photoUrl}
                    alt="Camera View"
                    width={448}
                    height={448}
                    className="w-auto h-auto"
                    unoptimized
                    onLoad={handleImageLoad}
                    style={{ 
                      objectFit: 'contain',
                      width: '448px',
                      height: '448px'
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded border">
                  <button 
                    className="flex items-center gap-2 p-3 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => handleFetchPhoto()}
                    disabled={photoLoading}
                  >
                    {photoLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                    カメラ画像を取得
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded border">
                <h3 className="font-medium mb-2">視認計測パラメータ</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt>ピッチ角範囲:</dt>
                    <dd>{
                      device.device.act?.device_specific_settings?.minimum_pitch || 
                      device.device.act?.settings?.minimum_pitch || 
                      device.device.act?.base_settings?.minimum_pitch || -90
                    }° 〜 {
                      device.device.act?.device_specific_settings?.maximum_pitch ||
                      device.device.act?.settings?.maximum_pitch ||
                      device.device.act?.base_settings?.maximum_pitch || 90
                    }°</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>ヨー角範囲:</dt>
                    <dd>{
                      device.device.act?.device_specific_settings?.minimum_yaw ||
                      device.device.act?.settings?.minimum_yaw ||
                      device.device.act?.base_settings?.minimum_yaw || -90
                    }° 〜 {
                      device.device.act?.device_specific_settings?.maximum_yaw ||
                      device.device.act?.settings?.maximum_yaw ||
                      device.device.act?.base_settings?.maximum_yaw || 90
                    }°</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>ロール角範囲:</dt>
                    <dd>{
                      device.device.act?.device_specific_settings?.minimum_roll ||
                      device.device.act?.settings?.minimum_roll ||
                      device.device.act?.base_settings?.minimum_roll || -45
                    }° 〜 {
                      device.device.act?.device_specific_settings?.maximum_roll ||
                      device.device.act?.settings?.maximum_roll ||
                      device.device.act?.base_settings?.maximum_roll || 45
                    }°</dd>
                  </div>
                </dl>
              </div>
              
        <div>
                <Button
                  variant="default"
                  className="w-full justify-center"
                  onClick={() => handleSaveSettings()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  設定を保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // 入店計測の場合
    else if (actId === 9918 || actId === 9919) {
      // 入店計測用の画像サイズを定義
      const entryImageWidth = 640;
      const entryImageHeight = 480;
      
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">入店検知ライン設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative">
              {photoUrl ? (
                <div 
                  className="relative" 
                  style={{ 
                    userSelect: 'none', 
                    position: 'relative',
                    width: `${entryImageWidth}px`,
                    height: `${entryImageHeight}px`,
                    overflow: 'auto'
                  }}
                >
                  <div 
                    className="relative" 
                    style={{ 
                      userSelect: 'none', 
                      position: 'relative',
                      width: `${imageSize.width}px`,
                      height: imageSize.height ? `${imageSize.height}px` : 'auto',
                      overflow: 'auto'
                    }}
                    onClick={(e) => {
                      if (!isDrawingMode || drawingType !== 'line') return;
                      
                      // クリック位置を取得
                      const imgElement = e.currentTarget.querySelector('img');
                      if (!imgElement) return;
                      
                      const rect = imgElement.getBoundingClientRect();
                      
                      // 実際の画像の表示サイズを取得
                      const displayWidth = imgElement.clientWidth;
                      const displayHeight = imgElement.clientHeight;
                      
                      // クリック位置（ページ上の座標）
                      const clickX = e.clientX - rect.left;
                      const clickY = e.clientY - rect.top;
                      
                      // 画像の実際のサイズ
                      const originalWidth = imageSize.width;
                      const originalHeight = imageSize.height || 1;
                      
                      // 点を追加
                      setCurrentPoints(prev => [...prev, { x: clickX, y: clickY }]);
                    }}
                    onDoubleClick={() => {
                      // 入店検知は2点以上必要
                      if (!isDrawingMode || drawingType !== 'line' || currentPoints.length < 2) return;
                      
                      handleLineComplete([...currentPoints]);
                      setCurrentPoints([]);
                      setIsDrawingMode(false);
                      toast.success('入店検知ラインを作成しました');
                    }}
                  >
                    <Image
                      src={photoUrl}
                      alt="Camera View"
                      width={entryImageWidth}
                      height={entryImageHeight}
                      className="w-auto h-auto"
                      unoptimized
                      onLoad={handleImageLoad}
                      style={{ 
                        objectFit: 'contain',
                        width: `${entryImageWidth}px`,
                        height: `${entryImageHeight}px`
                      }}
                    />
                    {/* SVG overlay for line */}
                    <svg
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      viewBox={`0 0 ${entryImageWidth} ${entryImageHeight}`}
                      preserveAspectRatio="none"
                    >
                      {detectionLines.length > 0 && detectionLines[0].points.length >= 2 && (
                        <polyline
                          points={detectionLines[0].points.map(point => `${point.x},${point.y}`).join(' ')}
                          fill="none"
                          stroke="red"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      )}
                      
                      {/* 描画中のライン */}
                      {isDrawingMode && drawingType === 'line' && currentPoints.length > 0 && (
                        <g>
                          {/* 現在の点を結ぶパス */}
                          <polyline
                            points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="red"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                          
                          {/* 各点 */}
                          {currentPoints.map((point, idx) => (
                            <circle 
                              key={idx} 
                              cx={point.x} 
                              cy={point.y} 
                              r="4" 
                              fill="red"
                            />
                          ))}
                        </g>
                      )}
                    </svg>
          </div>
        </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded border">
                  <button 
                    className="flex items-center gap-2 p-3 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => handleFetchPhoto()}
                    disabled={photoLoading}
                  >
                    {photoLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                    カメラ画像を取得
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded border">
                <h3 className="font-medium mb-2">入店検知ライン</h3>
                {detectionLines.length > 0 && detectionLines[0].points.length >= 2 ? (
                  <p>入店ラインが設定されています</p>
                ) : (
                  <p className="text-sm text-gray-500">入店ラインはまだ設定されていません</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (!photoUrl || !imageSize.width || !imageSize.height) {
                      toast.error('まず画像を取得してください');
                      return;
                    }
                    
                    // 描画モードをオン
                    setIsDrawingMode(true);
                    setDrawingType('line');
                    setCurrentPoints([]);
                    toast.info('画像上をクリックして線の頂点を指定してください。ダブルクリックで確定します。');
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  ライン作成
                </Button>
                
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => handleSaveLines(detectionLines)}
                  disabled={detectionLines.length === 0 || detectionLines[0].points.length < 2}
                >
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // 滞在計測の場合
    else if (actId === 9916) {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">滞在検知エリア設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative">
              {photoUrl ? (
                <div 
                  className="relative" 
                  style={{ 
                    userSelect: 'none', 
                    position: 'relative',
                    width: '448px',
                    height: '448px',
                    overflow: 'auto'
                  }}
                >
                  <div 
                    className="relative" 
                    style={{ 
                      userSelect: 'none', 
                      position: 'relative',
                      width: `${imageSize.width}px`,
                      height: imageSize.height ? `${imageSize.height}px` : 'auto',
                      overflow: 'auto'
                    }}
                    onClick={(e) => {
                      if (!isDrawingMode || drawingType !== 'area') return;
                      
                      // クリック位置を取得
                      const imgElement = e.currentTarget.querySelector('img');
                      if (!imgElement) return;
                      
                      const rect = imgElement.getBoundingClientRect();
                      
                      // 実際の画像の表示サイズを取得
                      const displayWidth = imgElement.clientWidth;
                      const displayHeight = imgElement.clientHeight;
                      
                      // クリック位置（ページ上の座標）
                      const clickX = e.clientX - rect.left;
                      const clickY = e.clientY - rect.top;
                      
                      // 画像の実際のサイズ
                      const originalWidth = imageSize.width;
                      const originalHeight = imageSize.height || 1;
                      
                      // 点を追加
                      setCurrentPoints(prev => [...prev, { x: clickX, y: clickY }]);
                      
                      // 最初の点に戻るか、3点以上で多角形として確定可能
                      if (currentPoints.length >= 3) {
                        // 最初の点との距離を計算
                        const firstPoint = currentPoints[0];
                        const distance = Math.sqrt(
                          Math.pow(clickX - firstPoint.x, 2) + 
                          Math.pow(clickY - firstPoint.y, 2)
                        );
                        
                        // 近ければ多角形を閉じる
                        if (distance < 20) {
                          // 多角形を確定
                          const newArea: DetectionArea = {
                            id: `area-${detectionAreas.length}`,
                            name: `エリア ${detectionAreas.length + 1}`,
                            points: [...currentPoints]
                          };
                          setDetectionAreas([...detectionAreas, newArea]);
                          setCurrentPoints([]);
                          setIsDrawingMode(false);
                          toast.success('エリアを作成しました');
                        }
                      }
                    }}
                  >
                    <Image
                      src={photoUrl}
                      alt="Camera View"
                      width={448}
                      height={448}
                      className="w-auto h-auto"
                      unoptimized
                      onLoad={handleImageLoad}
                      style={{ 
                        objectFit: 'contain',
                        width: '448px',
                        height: '448px'
                      }}
                    />
                    {/* SVG overlay for areas */}
                    <svg
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      viewBox="0 0 448 448"
                      preserveAspectRatio="none"
                    >
                      {detectionAreas.map((area, index) => {
                        if (area.points.length < 3) return null;
                        
                        // Create polygon points string
                        const pointsStr = area.points
                          .map(point => `${point.x},${point.y}`)
                          .join(' ');
                        
                        return (
                          <polygon
                            key={index}
                            points={pointsStr}
                            fill="rgba(0, 100, 255, 0.3)"
                            stroke="blue"
                            strokeWidth="2"
                          />
                        );
                      })}
                      
                      {/* 描画中のエリア */}
                      {isDrawingMode && drawingType === 'area' && currentPoints.length > 0 && (
                        <g>
                          {/* 現在の点を結ぶパス */}
                          <polyline
                            points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="blue"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                          
                          {/* 各点 */}
                          {currentPoints.map((point, idx) => (
                            <circle 
                              key={idx} 
                              cx={point.x} 
                              cy={point.y} 
                              r="4" 
                              fill="blue"
                            />
                          ))}
                          
                          {/* 最初の点を特別に表示 */}
                          {currentPoints.length > 0 && (
                            <circle 
                              cx={currentPoints[0].x} 
                              cy={currentPoints[0].y} 
                              r="6" 
                              fill="none"
                              stroke="blue"
                              strokeWidth="2"
                            />
                          )}
                        </g>
                      )}
                    </svg>
          </div>
        </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded border">
                  <button 
                    className="flex items-center gap-2 p-3 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => handleFetchPhoto()}
                    disabled={photoLoading}
                  >
                    {photoLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                    カメラ画像を取得
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded border">
                <h3 className="font-medium mb-2">検知エリア</h3>
                {detectionAreas.length > 0 ? (
                  <ul className="space-y-2">
                    {detectionAreas.map((area, index) => (
                      <li key={area.id} className="flex items-center justify-between">
                        <span>{area.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newAreas = detectionAreas.filter(a => a.id !== area.id);
                            setDetectionAreas(newAreas);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">検知エリアはまだ設定されていません</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (!photoUrl || !imageSize.width || !imageSize.height) {
                      toast.error('まず画像を取得してください');
                      return;
                    }
                    
                    // 描画モードをオン
                    setIsDrawingMode(true);
                    setDrawingType('area');
                    setCurrentPoints([]);
                    toast.info('画像上をクリックして多角形の頂点を指定してください。最初の点を再度クリックするか、ダブルクリックで確定します。');
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  新規エリア作成
                </Button>
                
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => handleSaveAreas(detectionAreas)}
                  disabled={detectionAreas.length === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  すべて保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // サポートされていないAct IDの場合でも写真は表示
    else {
      return (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col items-center">
            {photoUrl && (
              <div className="mb-4">
          <Image
            src={photoUrl}
                  alt="Camera View"
                  width={448}
                  height={448}
            className="w-auto h-auto"
                  unoptimized
            onLoad={handleImageLoad}
                  style={{ 
                    objectFit: 'contain',
                    maxWidth: '100%',
                    maxHeight: '80vh'
                  }}
          />
        </div>
            )}
            <div className="mt-4 text-center">
              <p className="text-yellow-600 font-medium">この機能はまだ設定UIがサポートされていません: {actName}</p>
              <p className="text-gray-500 text-sm mt-2">Act ID: {actId}</p>
            </div>
          </div>
        </div>
      );
    }
  }
  
  // 矩形エリアの完了ハンドラ
  const handleAreaComplete = (area: any) => {
    if (!device?.device.id || !device?.device.act?.id) {
      toast.error('デバイスまたはActが見つかりません');
      return;
    }
    
    console.log('Area completed:', area);
  }
  
  // 滞在検知エリアを設定から取得
  useEffect(() => {
    if (device?.device?.act?.device_specific_settings && imageSize.width && imageSize.height) {
      const actSettings = device.device.act.device_specific_settings;
      const actId = device.device.act.id;
      
      // 滞在計測の場合のみ処理
      if (actId === 9916 && actSettings.area_list) {
        try {
          // area_listが文字列の場合はパースする
          let areaList;
          if (typeof actSettings.area_list === 'string') {
            try {
              // 文字列から配列に変換（JSON形式の場合）
              areaList = JSON.parse(actSettings.area_list.replace(/'/g, '"'));
            } catch (e) {
              // 通常の配列形式の場合
              areaList = JSON.parse(`[${actSettings.area_list}]`);
            }
          } else {
            areaList = actSettings.area_list;
          }

          console.log('Raw areaList:', areaList);
          
          // エリアリストを検知エリアに変換
          const areas: DetectionArea[] = [];
          
          // 2次元配列の場合（正しいフォーマット）
          if (Array.isArray(areaList) && areaList.length > 0 && Array.isArray(areaList[0])) {
            areaList.forEach((coordinates: number[], index: number) => {
              if (coordinates.length >= 6) { // 少なくとも3点（6座標）必要
                const points = [];
                for (let i = 0; i < coordinates.length; i += 2) {
                  if (i + 1 < coordinates.length) {
                    points.push({
                      x: coordinates[i],
                      y: coordinates[i + 1]
                    });
                  }
                }
                
                areas.push({
                  id: `area-${index}`,
                  name: `エリア ${index + 1}`,
                  points
                });
              }
            });
          } 
          // 1次元配列の場合（古いフォーマット）
          else if (Array.isArray(areaList) && areaList.length >= 6) {
            // 全体を1つのエリアとして扱う
            const points = [];
            for (let i = 0; i < areaList.length; i += 2) {
              if (i + 1 < areaList.length) {
                points.push({
                  x: areaList[i],
                  y: areaList[i + 1]
                });
              }
            }
            
            if (points.length >= 3) {
              areas.push({
                id: 'area-0',
                name: 'エリア 1',
                points
              });
            }
          }
          
          console.log('Loaded detection areas:', areas);
          setDetectionAreas(areas);
        } catch (error) {
          console.error('検知エリアの読み込みに失敗しました:', error);
          console.error('Raw area_list:', actSettings.area_list);
          
          // エラーが発生した場合は空の配列を設定
          setDetectionAreas([]);
        }
      }
    }
  }, [device?.device?.act?.device_specific_settings, imageSize.width, imageSize.height]);
  
  // 矩形エリアの保存ハンドラ
  const handleSaveAreas = async (areas: DetectionArea[]) => {
    setDetectionAreas(areas);
    
    if (!device?.device.id || !device?.device.act?.id) {
      toast.error('デバイスまたはActが見つかりません');
      return;
    }
    
    // 既存の設定を取得（ディープコピー）
    const existingSettings = JSON.parse(JSON.stringify(device.device.act.device_specific_settings || {}));
    
    // 検知エリアのフォーマット
    let settingsToUpdate: any = { ...existingSettings };
    
    if (device.device.act.id === 9916) {
      // 滞在検知の場合 - 2次元配列に変換（仕様書通り）
      const areaCoordinates = areas.map(area => {
        // 重複する点を取り除く
        const uniquePoints = [];
        for (let i = 0; i < area.points.length; i++) {
          const currentPoint = area.points[i];
          // 次の点が存在し、かつ現在の点と同じ座標の場合はスキップ
          const nextPoint = i < area.points.length - 1 ? area.points[i + 1] : null;
          if (nextPoint && currentPoint.x === nextPoint.x && currentPoint.y === nextPoint.y) {
            continue;
          }
          uniquePoints.push(currentPoint);
        }
        
        // 各点を座標値の配列に変換 [x1, y1, x2, y2, ...]
        return uniquePoints.flatMap(point => [
          Math.round(point.x),
          Math.round(point.y)
        ]);
      });
      
      // 要素がない場合はフォールバック
      if (areaCoordinates.length === 0) {
        areaCoordinates.push([0, 0, 0, 0]);
      }
      
      // area_listを文字列として設定
      settingsToUpdate.area_list = JSON.stringify(areaCoordinates);
      
      // 他の必須パラメータも設定
      if (!settingsToUpdate.hasOwnProperty('model')) {
        settingsToUpdate.model = 'head';
      }
      if (!settingsToUpdate.hasOwnProperty('rotation')) {
        settingsToUpdate.rotation = 0;
      }
      if (!settingsToUpdate.hasOwnProperty('display')) {
        settingsToUpdate.display = true;
      }
      if (!settingsToUpdate.hasOwnProperty('threshold')) {
        settingsToUpdate.threshold = 0.3;
      }
    }
    
    // APIに送信するデータ
    const requestPayload = { settings: settingsToUpdate };
    
    try {
      // 現在の設定をUIに表示（デバッグ用）
      setCurrentSettings(JSON.stringify(requestPayload));
      
      // APIにデータを送信
      await actcastClient?.updateDeviceSettings(
        device.device.id,
        device.device.act.id,
        requestPayload
      );
      
      toast.success('設定を保存しました');
    } catch (error) {
      console.error('Error updating settings:', error);
      if (error instanceof Error) {
        toast.error(
          <div>
            <p className="font-bold mb-1">設定の保存に失敗しました</p>
            <p className="text-xs">{error.message}</p>
          </div>
        );
      } else {
        toast.error('設定の保存に失敗しました');
      }
    }
  }

  // ライン作成完了時の処理
  async function handleLineComplete(points: Point[]) {
    if (!device?.device.id || !device?.device.act?.id) {
      toast.error('デバイスまたはActが見つかりません');
      return;
    }

    // アクトIDによって処理を分ける
    if (device.device.act.id === 9917) {
      // 通行量計測の場合
    if (points.length < 2) {
        toast.error('ラインには少なくとも2点が必要です');
      return;
    }

      // 新しいラインを作成
      const newLine: DetectionLine = {
        id: `line-${detectionLines.length}`,
        name: `LINE${detectionLines.length}`,
        type: 'traffic',
        points: points
      };
      
      // ラインリストに追加
      const updatedLines = [...detectionLines, newLine];
      setDetectionLines(updatedLines);
      
      // すぐに保存する場合はここでAPIを呼び出す
      // await handleSaveLines(updatedLines);
    } else if (device.device.act.id === 9918 || device.device.act.id === 9919) {
      // 入店計測の場合
      if (points.length < 2) {
        toast.error('ラインには少なくとも2点が必要です');
      return;
    }
    
      // 入店計測の場合は単一のラインのみ
      const newLine: DetectionLine = {
        id: 'line-0',
        name: 'LINE0',
        type: 'entry',
        points: points
      };
      
      // 既存のラインを置き換え
      setDetectionLines([newLine]);
      
      // すぐに保存する場合はここでAPIを呼び出す
      // await handleSaveLines([newLine]);
    }
  }

  // 信号強度をビジュアル化して表示する関数
  const SignalStrengthIndicator = ({ strength }: { strength: number | undefined }) => {
    if (strength === undefined) return <span>-</span>;
    
    // 信号強度が良い順に: 優良, 良, 可, 弱
    let status: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    let bars = 1;
    
    // dBm値を基にレベル分け（一般的なWi-Fi強度の目安）
    if (strength >= -50) {
      status = 'excellent';
      bars = 4;
    } else if (strength >= -60) {
      status = 'good';
      bars = 3;
    } else if (strength >= -70) {
      status = 'fair';
      bars = 2;
    }
    
    // 色のマッピング
    const colors = {
      excellent: 'bg-green-500',
      good: 'bg-green-400',
      fair: 'bg-yellow-400',
      poor: 'bg-red-400'
    };
    
    return (
      <div className="flex items-center">
        <div className="flex space-x-1 mr-2">
          {[1, 2, 3, 4].map((level) => (
            <div 
              key={level} 
              className={`w-1 rounded-sm ${level <= bars ? colors[status] : 'bg-gray-200'}`}
              style={{ height: `${level * 3}px` }}
            />
          ))}
        </div>
        <span className="text-sm">{strength} dBm</span>
      </div>
    );
  };

  // ネットワーク情報セクションを改修
  const NetworkInfoSection = () => {
    // 削除確認用の状態
    const [wifiToDelete, setWifiToDelete] = useState<string | null>(null);
    
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">ネットワーク情報</h2>
          <WifiAddDialog />
        </div>
        
        {/* Wi-Fi接続状態 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">現在の接続状態</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">接続中のSSID</dt>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                {device?.status?.connected_ssid ? (
                  <>
                    <Wifi className="h-4 w-4 mr-1 text-green-500" />
                    {device.status.connected_ssid}
                  </>
                ) : (
                  <span className="text-gray-500">未接続</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">電波強度</dt>
              <dd className="mt-1">
                <SignalStrengthIndicator strength={device?.status?.signal_strength} />
              </dd>
            </div>
            {device?.status?.foundness === 'Found' && (
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500 mt-2">
                  最終更新: {new Date(device.status.last_updated).toLocaleString()}
                </div>
              </div>
            )}
          </dl>
        </div>
        
        {/* 登録済みWi-Fi設定 */}
        <h3 className="text-sm font-medium text-gray-900 mb-2">登録済みWi-Fi設定</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {wifiNetworks.length > 0 ? (
            wifiNetworks.map((network, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2 rounded ${
                  device?.status?.connected_ssid === network.ssid 
                    ? 'bg-green-50 border border-green-100' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="text-sm">
                  <div className="font-medium flex items-center">
                    {device?.status?.connected_ssid === network.ssid && (
                      <Wifi className="h-3 w-3 mr-1 text-green-500" />
                    )}
                    {network.ssid}
                  </div>
                  {network.password && (
                    <div className="text-xs text-gray-500">パスワード: ********</div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveWifiNetwork(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveWifiNetwork(index, 'down')}
                    disabled={index === wifiNetworks.length - 1}
                  >
                    <ArrowUpDown className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWifiToDelete(network.ssid)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 py-2">
              登録済みのWi-Fi設定はありません
            </div>
          )}
        </div>
        
        {/* Wi-Fi削除確認ダイアログ */}
        <Dialog open={!!wifiToDelete} onOpenChange={(open) => !open && setWifiToDelete(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Wi-Fi設定の削除</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-700">
                Wi-Fi設定「{wifiToDelete}」を削除してもよろしいですか？
              </p>
              {device?.status?.connected_ssid === wifiToDelete && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <strong>警告:</strong> 現在接続中のネットワークです。削除するとデバイスの接続が切断される可能性があります。
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  if (wifiToDelete) {
                    handleRemoveWifiNetwork(wifiToDelete);
                    setWifiToDelete(null);
                  }
                }}
              >
                削除する
              </Button>
              <Button
                variant="outline"
                onClick={() => setWifiToDelete(null)}
              >
                キャンセル
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container py-4 flex justify-center items-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="container py-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          デバイス情報の取得に失敗しました。
        </div>
      </div>
    )
  }

  const getStatusBadge = () => {
    if (!device.status?.foundness) return <Badge className="text-base px-4 py-1" variant="secondary">不明</Badge>
    
    switch (device.status.foundness) {
      case 'Found':
        return <Badge className="text-base px-4 py-1 bg-green-500 hover:bg-green-600">オンライン</Badge>
      case 'Lost':
        return <Badge className="text-base px-4 py-1 bg-red-500 hover:bg-red-600">オフライン</Badge>
      default:
        return <Badge className="text-base px-4 py-1" variant="secondary">{device.status.foundness}</Badge>
    }
  }

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}日 ${hours}時間 ${minutes}分`
  }

  // 設定値の表示用フォーマット
  const formatSettingValue = (value: any): string => {
    if (value === undefined || value === null) return '-'
    if (typeof value === 'boolean') return value ? 'はい' : 'いいえ'
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'string') return value
    return JSON.stringify(value)
  }

  // 設定値の比較
  const compareSettings = (base: any, specific: any): 'same' | 'different' => {
    if (typeof base !== typeof specific) return 'different'
    if (typeof base === 'object') {
      return JSON.stringify(base) === JSON.stringify(specific) ? 'same' : 'different'
    }
    return base === specific ? 'same' : 'different'
  }

  // ソフトウェア名のマッピング
  const getActName = (act?: { id?: number, name?: string }): string => {
    if (!act) return '-'
    
    // Act名が存在する場合は文字列で種類を判別
    if (act.name) {
      // 名前に特定の文字列が含まれる場合は対応する機能名を返す
      if (act.name.includes('入店計測')) return '入店数'
      if (act.name.includes('通行量計測') || act.name.includes('WalkerInsight')) return '通行量'
      if (act.name.includes('滞在計測')) return '滞在数'
      if (act.name.includes('視認計測') || act.name.includes('Viewer Analysis')) return '視認数'
      
      // 上記に該当しない場合はそのままの名前を返す
      return act.name
    }
    
    // 名前がない場合はIDに基づいて判別
    if (!act.id) return '-'
    
    switch (act.id) {
      case 9917:
        return '通行量'
      case 9918:
      case 9919:  // 9919も入店数計測として追加
        return '入店数'
      case 9916:
        return '滞在数'
      case 9960:
        return '視認数'
      default:
        return `Act ID: ${act.id}`
    }
  }

  // 設定項目の表示名マッピング
  const getSettingLabels = (actId?: number, actName?: string): Record<string, string> => {
    if (!actId) return {}

    // Lindt（WalkerInsight）は通行量計測として扱う
    if (actName && actName.includes('WalkerInsight')) {
      return {
        display: 'ディスプレイ出力',
        model: '検出方法',
        rotation: '画像回転',
        detection_lines: '検知ライン',
      }
    }
    
    // キラリナ（Viewer Analysis）は視認計測として扱う
    if (actName && actName.includes('Viewer Analysis')) {
      return {
        display: 'ディスプレイ出力',
        rotation: '画像回転',
        use_usb_camera: 'USBカメラ使用',
        maximum_pitch: '最大ピッチ角',
        minimum_pitch: '最小ピッチ角',
        maximum_yaw: '最大ヨー角',
        minimum_yaw: '最小ヨー角',
        maximum_roll: '最大ロール角',
        minimum_roll: '最小ロール角',
      }
    }

    switch (actId) {
      case 9917: // 通行量計測
        return {
          display: 'ディスプレイ出力',
          model: '検出方法',
          rotation: '画像回転',
          detection_lines: '検知ライン',
        }
      case 9918: // 入店計測
        return {
          display: 'ディスプレイ出力',
          camera_rotation: '画像回転',
          use_usb_camera: 'USBカメラ使用',
          detection_line: '検知ライン',
        }
      case 9916: // 滞在計測
        return {
          display: 'ディスプレイ出力',
          model: '検出方法',
          rotation: '画像回転',
          use_usb_camera: 'USBカメラ使用',
          area_list: '検知エリア',
        }
      case 9960: // 視認計測
        return {
          display: 'ディスプレイ出力',
          rotation: '画像回転',
          use_usb_camera: 'USBカメラ使用',
          maximum_pitch: '最大ピッチ角',
          minimum_pitch: '最小ピッチ角',
          maximum_yaw: '最大ヨー角',
          minimum_yaw: '最小ヨー角',
          maximum_roll: '最大ロール角',
          minimum_roll: '最小ロール角',
        }
      default:
        return {}
    }
  }

  // デフォルト設定値を取得する関数
  const getDefaultSettingValue = (key: string): any => {
    // Act IDに応じてデフォルト値を返す
    if (!device?.device?.act?.id) return '';
    
    const actId = device.device.act.id;
    const actName = device.device.act.name || '';
    
    // 通行量計測（WalkerInsight含む）のデフォルト値
    if (actId === 9917 || actName.includes('WalkerInsight')) {
      switch (key) {
        case 'display':
          return true;
        case 'model':
          return 'body';
        case 'rotation':
          return 0;
        default:
          return '';
      }
    }
    
    // 視認計測（Viewer Analysis含む）のデフォルト値
    if (actId === 9960 || actName.includes('Viewer Analysis')) {
      switch (key) {
        case 'maximum_pitch':
          return 90;
        case 'minimum_pitch':
          return -90;
        case 'maximum_yaw':
          return 90;
        case 'minimum_yaw':
          return -90;
        case 'maximum_roll':
          return 45;
        case 'minimum_roll':
          return -45;
        case 'display':
          return true;
        case 'rotation':
          return 0;
        case 'use_usb_camera':
          return false;
        default:
          return '';
      }
    }
    
    return '';
  }

  return (
    <div className="container py-4">
      <div className="flex items-center space-x-4 mb-4">
        <h1 className="text-2xl font-bold">
          {device.device.name}
        </h1>
        {getStatusBadge()}
      </div>

      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={() => setShowDebugSettings(!showDebugSettings)}
        >
          {showDebugSettings ? 'デバッグ情報を隠す' : 'デバッグ情報を表示'}
        </Button>
      </div>

      {showDebugSettings && device.device.act && (
        <div className="mb-6 p-4 bg-gray-100 rounded-md overflow-auto max-h-96">
          <h3 className="text-md font-semibold mb-2">デバイス設定 (デバッグ用)</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">device_specific_settings</h4>
              <pre className="text-xs bg-white p-2 rounded">
                {JSON.stringify(device.device.act.device_specific_settings, null, 2) || "null"}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">settings</h4>
              <pre className="text-xs bg-white p-2 rounded">
                {JSON.stringify(device.device.act.settings, null, 2) || "null"}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">base_settings</h4>
              <pre className="text-xs bg-white p-2 rounded">
                {JSON.stringify(device.device.act.base_settings, null, 2) || "null"}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* 基本情報 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">基本情報</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">デバイスID</dt>
              <dd className="mt-1 text-sm text-gray-900">{device.device.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">MACアドレス</dt>
              <dd className="mt-1 text-sm text-gray-900">{device.device.mac_addr}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ハードウェアID</dt>
              <dd className="mt-1 text-sm text-gray-900">{device.device.hardware_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">登録日時</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(device.device.registered_at).toLocaleString('ja-JP')}
              </dd>
            </div>
          </dl>
        </div>

        {/* システム情報 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">システム情報</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">ファームウェアバージョン</dt>
              <dd className="mt-1 text-sm text-gray-900">{device.device.firmware_version}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">最終OS起動日時</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(device.device.last_os_booted_at).toLocaleString('ja-JP')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">稼働時間</dt>
              <dd className="mt-1 text-sm text-gray-900">{device.status?.uptime ? formatUptime(device.status.uptime) : '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">CPU温度</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {device.status?.cpu_temperature ? `${device.status.cpu_temperature.toFixed(1)}°C` : '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* リソース情報 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">リソース情報</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">メモリ使用量</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {device.status?.memory && device.status?.memory_usage
                  ? `${formatBytes(device.status.memory_usage)} / ${formatBytes(device.status.memory)}`
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ディスク使用量</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {device.status?.disk && device.status?.disk_usage
                  ? `${formatBytes(device.status.disk_usage)} / ${formatBytes(device.status.disk)}`
                  : '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* ネットワーク情報 */}
        <NetworkInfoSection />

        {/* Act設定情報 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium text-gray-900">Act設定情報</h2>
              <div className="text-sm text-gray-500">
                <span className="font-medium">ソフトウェア:</span> {getActName(device.device.act)}
              </div>
            </div>
            <div>
              <Button 
                variant="default" 
                size="sm" 
                className="text-sm"
                onClick={() => handleSaveSettings()}
                disabled={isSavingSettings}
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    設定を保存
                  </>
                )}
            </Button>
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {device.device.act && Object.entries(getSettingLabels(device.device.act?.id, device.device.act?.name)).map(([key, label]) => {
                // 検知ライン座標と検知エリア座標の表示を削除
                if (key === 'detection_lines' || key === 'detection_line' || key === 'area_list') {
                  return null;
                }
                
                // device_specific_settings, settings, base_settingsの順に値を探す
                const deviceSpecificSettings = device.device.act?.device_specific_settings || {};
                const actSettings = device.device.act?.settings || {};
                const baseSettings = device.device.act?.base_settings || {};
                
                // 優先順位: device_specific_settings > settings > base_settings
                const value = deviceSpecificSettings[key] !== undefined ? deviceSpecificSettings[key] :
                              actSettings[key] !== undefined ? actSettings[key] :
                              baseSettings[key];

                  return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    {key === 'model' ? (
                      <Select
                        defaultValue={value || "head"}
                        onValueChange={(val) => updateDeviceSetting(key, val)}
                      >
                        <SelectTrigger id={key} className="w-full">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="head">head</SelectItem>
                          <SelectItem value="body">body</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : key === 'rotation' ? (
                      <Select
                        defaultValue={value?.toString() || "0"}
                        onValueChange={(val) => updateDeviceSetting(key, Number(val))}
                      >
                        <SelectTrigger id={key} className="w-full">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0度</SelectItem>
                          <SelectItem value="180">180度</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : typeof value === 'boolean' ? (
                      <Select
                        defaultValue={value ? "true" : "false"}
                        onValueChange={(val) => updateDeviceSetting(key, val === "true")}
                      >
                        <SelectTrigger id={key} className="w-full">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">有効</SelectItem>
                          <SelectItem value="false">無効</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : typeof value === 'number' ? (
                      <Input
                        id={key}
                        type="number"
                        defaultValue={value !== undefined ? value : getDefaultSettingValue(key)}
                        onChange={(e) => updateDeviceSetting(key, Number(e.target.value))}
                      />
                    ) : (
                      <Input
                        id={key}
                        defaultValue={(value !== undefined && value !== null) ? value as string : getDefaultSettingValue(key)}
                        onChange={(e) => updateDeviceSetting(key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* デバイス写真 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">デバイス写真</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm"
              onClick={() => handleFetchPhoto()}
              disabled={photoLoading}
            >
              {photoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  写真を更新
                </>
              )}
            </Button>
          </div>
          <div className="relative w-full overflow-auto rounded-lg bg-gray-100" style={{ maxHeight: '80vh' }}>
            {photoLoading ? (
              <div className="h-96 flex flex-col items-center justify-center bg-gray-100 rounded">
                <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
                <p className="text-gray-500 font-medium">写真を読み込んでいます...</p>
                <p className="text-gray-400 text-sm mt-1">しばらくお待ちください</p>
              </div>
            ) : photoUrl ? (
              renderDetectionEditor()
            ) : photoError ? (
              <div className="h-96 flex items-center justify-center bg-gray-100 rounded">
                <div className="text-center">
                  <div className="text-red-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-gray-700">{photoError}</p>
                </div>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center bg-gray-100 rounded">
                <Camera className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">写真を取得するには更新ボタンをクリックしてください</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  )
} 