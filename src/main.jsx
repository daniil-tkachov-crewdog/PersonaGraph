// Renderer entry point.
// Mounts the React tree into #root and pulls in the global styles. Kept tiny on
// purpose — all real structure begins at <App/>.

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/theme.css';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
