import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Button, TextField, Typography, Alert,
  MenuItem, Select, FormControl, InputLabel, Divider, Chip,
  CircularProgress, IconButton, Tooltip, InputAdornment, Table,
  TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent,
} from '@mui/material';
import { Add as AddIcon, DeleteOutlined as DeleteOutlineIcon, InfoOutlined as InfoOutlinedIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createOrder, clearLastCreated, clearError } from '../store/slices/ordersSlice';
import { fetchStocks } from '../store/slices/stocksSlice';
import PageHeader from '../components/shared/PageHeader';
import { TypeChip, StatusChip } from '../components/shared/StatusChip';
import type { OrderType } from '../types';

interface PortfolioRow {
  _key: number;
  ticker: string;
  weight: number;
  marketPrice?: number;
}

let _counter = 0;
const newRow = (): PortfolioRow => ({ _key: ++_counter, ticker: '', weight: 0, marketPrice: undefined });

export default function PlaceOrder() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: stocks } = useAppSelector((s) => s.stocks);
  const { submitting, error, lastCreated } = useAppSelector((s) => s.orders);

  const [type, setType] = useState<OrderType>('BUY');
  const [totalAmount, setTotalAmount] = useState('');
  const [rows, setRows] = useState<PortfolioRow[]>([newRow()]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => { dispatch(fetchStocks()); }, [dispatch]);
  useEffect(() => { if (lastCreated) setSuccessOpen(true); }, [lastCreated]);

  const totalWeight = rows.reduce((s, r) => s + (r.weight || 0), 0);
  const weightOk = Math.abs(totalWeight - 1) <= 0.001;

  function updateRow(key: number, field: keyof Omit<PortfolioRow, '_key'>, val: string) {
    setRows((prev) => prev.map((r) => {
      if (r._key !== key) return r;
      if (field === 'ticker') return { ...r, ticker: val.toUpperCase() };
      if (field === 'weight') return { ...r, weight: val === '' ? 0 : parseFloat(val) };
      if (field === 'marketPrice') return { ...r, marketPrice: val === '' ? undefined : parseFloat(val) };
      return r;
    }));
  }

  function addRow() { setRows((p) => [...p, newRow()]); }
  function removeRow(key: number) { setRows((p) => p.filter((r) => r._key !== key)); }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const amount = parseFloat(totalAmount);
    if (!totalAmount || isNaN(amount) || amount <= 0) errs.totalAmount = 'Must be > 0';
    if (rows.length === 0) errs.portfolio = 'Add at least one stock';
    const tickers = rows.map((r) => r.ticker);
    const dupes = tickers.filter((t, i) => tickers.indexOf(t) !== i);
    if (dupes.length) errs.portfolio = `Duplicate tickers: ${[...new Set(dupes)].join(', ')}`;
    rows.forEach((r, i) => {
      if (!r.ticker) errs[`ticker_${i}`] = 'Required';
      if (!r.weight || r.weight <= 0 || r.weight > 1) errs[`weight_${i}`] = '0 < w ≤ 1';
      if (r.marketPrice !== undefined && r.marketPrice <= 0) errs[`price_${i}`] = '> 0';
    });
    if (!weightOk) errs.portfolio = `Weights sum to ${totalWeight.toFixed(4)}, must equal 1.0`;
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    dispatch(clearError());
    await dispatch(createOrder({
      portfolio: rows.map((r) => ({
        ticker: r.ticker,
        weight: r.weight,
        ...(r.marketPrice !== undefined ? { marketPrice: r.marketPrice } : {}),
      })),
      totalAmount: parseFloat(totalAmount),
      type,
    }));
  }

  function handleSuccessClose() {
    setSuccessOpen(false);
    dispatch(clearLastCreated());
    navigate('/orders');
  }

  return (
    <Box>
      <PageHeader title="Place Order" subtitle="Split a portfolio investment across multiple stocks" />

      <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 360px' }, gap: 3, alignItems: 'start' }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <FormControl size="small" sx={{ width: 140 }}>
                <InputLabel>Order Type</InputLabel>
                <Select value={type} label="Order Type" onChange={(e) => setType(e.target.value as OrderType)}>
                  <MenuItem value="BUY">BUY</MenuItem>
                  <MenuItem value="SELL">SELL</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Total Amount"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                type="number"
                slotProps={{
                  input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                }}
                error={!!formErrors.totalAmount}
                helperText={formErrors.totalAmount}
                sx={{ flex: 1 }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">Portfolio Allocation</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  label={`Σ ${totalWeight.toFixed(4)}`}
                  color={weightOk ? 'success' : 'error'}
                  variant="outlined"
                />
                <Tooltip title="All weights must sum to exactly 1.0">
                  <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </Tooltip>
              </Box>
            </Box>

            {formErrors.portfolio && <Alert severity="error" sx={{ mb: 2 }}>{formErrors.portfolio}</Alert>}

            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Ticker</TableCell>
                  <TableCell>Weight</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Market Price
                      <Tooltip title="Optional — overrides DB price. Leave blank to use registered stock price.">
                        <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={row._key}>
                    <TableCell sx={{ pl: 0 }}>
                      {stocks.length > 0 ? (
                        <Select
                          value={row.ticker}
                          onChange={(e) => updateRow(row._key, 'ticker', e.target.value)}
                          size="small"
                          displayEmpty
                          sx={{ width: 130 }}
                          error={!!formErrors[`ticker_${i}`]}
                        >
                          <MenuItem value=""><em>Select</em></MenuItem>
                          {stocks.map((s) => (
                            <MenuItem key={s.ticker} value={s.ticker}>
                              {s.ticker} — ${s.price.toFixed(2)}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <TextField
                          value={row.ticker}
                          onChange={(e) => updateRow(row._key, 'ticker', e.target.value)}
                          placeholder="AAPL"
                          slotProps={{ htmlInput: { maxLength: 10 } }}
                          error={!!formErrors[`ticker_${i}`]}
                          sx={{ width: 110 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.weight || ''}
                        onChange={(e) => updateRow(row._key, 'weight', e.target.value)}
                        type="number"
                        placeholder="0.60"
                        error={!!formErrors[`weight_${i}`]}
                        slotProps={{ htmlInput: { min: 0, max: 1, step: 0.01 } }}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.marketPrice ?? ''}
                        onChange={(e) => updateRow(row._key, 'marketPrice', e.target.value)}
                        type="number"
                        placeholder="auto"
                        error={!!formErrors[`price_${i}`]}
                        slotProps={{
                          input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                        }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => removeRow(row._key)} disabled={rows.length === 1} color="error">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button startIcon={<AddIcon />} onClick={addRow} size="small" variant="outlined" disabled={rows.length >= 50}>
              Add Row
            </Button>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" size="large" onClick={handleSubmit} disabled={submitting} sx={{ flex: 1 }}>
                {submitting ? <CircularProgress size={22} /> : `Place ${type} Order`}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/orders')}>Cancel</Button>
            </Box>
          </CardContent>
        </Card>

        {/* Preview panel */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Order Preview</Typography>
              <Divider sx={{ mb: 2 }} />
              {rows.filter((r) => r.ticker && r.weight > 0).map((row) => {
                const amount = parseFloat(totalAmount) || 0;
                const dollar = amount * row.weight;
                const stock = stocks.find((s) => s.ticker === row.ticker);
                const price = row.marketPrice ?? stock?.price ?? 100;
                return (
                  <Box key={row._key} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip label={row.ticker || '—'} size="small" sx={{ bgcolor: 'rgba(108,142,245,0.12)', color: 'primary.main', fontWeight: 700 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>${dollar.toFixed(2)}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {(row.weight * 100).toFixed(1)}% · {price > 0 ? (dollar / price).toFixed(3) : '—'} shares @ ${price.toFixed(2)}
                    </Typography>
                  </Box>
                );
              })}
              {rows.filter((r) => r.ticker && r.weight > 0).length === 0 && (
                <Typography variant="caption" color="text.secondary">Add stocks to see preview</Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Price Resolution</Typography>
              <Typography variant="caption" color="text.secondary">
                For each stock, the price is resolved in this order:
              </Typography>
              <Box component="ol" sx={{ mt: 1, pl: 2, '& li': { fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 } }}>
                <li>Manual Market Price field (if entered)</li>
                <li>Stock price from database (if registered)</li>
                <li>Server default fixed price ($100)</li>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Success dialog */}
      <Dialog open={successOpen} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" /> Order Placed Successfully
        </DialogTitle>
        <DialogContent>
          {lastCreated && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TypeChip type={lastCreated.type} />
                <StatusChip status={lastCreated.status} />
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Order ID:</strong> {lastCreated.orderId}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Total:</strong> ${lastCreated.totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Scheduled:</strong> {new Date(lastCreated.scheduledExecutionAt).toLocaleString()}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Splits</Typography>
              {lastCreated.splits.map((s) => (
                <Box key={s.ticker} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Chip label={s.ticker} size="small" sx={{ bgcolor: 'rgba(108,142,245,0.12)', color: 'primary.main', fontWeight: 700 }} />
                  <Typography variant="caption" color="text.secondary">
                    ${s.dollarAmount.toFixed(2)} · {s.shares} shares @ ${s.priceUsed}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <Box sx={{ p: 3, pt: 0, display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={handleSuccessClose} fullWidth>View Order History</Button>
          <Button variant="outlined" onClick={() => { setSuccessOpen(false); dispatch(clearLastCreated()); setRows([newRow()]); setTotalAmount(''); }} fullWidth>
            Place Another
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
