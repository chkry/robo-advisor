import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6C8EF5' },
    secondary: { main: '#4ECDC4' },
    success: { main: '#4CAF50' },
    error: { main: '#EF5350' },
    warning: { main: '#FFA726' },
    background: {
      default: '#0A0E1A',
      paper: '#111827',
    },
    divider: 'rgba(255,255,255,0.06)',
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 20 },
        contained: {
          background: 'linear-gradient(135deg, #6C8EF5 0%, #4C6EF5 100%)',
          boxShadow: '0 4px 14px rgba(108,142,245,0.3)',
          '&:hover': { boxShadow: '0 6px 20px rgba(108,142,245,0.45)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 6 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#94A3B8',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: '#0D1320',
        },
      },
    },
  },
});

export default theme;
