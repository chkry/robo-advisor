import { configureStore } from '@reduxjs/toolkit';
import stocksReducer from './slices/stocksSlice';
import ordersReducer from './slices/ordersSlice';
import healthReducer from './slices/healthSlice';

export const store = configureStore({
  reducer: {
    stocks: stocksReducer,
    orders: ordersReducer,
    health: healthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
