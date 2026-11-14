// Qué hace: Define la estructura común de las páginas.
// Para qué sirve: Mantener la barra de navegación y las alertas en todas las rutas.

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import AlertMessage from './AlertMessage';

// Qué hace: Renderiza la barra, las alertas y el contenido de la ruta.
// Para qué sirve: Evitar repetir la estructura en cada página.
export default function Layout() {
  return (
    <div>
      <Navbar />
      <div className="container">
        <AlertMessage />
        <Outlet />
      </div>
    </div>
  );
}