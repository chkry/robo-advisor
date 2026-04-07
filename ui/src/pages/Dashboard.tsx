import { useEffect } from 'react';
import { Grid, Card, CardContent, Box, Typography, Divider, Chip, LinearProgress } from '@mui/material';
import { ShowChart, ReceiptLong, AccessTime, CheckCircleOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchHealth } from '../store/slices/healthSlice';
import { fetchStocks } from '../store/slices/stocksSlice';
import { fetchOrders } from '../store/slices/ordersSlice';
import StatCard from '../components/shared/StatCard';
import { TypeChip, StatusChip } from '../components/shared/StatusChip';
import PageHeader from '../components/shared/PageHeader';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const health = useAppSelector((s) => s.health.data);
  const { items: stocks, total: stockTotal } = useAppSelector((s) => s.stocks);
  const { items: orders, total: orderTotal } = useAppSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchHealth());
    dispatch(fetchStocks());
    dispatch(fetchOrders({ limit: 5, offset: 0 }));
  }, [dispatch]);

  const scheduled = orders.filter((o) => o.status === 'SCHEDULED').length;

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Real-time portfolio order management overview" />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Stocks" value={stockTotal} icon={<ShowChart />} subtitle="Registered in DB" color="#6C8EF5" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Orders" value={orderTotal} icon={<ReceiptLong />} subtitle="All time" color="#4ECDC4" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Scheduled" value={scheduled} icon={<AccessTime />} subtitle="Pending execution" color="#FFA726" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="API Status"
            value={health ? 'Online' : 'Offline'}
            icon={<CheckCircleOutlined />}
            subtitle={health ? `Uptime ${Math.floor(health.uptime)}s` : 'Cannot connect'}
            color={health ? '#4CAF50' : '#EF5350'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Recent Orders</Typography>
              <Divider sx={{ mb: 2 }} />
              {orders.length === 0 ? (
                <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: 'center' }}>
                  No orders yet. Place your first order.
                </Typography>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <Box
                    key={order.orderId}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                        <TypeChip type={order.type} />
                        <StatusChip status={order.status} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ${order.totalAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.splits.length} stock{order.splits.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Registered Stocks</Typography>
              <Divider sx={{ mb: 2 }} />
              {stocks.length === 0 ? (
                <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: 'center' }}>
                  No stocks registered yet.
                </Typography>
              ) : (
                stocks.slice(0, 8).map((stock) => (
                  <Box
                    key={stock.ticker}
                    sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box>
                      <Chip
                        label={stock.ticker}
                        size="small"
                        sx={{ bgcolor: 'rgba(108,142,245,0.12)', color: 'primary.main', fontWeight: 700, mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">{stock.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>${stock.price.toFixed(2)}</Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {health && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>API Health</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  {[
                    { label: 'Status', value: health.status.toUpperCase() },
                    { label: 'Version', value: `v${health.version}` },
                    { label: 'Environment', value: health.environment },
                    { label: 'Uptime', value: `${Math.floor(health.uptime)}s` },
                    { label: 'Last checked', value: new Date(health.timestamp).toLocaleTimeString() },
                  ].map((item) => (
                    <Grid size={{ xs: 6, sm: 4, md: 2 }} key={item.label}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                    </Grid>
                  ))}
                </Grid>
                <LinearProgress variant="determinate" value={100} color="success" sx={{ mt: 2, borderRadius: 1, height: 4 }} />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
