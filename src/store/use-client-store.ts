import { create } from 'zustand';
import { Client } from '@/types';

interface ClientState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  createClient: (name: string) => Promise<void>;
  updateClient: (id: string, name: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  isLoading: false,
  error: null,

  fetchClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('クライアントの取得に失敗しました');
      const clients = await response.json();
      set({ clients, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createClient: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('クライアントの作成に失敗しました');
      const newClient = await response.json();
      set((state) => ({
        clients: [...state.clients, newClient],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateClient: async (id: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });
      if (!response.ok) throw new Error('クライアントの更新に失敗しました');
      const updatedClient = await response.json();
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id ? updatedClient : client
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteClient: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('クライアントの削除に失敗しました');
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
})); 