// Renderer entry point.
// Mounts the React tree into #root and pulls in the global styles. Kept tiny on
// purpose — all real structure begins at <App/>.

import React from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted Inter (weights used across the UI) — bundled by Vite so the
// desktop app renders the intended type with no runtime network dependency.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import App from './App.jsx';
import './styles/theme.css';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
