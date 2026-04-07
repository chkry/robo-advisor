import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './store';
import theme from './theme';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import PlaceOrder from './pages/PlaceOrder';
import OrderHistory from './pages/OrderHistory';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/orders/new" element={<PlaceOrder />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
