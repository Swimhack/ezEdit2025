import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import AppRouter from './Router'

// Add diagnostic logging to help debug render issues
const rootElement = document.getElementById('root');
console.log('Root element found:', rootElement);

try {
  if (!rootElement) throw new Error('Root element not found');
  
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root created');
  
  root.render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
  console.log('React app rendered');
} catch (error) {
  console.error('Error rendering React application:', error);
  // Display a simple error message if React fails to render
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-bottom: 16px;">Application Error</h2>
          <p style="margin-bottom: 16px;">There was a problem loading the application.</p>
          <button onclick="window.location.reload()" style="background: #0d6efd; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            Reload page
          </button>
        </div>
      </div>
    `;
  }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    location.reload();
  });
}
