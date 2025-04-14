import { Role } from '@/lib/auth';

export interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
  role: Role;
  clientId: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  description: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

// ダミーユーザーデータ
export const users: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: '管理者',
    password: '$2a$10$r.pTOcrCQeaRoIfGQ4UoL.BjM8FMv69ufZVdgnZUbQB8QMMxGgXQG', // "password"のハッシュ
    role: Role.ADMIN,
    clientId: null,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'client-admin@example.com',
    name: 'クライアント管理者',
    password: '$2a$10$r.pTOcrCQeaRoIfGQ4UoL.BjM8FMv69ufZVdgnZUbQB8QMMxGgXQG', // "password"のハッシュ
    role: Role.CLIENT_ADMIN,
    clientId: '1',
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// ダミークライアントデータ
export const clients: Client[] = [
  {
    id: '1',
    name: 'サンプルクライアント',
    description: 'サンプルのクライアント企業です',
    contactPerson: '担当者名',
    contactEmail: 'contact@example.com',
    contactPhone: '03-1234-5678',
    address: '東京都渋谷区...',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// ダミークエリ関数
export const findUser = (id: string): User | undefined => {
  return users.find(user => user.id === id);
};

export const findUserByEmail = (email: string): User | undefined => {
  return users.find(user => user.email === email);
};

export const findClient = (id: string): Client | undefined => {
  return clients.find(client => client.id === id);
};

export const findAllUsers = (): User[] => {
  return [...users];
};

export const findAllClients = (): Client[] => {
  return [...clients];
};

export const findUsersByClientId = (clientId: string): User[] => {
  return users.filter(user => user.clientId === clientId);
}; 