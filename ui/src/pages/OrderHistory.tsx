import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, Divider, TablePagination, Tooltip, IconButton,
} from '@mui/material';
import { Refresh as RefreshIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchOrders, fetchOrderById, setFilters, setPage, clearSelected } from '../store/slices/ordersSlice';
import { StatusChip, TypeChip } from '../components/shared/StatusChip';
import PageHeader from '../components/shared/PageHeader';
import type { OrderType, OrderStatus } from '../types';

export default function OrderHistory() {
  const dispatch = useAppDispatch();
  const { items, total, filters, loading, selected } = useAppSelector((s) => s.orders);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => { dispatch(fetchOrders(filters)); }, [dispatch, filters]);

  function openDetail(id: string) {
    dispatch(fetchOrderById(id));
    setDetailOpen(true);
  }

  const page = Math.floor((filters.offset ?? 0) / (filters.limit ?? 10));

  return (
    <Box>
      <PageHeader
        title="Order History"
        subtitle="Browse and filter all portfolio orders"
        action={
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={() => dispatch(fetchOrders(filters))} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.type ?? ''}
            label="Type"
            onChange={(e) => dispatch(setFilters({ type: (e.target.value as OrderType) || undefined }))}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="BUY">BUY</MenuItem>
            <MenuItem value="SELL">SELL</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status ?? ''}
            label="Status"
            onChange={(e) => dispatch(setFilters({ status: (e.target.value as OrderStatus) || undefined }))}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="SCHEDULED">Scheduled</MenuItem>
            <MenuItem value="EXECUTED">Executed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell>Stocks</TableCell>
                    <TableCell>Scheduled For</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((order) => (
                    <TableRow key={order.orderId} hover>
                      <TableCell>
                        <Tooltip title={order.orderId}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            {order.orderId.slice(0, 8)}…
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell><TypeChip type={order.type} /></TableCell>
                      <TableCell><StatusChip status={order.status} /></TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>${order.totalAmount.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {order.splits.map((s) => (
                            <Chip key={s.ticker} label={s.ticker} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'rgba(108,142,245,0.1)', color: 'primary.main' }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(order.scheduledExecutionAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(order.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => openDetail(order.orderId)}>
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No orders found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => dispatch(setPage(p))}
            rowsPerPage={filters.limit ?? 10}
            onRowsPerPageChange={(e) => dispatch(setFilters({ limit: parseInt(e.target.value, 10) }))}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); dispatch(clearSelected()); }} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {!selected ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TypeChip type={selected.type} />
                <StatusChip status={selected.status} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                {[
                  { label: 'Order ID', value: selected.orderId },
                  { label: 'Total Amount', value: `$${selected.totalAmount.toLocaleString()}` },
                  { label: 'Scheduled For', value: new Date(selected.scheduledExecutionAt).toLocaleString() },
                  { label: 'Created At', value: new Date(selected.createdAt).toLocaleString() },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: item.label === 'Order ID' ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Splits</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ticker</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell align="right">Dollar Amount</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">Price Used</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selected.splits.map((s) => (
                    <TableRow key={s.ticker} hover>
                      <TableCell>
                        <Chip label={s.ticker} size="small" sx={{ bgcolor: 'rgba(108,142,245,0.12)', color: 'primary.main', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="right">{(s.weight * 100).toFixed(1)}%</TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 700 }}>${s.dollarAmount.toFixed(2)}</Typography></TableCell>
                      <TableCell align="right">{s.shares}</TableCell>
                      <TableCell align="right">${s.priceUsed.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
