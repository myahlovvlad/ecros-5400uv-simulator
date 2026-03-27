/**
 * Точка входа приложения ЭКРОС-5400УФ Симулятор
 * Clean Architecture
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/styles.css';
import { Ecros5400UvSimulator } from './src/index.js';

// Находим корневой элемент
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure you have a <div id="root"></div> in your HTML.'
  );
}

// Рендерим приложение
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Ecros5400UvSimulator />
  </React.StrictMode>
);
