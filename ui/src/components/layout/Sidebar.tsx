import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Chip,
} from '@mui/material';
import { ShowChart, ReceiptLong, AddCircleOutlined, MonitorHeart } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

const DRAWER_WIDTH = 240;

const NAV = [
  { label: 'Dashboard', icon: <MonitorHeart />, path: '/' },
  { label: 'Stocks', icon: <ShowChart />, path: '/stocks' },
  { label: 'Place Order', icon: <AddCircleOutlined />, path: '/orders/new' },
  { label: 'Order History', icon: <ReceiptLong />, path: '/orders' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const health = useAppSelector((s) => s.health.data);

  return (
    <Drawer
      variant="permanent"
      sx={{ width: DRAWER_WIDTH, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            background: 'linear-gradient(135deg,#6C8EF5,#4ECDC4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
          }}
        >
          RoboAdvisor
        </Typography>
        <Typography variant="caption" color="text.secondary">Order Management</Typography>
      </Box>

      <Divider />

      <List sx={{ px: 1, pt: 1 }}>
        {NAV.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={active}
              sx={{
                borderRadius: 2, mb: 0.5,
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(108,142,245,0.15) 0%, rgba(78,205,196,0.08) 100%)',
                  borderLeft: '3px solid',
                  borderLeftColor: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                  '& .MuiListItemText-primary': { color: 'primary.main', fontWeight: 700 },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={health ? 'API Online' : 'API Offline'}
            color={health ? 'success' : 'error'}
            sx={{ fontSize: '0.7rem' }}
          />
          {health && (
            <Typography variant="caption" color="text.secondary">
              v{health.version}
            </Typography>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
