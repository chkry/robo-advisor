import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: string;
}

export default function StatCard({ title, value, subtitle, icon, color = '#6C8EF5' }: Props) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block' }}
            >
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>{value}</Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: `${color}1A`, color,
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
