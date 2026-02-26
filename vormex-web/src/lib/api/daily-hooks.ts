import apiClient from './client';

export interface DailyHook {
  id: string;
  type: string;
  title: string;
  action: { label: string; href: string };
  emoji: string;
  priority: number;
  data?: Record<string, unknown>;
}

export const dailyHooksAPI = {
  getHooks: async (): Promise<{ hooks: DailyHook[]; date: string }> => {
    return apiClient.get('/daily-hooks') as any;
  },
};
