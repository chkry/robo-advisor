import { Chip } from '@mui/material';
import type { OrderStatus, OrderType } from '../../types';

export function StatusChip({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { color: 'warning' | 'info' | 'success'; label: string }> = {
    PENDING:   { color: 'warning', label: 'Pending' },
    SCHEDULED: { color: 'info',    label: 'Scheduled' },
    EXECUTED:  { color: 'success', label: 'Executed' },
  };
  const { color, label } = map[status];
  return <Chip label={label} color={color} size="small" variant="outlined" />;
}

export function TypeChip({ type }: { type: OrderType }) {
  return (
    <Chip
      label={type}
      size="small"
      sx={{
        fontWeight: 700,
        bgcolor: type === 'BUY' ? 'rgba(76,175,80,0.12)' : 'rgba(239,83,80,0.12)',
        color: type === 'BUY' ? 'success.main' : 'error.main',
        border: '1px solid',
        borderColor: type === 'BUY' ? 'success.main' : 'error.main',
      }}
    />
  );
}
