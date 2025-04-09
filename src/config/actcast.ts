export interface ActcastGroupConfig {
  apiToken: string;
  groupId: number;
}

export const ACTCAST_GROUPS: ActcastGroupConfig[] = [
  {
    apiToken: 'dUGqz6SwJyrcqQX8QsOD2727eTSQ4A3a',
    groupId: 2581,
  },
  {
    apiToken: '3RxIXlc4z9O3feKP279B6OlDlCI6y42a',
    groupId: 2236,
  },
];

export const ACTCAST_API_BASE_URL = 'https://api.actcast.io/v0'; 