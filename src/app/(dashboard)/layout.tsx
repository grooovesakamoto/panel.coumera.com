'use client';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Building2, 
  Camera, 
  Users, 
  Settings, 
  LogOut 
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* サイドバー */}
        <aside className="flex w-64 flex-col bg-[#2c3e50] text-white">
          <div className="flex h-16 items-center border-b border-[#34495e] px-6">
            <img
              src="/coumera-logo.png"
              alt="Coumera"
              width={160}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <div className="px-4 py-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                GENERAL
              </span>
            </div>
            <nav className="space-y-1 px-2">
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-[#34495e] hover:text-white"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>ダッシュボード</span>
              </Link>
              <Link
                href="/clients"
                className="flex items-center space-x-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-[#34495e] hover:text-white"
              >
                <Building2 className="h-5 w-5" />
                <span>クライアント管理</span>
              </Link>
              <Link
                href="/devices"
                className="flex items-center space-x-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-[#34495e] hover:text-white"
              >
                <Camera className="h-5 w-5" />
                <span>AIカメラ管理</span>
              </Link>
              <Link
                href="/users"
                className="flex items-center space-x-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-[#34495e] hover:text-white"
              >
                <Users className="h-5 w-5" />
                <span>ユーザー管理</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center space-x-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-[#34495e] hover:text-white"
              >
                <Settings className="h-5 w-5" />
                <span>設定</span>
              </Link>
              <div className="my-6 border-t border-[#34495e]"></div>
              <Link
                href="/api/auth/signout"
                className="flex items-center space-x-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-[#34495e] hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                <span>ログアウト</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 