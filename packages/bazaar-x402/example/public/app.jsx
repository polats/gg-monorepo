/**
 * Bazaar x402 Example - React Entry Point
 * 
 * Initializes the React application with Solana wallet integration.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SolanaWalletProvider } from './components/wallet-provider.jsx';
import { App } from './components/app.jsx';

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html has a div with id="root"');
}

// Create React root and render app
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </React.StrictMode>
);
