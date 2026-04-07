export type OrderType = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'SCHEDULED' | 'EXECUTED';

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockAllocation {
  ticker: string;
  weight: number;
  marketPrice?: number;
}

export interface OrderLineItem {
  ticker: string;
  weight: number;
  dollarAmount: number;
  shares: number;
  priceUsed: number;
}

export interface Order {
  orderId: string;
  type: OrderType;
  status: OrderStatus;
  totalAmount: number;
  scheduledExecutionAt: string;
  createdAt: string;
  splits: OrderLineItem[];
}

export interface OrderHistory {
  total: number;
  page: { offset: number; limit: number; count: number };
  orders: Order[];
}

export interface CreateStockPayload {
  ticker: string;
  name: string;
  price: number;
}

export interface CreateOrderPayload {
  portfolio: StockAllocation[];
  totalAmount: number;
  type: OrderType;
}

export interface HealthStatus {
  status: 'ok';
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
}
