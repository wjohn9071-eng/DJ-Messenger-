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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
