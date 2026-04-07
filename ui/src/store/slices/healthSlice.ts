import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { healthApi } from '../../api/health';
import type { HealthStatus } from '../../types';

interface HealthState {
  data: HealthStatus | null;
  loading: boolean;
  error: string | null;
}

const initialState: HealthState = { data: null, loading: false, error: null };

export const fetchHealth = createAsyncThunk('health/fetch', async () => {
  const res = await healthApi.get();
  return res.data;
});

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHealth.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHealth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'API unreachable';
      });
  },
});

export default healthSlice.reducer;
