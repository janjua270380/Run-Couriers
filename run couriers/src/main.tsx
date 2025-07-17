import  { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MapProvider } from './context/MapContext';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MapProvider>
        <App />
      </MapProvider>
    </AuthProvider>
  </StrictMode>
);
 