import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        if (
          registration.active?.scriptURL.includes('dev-sw.js') ||
          registration.installing?.scriptURL.includes('dev-sw.js') ||
          registration.waiting?.scriptURL.includes('dev-sw.js')
        ) {
          registration.unregister().catch(() => {});
        }
      }
    })
    .catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
