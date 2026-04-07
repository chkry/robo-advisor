import client from './client';
import type { Order, OrderHistory, CreateOrderPayload, OrderType, OrderStatus } from '../types';

export interface OrderFilters {
  type?: OrderType;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

export const ordersApi = {
  create: (payload: CreateOrderPayload) => client.post<Order>('/orders', payload),
  get: (id: string) => client.get<Order>(`/orders/${id}`),
  history: (filters: OrderFilters = {}) =>
    client.get<OrderHistory>('/orders/history', { params: filters }),
};
