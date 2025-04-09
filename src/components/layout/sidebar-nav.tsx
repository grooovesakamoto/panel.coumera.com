'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Camera,
  Users,
  Settings,
  LogOut
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const routes = [
  {
    label: 'ダッシュボード',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-sky-500',
  },
  {
    label: 'クライアント管理',
    icon: Building2,
    href: '/clients',
    color: 'text-violet-500',
  },
  {
    label: 'AIカメラ管理',
    icon: Camera,
    href: '/devices',
    color: 'text-orange-500',
  },
  {
    label: 'ユーザー管理',
    icon: Users,
    href: '/users',
    color: 'text-green-500',
  },
  {
    label: '設定',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-500',
  }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <div className="relative w-32 h-8">
            <img
              src="/coumera-logo.png"
              alt="Coumera Logo"
              className="object-contain"
            />
          </div>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-[#00E0FF] hover:bg-[#E6FBFF] rounded-lg transition',
                pathname === route.href ? 'text-[#00E0FF] bg-[#E6FBFF]' : 'text-gray-600'
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn('h-5 w-5 mr-3', route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3">
        <button
          onClick={() => signOut()}
          className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-red-500 hover:bg-red-50 rounded-lg transition text-gray-600"
        >
          <div className="flex items-center flex-1">
            <LogOut className="h-5 w-5 mr-3 text-red-500" />
            ログアウト
          </div>
        </button>
      </div>
    </div>
  );
} 