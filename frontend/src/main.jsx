// Qué hace: Inicia la aplicación React en el navegador.
// Para qué sirve: Cargar Bootstrap, los estilos y el componente principal.

import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

// Para qué sirve: Crear la raíz de React dentro del elemento HTML principal.
const root = ReactDOM.createRoot(document.getElementById('root'));
// Para qué sirve: Renderizar la aplicación y activar las comprobaciones de React.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);