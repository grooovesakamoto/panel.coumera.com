'use client';

import { useEffect } from 'react';
import { useState, useCallback } from 'react';
import { Client } from '@/types';

interface UseClientsReturn {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  createClient: (client: Client) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: APIからクライアント一覧を取得する
      // 一時的なモックデータ
      const mockClients: Client[] = [
        {
          id: '1',
          name: '株式会社テクノロジー',
          deviceCount: 5,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: '株式会社イノベーション',
          deviceCount: 3,
          createdAt: new Date().toISOString(),
        },
      ];
      setClients(mockClients);
    } catch (error) {
      setError('クライアント一覧の取得に失敗しました');
      console.error('Failed to fetch clients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createClient = useCallback(async (client: Client) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: APIを使用してクライアントを作成する
      setClients((prev) => [...prev, client]);
    } catch (error) {
      setError('クライアントの作成に失敗しました');
      console.error('Failed to create client:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateClient = useCallback(async (id: string, client: Partial<Client>) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: APIを使用してクライアントを更新する
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...client } : c))
      );
    } catch (error) {
      setError('クライアントの更新に失敗しました');
      console.error('Failed to update client:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: APIを使用してクライアントを削除する
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      setError('クライアントの削除に失敗しました');
      console.error('Failed to delete client:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    isLoading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
} 