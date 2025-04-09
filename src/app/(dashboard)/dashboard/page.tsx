'use client';

import { useSession } from 'next-auth/react';
import { Building2, Camera, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ダッシュボード</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">クライアント数</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-purple-100 p-3">
              <Camera className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">AIカメラ数</p>
              <h3 className="text-2xl font-bold">156</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-orange-100 p-3">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">ユーザー数</p>
              <h3 className="text-2xl font-bold">24</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">最近のアクティビティ</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-medium">新規クライアント登録</p>
                <p className="text-sm text-gray-500">株式会社テクノロジー</p>
              </div>
              <span className="text-sm text-gray-500">2時間前</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">AIカメラ設置完了</p>
                <p className="text-sm text-gray-500">新宿店 - カメラ3台</p>
              </div>
              <span className="text-sm text-gray-500">6時間前</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">システム状態</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">CPU使用率</p>
              <div className="flex items-center">
                <div className="h-2 w-32 rounded-full bg-gray-200">
                  <div className="h-2 w-20 rounded-full bg-green-500"></div>
                </div>
                <span className="ml-2 text-sm text-gray-500">62%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-medium">メモリ使用率</p>
              <div className="flex items-center">
                <div className="h-2 w-32 rounded-full bg-gray-200">
                  <div className="h-2 w-24 rounded-full bg-blue-500"></div>
                </div>
                <span className="ml-2 text-sm text-gray-500">75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-medium">ストレージ使用率</p>
              <div className="flex items-center">
                <div className="h-2 w-32 rounded-full bg-gray-200">
                  <div className="h-2 w-16 rounded-full bg-purple-500"></div>
                </div>
                <span className="ml-2 text-sm text-gray-500">50%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 