import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Typography, Chip, CircularProgress,
  Snackbar, InputAdornment, Alert,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchStocks, upsertStock, clearLastUpserted, clearError } from '../store/slices/stocksSlice';
import PageHeader from '../components/shared/PageHeader';

export default function Stocks() {
  const dispatch = useAppDispatch();
  const { items, loading, error, lastUpserted } = useAppSelector((s) => s.stocks);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ticker: '', name: '', price: '' });
  const [formError, setFormError] = useState<Record<string, string>>({});

  useEffect(() => { dispatch(fetchStocks()); }, [dispatch]);

  const filtered = items.filter(
    (s) => s.ticker.includes(search.toUpperCase()) || s.name.toLowerCase().includes(search.toLowerCase()),
  );

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.ticker) errors.ticker = 'Required';
    else if (!/^[A-Z0-9.^-]+$/i.test(form.ticker)) errors.ticker = 'Invalid ticker format';
    if (!form.name) errors.name = 'Required';
    const price = parseFloat(form.price);
    if (!form.price) errors.price = 'Required';
    else if (isNaN(price) || price <= 0) errors.price = 'Must be > 0';
    setFormError(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    await dispatch(upsertStock({ ticker: form.ticker.toUpperCase(), name: form.name, price: parseFloat(form.price) }));
    setOpen(false);
    setForm({ ticker: '', name: '', price: '' });
  }

  return (
    <Box>
      <PageHeader
        title="Stocks"
        subtitle="Manage registered stocks and their current prices"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<RefreshIcon />} variant="outlined" onClick={() => dispatch(fetchStocks())} disabled={loading}>
              Refresh
            </Button>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
              Add / Update Stock
            </Button>
          </Box>
        }
      />

      <Card>
        <CardContent sx={{ p: 3 }}>
          <TextField
            placeholder="Search by ticker or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 3, width: 320 }}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
            }}
          />

          {loading && !items.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Ticker</TableCell>
                    <TableCell>Company Name</TableCell>
                    <TableCell align="right">Price (USD)</TableCell>
                    <TableCell>Last Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((stock) => (
                    <TableRow key={stock.ticker} hover>
                      <TableCell>
                        <Chip label={stock.ticker} size="small" sx={{ bgcolor: 'rgba(108,142,245,0.12)', color: 'primary.main', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{stock.name}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>${stock.price.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(stock.updatedAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">
                          {search ? 'No results match your search.' : 'No stocks registered yet.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add / Update Stock</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Ticker Symbol"
            value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
            error={!!formError.ticker}
            helperText={formError.ticker ?? 'e.g. AAPL, MSFT'}
            slotProps={{ htmlInput: { maxLength: 10 } }}
            fullWidth
          />
          <TextField
            label="Company Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!formError.name}
            helperText={formError.name}
            fullWidth
          />
          <TextField
            label="Price (USD)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            error={!!formError.price}
            helperText={formError.price}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            }}
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setOpen(false); dispatch(clearError()); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!lastUpserted}
        autoHideDuration={3000}
        onClose={() => dispatch(clearLastUpserted())}
        message={lastUpserted ? `${lastUpserted.ticker} saved — $${lastUpserted.price.toFixed(2)}` : ''}
      />
    </Box>
  );
}
