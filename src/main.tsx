import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress specific Firestore warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('WebChannelConnection') && msg.includes('transport errored')) {
    return; // Ignore this specific warning
  }
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('WebChannelConnection') && msg.includes('transport errored')) {
    return; // Ignore this specific warning
  }
  originalError(...args);
};

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (reason) {
    const msg = typeof reason === 'string' ? reason : (reason.message || String(reason));
    if (msg.includes('WebSocket closed') || msg.includes('problemsToday')) {
      event.preventDefault(); // Stop Vite overlay from showing this benign error
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
