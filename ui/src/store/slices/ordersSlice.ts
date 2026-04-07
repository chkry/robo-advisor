import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ordersApi, type OrderFilters } from '../../api/orders';
import type { Order, OrderHistory, CreateOrderPayload } from '../../types';

interface OrdersState {
  items: Order[];
  total: number;
  page: { offset: number; limit: number; count: number };
  filters: OrderFilters;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  lastCreated: Order | null;
  selected: Order | null;
}

const initialState: OrdersState = {
  items: [],
  total: 0,
  page: { offset: 0, limit: 10, count: 0 },
  filters: { limit: 10, offset: 0 },
  loading: false,
  submitting: false,
  error: null,
  lastCreated: null,
  selected: null,
};

export const fetchOrders = createAsyncThunk(
  'orders/fetchHistory',
  async (filters: OrderFilters) => {
    const res = await ordersApi.history(filters);
    return res.data;
  },
);

export const fetchOrderById = createAsyncThunk('orders/fetchById', async (id: string) => {
  const res = await ordersApi.get(id);
  return res.data;
});

export const createOrder = createAsyncThunk(
  'orders/create',
  async (payload: CreateOrderPayload, { rejectWithValue }) => {
    try {
      const res = await ordersApi.create(payload);
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; details?: unknown } } };
      const data = error.response?.data;
      return rejectWithValue(data?.error ?? 'Failed to create order');
    }
  },
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload, offset: 0 };
    },
    setPage(state, action) {
      state.filters.offset = action.payload * (state.filters.limit ?? 10);
    },
    clearLastCreated(state) {
      state.lastCreated = null;
    },
    clearSelected(state) {
      state.selected = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as OrderHistory;
        state.items = payload.orders;
        state.total = payload.total;
        state.page = payload.page;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load orders';
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Order not found';
      })
      .addCase(createOrder.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.submitting = false;
        state.lastCreated = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, setPage, clearLastCreated, clearSelected, clearError } =
  ordersSlice.actions;
export default ordersSlice.reducer;
