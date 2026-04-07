import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 240;

export default function AppLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, ml: `${DRAWER_WIDTH}px`, p: 4, maxWidth: `calc(100vw - ${DRAWER_WIDTH}px)` }}>
        <Outlet />
      </Box>
    </Box>
  );
}
