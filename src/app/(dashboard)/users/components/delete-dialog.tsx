'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-users';

interface UserDeleteDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  userId: string;
  userName: string;
}

export const UserDeleteDialog = ({
  open,
  setOpen,
  userId,
  userName,
}: UserDeleteDialogProps) => {
  const { deleteUser } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteUser(userId);
      setOpen(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ユーザーの削除</DialogTitle>
          <DialogDescription>
            本当に「{userName}」を削除しますか？この操作は元に戻せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end space-x-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                削除中...
              </>
            ) : (
              '削除する'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 