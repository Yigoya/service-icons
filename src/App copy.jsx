import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboard from './components/AdminDashboard';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const queryClient = new QueryClient();
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a2035', // Dark blue
    },
    secondary: {
      main: '#00bcd4', // Cyan
    },
    background: {
      default: '#f4f6f8', // Light gray
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AdminDashboard />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;