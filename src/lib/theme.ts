import { createTheme } from '@mui/material/styles'

export const masaryTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#10B981', contrastText: '#0D1117' },
    secondary: { main: '#F59E0B', contrastText: '#0D1117' },
    error:     { main: '#EF4444' },
    warning:   { main: '#F59E0B' },
    success:   { main: '#10B981' },
    background: { default: '#0D1117', paper: '#161B22' },
    text: { primary: '#F0F6FC', secondary: '#8B949E', disabled: '#484F58' },
    divider: 'rgba(255,255,255,0.06)',
  },
  typography: {
    fontFamily: '"Roboto", system-ui, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 700 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', color: '#8B949E' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: '#0D1117', scrollbarWidth: 'thin' } },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 0 16px rgba(16,185,129,0.35)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(16,185,129,0.5)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10B981' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' },
      },
    },
  },
})
