export type OrderType = 'BUY' | 'SELL';

export type OrderStatus = 'PENDING' | 'SCHEDULED' | 'EXECUTED';

export interface StockAllocation {
  ticker: string;
  weight: number;
  marketPrice?: number;
}

export interface CreateOrderRequest {
  portfolio: StockAllocation[];
  totalAmount: number;
  type: OrderType;
}

export interface OrderLineItem {
  ticker: string;
  dollarAmount: number;
  shares: number;
  priceUsed: number;
  weight: number;
}

export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  portfolio: StockAllocation[];
  totalAmount: number;
  splits: OrderLineItem[];
  scheduledExecutionAt: Date;
  createdAt: Date;
}

export interface CreateOrderResponse {
  orderId: string;
  type: OrderType;
  status: OrderStatus;
  totalAmount: number;
  scheduledExecutionAt: string;
  createdAt: string;
  splits: OrderLineItem[];
}

export interface OrderHistoryResponse {
  total: number;
  orders: CreateOrderResponse[];
}

export interface HealthResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
  timestamp: string;
  path: string;
}
