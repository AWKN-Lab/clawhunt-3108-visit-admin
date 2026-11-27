import React from 'react';
import ReactDOM from 'react-dom/client';
import 'tdesign-react/es/style/index.css';
import App from './App';
import { worker } from './mocks/browser';

// 样品应用只用 MSW mock，不连真实后端。
worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
