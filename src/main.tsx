import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './offline/serviceWorker';

// Register offline service worker for frontline workers safely
registerServiceWorker().catch(err => console.debug('[SW] Registration note:', err));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

