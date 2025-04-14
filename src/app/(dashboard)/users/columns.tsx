'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserRole } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { UserDeleteDialog } from './components/delete-dialog';
import { useState } from 'react';
import { UserDialog } from './components/user-dialog';

// ユーザーロールの表示名を定義
const roleLabels: Record<UserRole, { label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }> = {
  ADMIN: {
    label: '管理者',
    variant: 'destructive'
  },
  CLIENT_ADMIN: {
    label: 'クライアント管理者',
    variant: 'default'
  },
  DEVELOPER: {
    label: '開発者',
    variant: 'secondary'
  },
  VIEWER: {
    label: '閲覧者',
    variant: 'outline'
  }
};

export type UserColumn = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clientId: string | null;
  clientName?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const columns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        ユーザー名
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        メールアドレス
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'role',
    header: 'ロール',
    cell: ({ row }) => {
      const role = row.getValue('role') as UserRole;
      const { label, variant } = roleLabels[role] || { label: role, variant: 'default' };
      
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'clientName',
    header: 'クライアント',
    cell: ({ row }) => {
      const clientName = row.getValue('clientName') as string | null;
      return clientName || '-';
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;
      const [showEditDialog, setShowEditDialog] = useState(false);
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">メニューを開く</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>アクション</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                編集
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600">
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <UserDialog 
            open={showEditDialog} 
            setOpen={setShowEditDialog} 
            initialData={user}
          />
          <UserDeleteDialog
            open={showDeleteDialog}
            setOpen={setShowDeleteDialog}
            userId={user.id}
            userName={user.name}
          />
        </>
      );
    },
  },
]; 