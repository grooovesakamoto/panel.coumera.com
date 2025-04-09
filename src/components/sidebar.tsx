"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="pb-12">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            管理メニュー
          </h2>
          <div className="space-y-1">
            <Button
              asChild
              variant="ghost"
              className={cn(
                'w-full justify-start',
                pathname === '/' && 'bg-accent'
              )}
            >
              <Link href="/">
                <span>ダッシュボード</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className={cn(
                'w-full justify-start',
                pathname.startsWith('/devices') && 'bg-accent'
              )}
            >
              <Link href="/devices">
                <span>AIカメラ管理</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 