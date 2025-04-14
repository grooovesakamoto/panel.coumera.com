import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User } from '@prisma/client';

export type UserWithClient = User & {
  clientName?: string | null;
};

// モックデータ（開発用）
const mockUsers = [
  {
    id: '1',
    name: '管理者ユーザー',
    email: 'admin@coumera.com',
    role: 'ADMIN',
    clientId: null,
    clientName: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isActive: true,
    lastLogin: new Date('2023-05-01'),
    phone: '03-1234-5678',
  },
  {
    id: '2',
    name: 'クライアント管理者',
    email: 'clientadmin@example.com',
    role: 'CLIENT_ADMIN',
    clientId: 'client1',
    clientName: 'サンプル株式会社',
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
    isActive: true,
    lastLogin: new Date('2023-05-02'),
    phone: '03-1234-5679',
  },
  {
    id: '3',
    name: '開発者ユーザー',
    email: 'developer@example.com',
    role: 'DEVELOPER',
    clientId: 'client1',
    clientName: 'サンプル株式会社',
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03'),
    isActive: true,
    lastLogin: new Date('2023-05-03'),
    phone: '03-1234-5680',
  },
  {
    id: '4',
    name: '閲覧者ユーザー',
    email: 'viewer@example.com',
    role: 'VIEWER',
    clientId: 'client1',
    clientName: 'サンプル株式会社',
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04'),
    isActive: true,
    lastLogin: new Date('2023-05-04'),
    phone: '03-1234-5681',
  },
];

export const useUser = () => {
  const [users, setUsers] = useState<UserWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // 開発環境ではモックデータを使用
      if (process.env.NODE_ENV === 'development') {
        // 少し遅延を入れて非同期動作をシミュレート
        setTimeout(() => {
          setUsers(mockUsers as UserWithClient[]);
          setLoading(false);
        }, 800);
        return;
      }
      
      // 本番環境では実際のAPIを呼び出す
      const response = await axios.get('/api/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('ユーザー情報の取得に失敗しました');
      setLoading(false);
    }
  };

  const createUser = async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    clientId?: string | null;
    phone?: string;
  }) => {
    try {
      setLoading(true);
      
      // 開発環境ではモックデータを使用
      if (process.env.NODE_ENV === 'development') {
        const newUser = {
          id: Date.now().toString(),
          name: data.name,
          email: data.email,
          role: data.role,
          clientId: data.clientId || null,
          clientName: data.clientId ? 'サンプル株式会社' : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          lastLogin: null,
          phone: data.phone || null,
        };
        
        setUsers(prevUsers => [...prevUsers, newUser as UserWithClient]);
        toast.success('ユーザーを作成しました');
        setLoading(false);
        return newUser;
      }
      
      // 本番環境では実際のAPIを呼び出す
      const response = await axios.post('/api/users', data);
      await fetchUsers();
      toast.success('ユーザーを作成しました');
      setLoading(false);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      if (error.response?.data?.error) {
        toast.error(`ユーザーの作成に失敗しました: ${error.response.data.error}`);
      } else {
        toast.error('ユーザーの作成に失敗しました');
      }
      setLoading(false);
      throw error;
    }
  };

  const updateUser = async (id: string, data: {
    name?: string;
    email?: string;
    role?: string;
    clientId?: string | null;
    phone?: string;
    password?: string;
    isActive?: boolean;
  }) => {
    try {
      setLoading(true);
      
      // 開発環境ではモックデータを使用
      if (process.env.NODE_ENV === 'development') {
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === id 
              ? { 
                  ...user, 
                  ...data, 
                  updatedAt: new Date(),
                  clientName: data.clientId ? 'サンプル株式会社' : user.clientName
                } 
              : user
          )
        );
        
        toast.success('ユーザー情報を更新しました');
        setLoading(false);
        return { id, ...data };
      }
      
      // 本番環境では実際のAPIを呼び出す
      const response = await axios.patch(`/api/users/${id}`, data);
      await fetchUsers();
      toast.success('ユーザー情報を更新しました');
      setLoading(false);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update user:', error);
      if (error.response?.data?.error) {
        toast.error(`ユーザー情報の更新に失敗しました: ${error.response.data.error}`);
      } else {
        toast.error('ユーザー情報の更新に失敗しました');
      }
      setLoading(false);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setLoading(true);
      
      // 開発環境ではモックデータを使用
      if (process.env.NODE_ENV === 'development') {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
        toast.success('ユーザーを削除しました');
        setLoading(false);
        return;
      }
      
      // 本番環境では実際のAPIを呼び出す
      await axios.delete(`/api/users/${id}`);
      await fetchUsers();
      toast.success('ユーザーを削除しました');
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      if (error.response?.data?.error) {
        toast.error(`ユーザーの削除に失敗しました: ${error.response.data.error}`);
      } else {
        toast.error('ユーザーの削除に失敗しました');
      }
      setLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers
  };
}; 