import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary, { AppError } from './components/ErrorBoundary';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={(_, reset) => <AppError reset={reset} />}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
