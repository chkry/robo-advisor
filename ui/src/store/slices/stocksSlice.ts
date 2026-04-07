import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { stocksApi } from '../../api/stocks';
import type { Stock, CreateStockPayload } from '../../types';

interface StocksState {
  items: Stock[];
  total: number;
  loading: boolean;
  error: string | null;
  lastUpserted: Stock | null;
}

const initialState: StocksState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  lastUpserted: null,
};

export const fetchStocks = createAsyncThunk('stocks/fetchAll', async () => {
  const res = await stocksApi.list();
  return res.data;
});

export const upsertStock = createAsyncThunk(
  'stocks/upsert',
  async (payload: CreateStockPayload, { rejectWithValue }) => {
    try {
      const res = await stocksApi.upsert(payload);
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      return rejectWithValue(error.response?.data?.error ?? 'Failed to save stock');
    }
  },
);

const stocksSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    clearLastUpserted(state) {
      state.lastUpserted = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.stocks;
        state.total = action.payload.total;
      })
      .addCase(fetchStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load stocks';
      })
      .addCase(upsertStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(upsertStock.fulfilled, (state, action) => {
        state.loading = false;
        state.lastUpserted = action.payload;
        const idx = state.items.findIndex((s) => s.ticker === action.payload.ticker);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        } else {
          state.items.push(action.payload);
          state.total += 1;
        }
      })
      .addCase(upsertStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLastUpserted, clearError } = stocksSlice.actions;
export default stocksSlice.reducer;
