'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useClientStore } from '@/store/use-client-store';
import { Client } from '@/types';
import { useState } from 'react';
import { toast } from 'sonner';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export function DeleteDialog({ open, onOpenChange, client }: DeleteDialogProps) {
  const { deleteClient } = useClientStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteClient(client.id);
      toast.success('クライアントを削除しました');
      onOpenChange(false);
    } catch (error) {
      console.error('クライアントの削除に失敗しました:', error);
      toast.error('クライアントの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>クライアントの削除</DialogTitle>
          <DialogDescription>
            本当に「{client.name}」を削除しますか？
            この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? '削除中...' : '削除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 