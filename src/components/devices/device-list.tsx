import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ActcastDevice, useDevices } from '@/lib/actcast-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

type SortField = 'name' | 'status' | 'lastPing';
type SortOrder = 'asc' | 'desc';

interface SoftwareDisplay {
  label: string;
  color: string;
}

// 統一されたソフトウェア名の表示処理
const getActName = (act?: { id?: number, name?: string }): string => {
  if (!act || (!act.id && !act.name)) return '-';
  
  // 名前が存在する場合は文字列パターンで判別
  if (act.name) {
    // 特定のパターンが含まれる場合は標準的な名前を返す
    if (act.name.includes('入店計測')) return '入店数';
    if (act.name.includes('通行量計測')) return '通行量';
    if (act.name.includes('滞在計測')) return '滞在数';
    if (act.name.includes('視認計測')) return '視認数';
    
    // その他の特殊ケース
    if (act.name.includes('キラリナ京王吉祥寺')) return 'キラリナ';
    if (act.name.includes('Locarise - Actcast WalkerInsight')) return 'Lindt';
    if (act.name.includes('動作確認用')) return '確認用';
  }
  
  // IDによる判別（フォールバック）
  if (act.id) {
    switch (act.id) {
      case 9917:
        return '通行量';
      case 9918:
      case 9919:
        return '入店数';
      case 9916:
        return '滞在数';
      case 9960:
        return '視認数';
    }
  }
  
  // どのパターンにも当てはまらない場合は元の名前を返す
  return act.name || `Act ID: ${act.id}`;
};

// ソフトウェア表示色の対応付け
const getSoftwareColor = (label: string): string => {
  switch (label) {
    case '通行量':
      return 'bg-blue-500';
    case '入店数':
      return 'bg-green-500';
    case '滞在数':
      return 'bg-purple-500';
    case '視認数':
      return 'bg-orange-500';
    case 'キラリナ':
      return 'bg-pink-500';
    case 'Lindt':
      return 'bg-red-500';
    case '確認用':
      return 'bg-gray-500';
    default:
      return 'bg-gray-200';
  }
};

const getSoftwareDisplay = (act?: { id?: number, name?: string }): SoftwareDisplay => {
  if (!act) return { label: '-', color: 'bg-gray-200' };
  
  const label = getActName(act);
  const color = getSoftwareColor(label);
  
  return { label, color };
};

export function DeviceList() {
  const router = useRouter();
  const { devices, loading, error, refetch } = useDevices();

  // 自動更新の実装
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // 30秒ごとに更新

    return () => clearInterval(interval);
  }, [refetch]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  const getStatusBadge = (device: ActcastDevice) => {
    if (!device.status?.foundness) return <Badge variant="secondary">不明</Badge>;
    
    switch (device.status.foundness) {
      case 'Found':
        return <Badge variant="default">オンライン</Badge>;
      case 'Lost':
        return <Badge variant="destructive">オフライン</Badge>;
      default:
        return <Badge variant="secondary">{device.status.foundness}</Badge>;
    }
  };

  // フィルタリング
  const filteredDevices = devices.filter(device => {
    const matchesSearch = !searchQuery || device.device.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'online' 
        ? device.status?.foundness === 'Found'
        : device.status?.foundness === 'Lost';
    return matchesSearch && matchesStatus;
  });

  // ソート
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    if (sortField === 'name') {
      return sortOrder === 'asc' 
        ? a.device.name.localeCompare(b.device.name)
        : b.device.name.localeCompare(a.device.name);
    }
    if (sortField === 'status') {
      const aStatus = a.status?.foundness === 'Found' ? 1 : 0;
      const bStatus = b.status?.foundness === 'Found' ? 1 : 0;
      return sortOrder === 'asc' ? aStatus - bStatus : bStatus - aStatus;
    }
    if (sortField === 'lastPing') {
      const aTime = a.status?.last_updated ? new Date(a.status.last_updated).getTime() : 0;
      const bTime = b.status?.last_updated ? new Date(b.status.last_updated).getTime() : 0;
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    }
    return 0;
  });

  // ページネーション
  const totalPages = Math.ceil(sortedDevices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedDevices = sortedDevices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        {error}
        <Button onClick={refetch} className="ml-2">再試行</Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            <Input
              placeholder="デバイス名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(value: 'all' | 'online' | 'offline') => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ステータスで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="online">オンライン</SelectItem>
                <SelectItem value="offline">オフライン</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => refetch()}>更新</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>デバイス名</TableHead>
                <TableHead>ホスト名</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>ソフトウェア</TableHead>
                <TableHead>最終応答</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedDevices.map((device) => {
                const software = getSoftwareDisplay(device.device.act);
                return (
                  <TableRow key={device.device.id}>
                    <TableCell>{device.device.name}</TableCell>
                    <TableCell>{device.device.hostname}</TableCell>
                    <TableCell>{getStatusBadge(device)}</TableCell>
                    <TableCell>
                      <Badge className={software.color}>{software.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {device.status?.last_updated
                        ? new Date(device.status.last_updated).toLocaleString('ja-JP')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-transparent hover:text-primary"
                        onClick={() => {
                          console.log('Device:', device);
                          router.push(`/devices/${device.device.id}`);
                        }}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        <span>詳細</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {/* ページネーション */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            {sortedDevices.length}件中{startIndex + 1}から{Math.min(startIndex + ITEMS_PER_PAGE, sortedDevices.length)}件を表示
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              前へ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              次へ
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 