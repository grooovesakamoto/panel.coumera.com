'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useAuth } from '@/hooks/use-auth';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { columns } from './columns';
import { UserDialog } from './components/user-dialog';
import { useUser } from '@/hooks/use-users';

const UsersPage = () => {
  const { user } = useAuth();
  const { users, loading } = useUser();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CLIENT_ADMIN';

  if (!user) {
    return null;
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading
            title="ユーザー管理"
            description="システムのユーザーを管理します"
          />
          {isAdmin && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              ユーザー追加
            </Button>
          )}
        </div>
        <Separator />
        <UserDialog open={open} setOpen={setOpen} />
        <DataTable
          columns={columns}
          data={users || []}
          searchColumn="name"
          searchPlaceholder="ユーザー名で検索..."
          loading={loading}
        />
      </div>
    </div>
  );
};

export default UsersPage; 