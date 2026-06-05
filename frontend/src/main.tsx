import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext.tsx'
import { remoteLog } from './utils/logger'
import { ErrorBoundary } from './Components/common/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

// Capturar errores globales no manejados
window.addEventListener('error', (event) => {
  remoteLog(`Error Global: ${event.message} en ${event.filename}:${event.lineno}`, { level: 'ERROR', context: 'BROWSER-GLOBAL' });
});

// Capturar promesas rechazadas no manejadas
window.addEventListener('unhandledrejection', (event) => {
  remoteLog(`Promesa no manejada: ${event.reason}`, { level: 'ERROR', context: 'BROWSER-PROMISE' });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  </StrictMode>
)
  