'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/use-users';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@prisma/client';
import { toast } from 'react-hot-toast';
import { UserColumn } from '../columns';

// Roleによって表示名を変える
const roleLabels: Record<Role, string> = {
  ADMIN: '管理者',
  CLIENT_ADMIN: 'クライアント管理者',
  DEVELOPER: '開発者', 
  VIEWER: '閲覧者'
};

interface FormData {
  name: string;
  email: string;
  role: Role;
  password: string;
  clientId: string | null;
  phone: string;
}

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: UserColumn;
}

export const UserDialog = ({ open, setOpen, initialData }: Props) => {
  const isEdit = !!initialData;
  const { user } = useAuth();
  const { createUser, updateUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: 'VIEWER',
    password: '',
    clientId: user?.clientId || null,
    phone: '',
  });

  // 編集時にフォームデータを設定
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        password: '',
        clientId: initialData.clientId,
        phone: '',
      });
    } else {
      // 新規作成時はフォームをリセット
      setFormData({
        name: '',
        email: '',
        role: 'VIEWER',
        password: '',
        clientId: user?.clientId || null,
        phone: '',
      });
    }
  }, [initialData, user?.clientId]);

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.name.trim()) {
      toast.error('名前を入力してください');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('メールアドレスを入力してください');
      return;
    }
    
    if (!isEdit && !formData.password.trim()) {
      toast.error('パスワードを入力してください');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEdit) {
        // パスワードが空の場合は送信しない
        const updateData = {
          ...formData,
          password: formData.password.trim() ? formData.password : undefined,
        };
        await updateUser(initialData.id, updateData);
      } else {
        await createUser(formData);
      }
      
      setOpen(false);
    } catch (error) {
      console.error('ユーザー保存エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'ユーザー編集' : 'ユーザー登録'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="ユーザー名"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="example@coumera.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{isEdit ? 'パスワード (変更する場合のみ)' : 'パスワード'}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={isEdit ? '(変更しない場合は空白)' : 'パスワード'}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="例: 03-1234-5678"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">ロール</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleChange('role', value as Role)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ロールを選択" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (isEdit ? '更新' : '登録')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 