import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a2e',
          color: '#f0e6d3',
          border: '1px solid rgba(255,117,24,0.3)',
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '0.9rem',
        },
        success: { iconTheme: { primary: '#39ff14', secondary: '#0a0a0f' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0a0f' } },
      }}
    />
  </React.StrictMode>
);
