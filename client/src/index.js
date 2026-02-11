import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './index.css';
import App from './App';

// Envoyer les requêtes API directement vers le serveur (évite les soucis de proxy)
if (process.env.REACT_APP_API_URL) {
  axios.defaults.baseURL = process.env.REACT_APP_API_URL;
}

// Intercepteur pour gérer automatiquement les erreurs 401 (session expirée)
let isLoggingOut = false;

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 avec un token en localStorage = session expirée ou token invalide → déconnecter
    const hasToken = !!localStorage.getItem('token');
    const url = error.config?.url || '';
    const isPublicAuth = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/forgot-password');
    if (error.response?.status === 401 && !isLoggingOut && hasToken && !isPublicAuth) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      window.dispatchEvent(new CustomEvent('session-expired'));
      isLoggingOut = true;
    }
    return Promise.reject(error);
  }
);

const muiTheme = createTheme({
  palette: { mode: 'light', primary: { main: '#667eea' }, secondary: { main: '#764ba2' } },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={muiTheme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
