import client from './client';
import type { Stock, CreateStockPayload } from '../types';

export const stocksApi = {
  list: () => client.get<{ total: number; stocks: Stock[] }>('/stocks'),
  get: (ticker: string) => client.get<Stock>(`/stocks/${ticker}`),
  upsert: (payload: CreateStockPayload) => client.post<Stock>('/stocks', payload),
};
