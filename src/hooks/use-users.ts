import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, Role } from '@prisma/client';

export type UserWithClient = User & {
  clientName?: string | null;
};

export const useUser = () => {
  const [users, setUsers] = useState<UserWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('ユーザー情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    clientId?: string | null;
    phone?: string;
  }) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/users', data);
      
      // 更新されたリストを取得
      await fetchUsers();
      
      toast.success('ユーザーを作成しました');
      return response.data;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      if (error.response?.data?.error) {
        toast.error(`ユーザーの作成に失敗しました: ${error.response.data.error}`);
      } else {
        toast.error('ユーザーの作成に失敗しました');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, data: {
    name?: string;
    email?: string;
    role?: Role;
    clientId?: string | null;
    phone?: string;
    password?: string;
    isActive?: boolean;
  }) => {
    try {
      setLoading(true);
      const response = await axios.patch(`/api/users/${id}`, data);
      
      // 更新されたリストを取得
      await fetchUsers();
      
      toast.success('ユーザー情報を更新しました');
      return response.data;
    } catch (error: any) {
      console.error('Failed to update user:', error);
      if (error.response?.data?.error) {
        toast.error(`ユーザー情報の更新に失敗しました: ${error.response.data.error}`);
      } else {
        toast.error('ユーザー情報の更新に失敗しました');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setLoading(true);
      await axios.delete(`/api/users/${id}`);
      
      // 更新されたリストを取得
      await fetchUsers();
      
      toast.success('ユーザーを削除しました');
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      if (error.response?.data?.error) {
        toast.error(`ユーザーの削除に失敗しました: ${error.response.data.error}`);
      } else {
        toast.error('ユーザーの削除に失敗しました');
      }
      throw error;
    } finally {
      setLoading(false);
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