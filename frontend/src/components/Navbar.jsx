// Qué hace: Muestra la barra de navegación principal.
// Para qué sirve: Permitir el acceso a las secciones y cerrar la sesión.

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Qué hace: Renderiza los enlaces del sistema y el usuario actual.
// Para qué sirve: Navegar entre las páginas y gestionar la sesión.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Qué hace: Cierra la sesión y redirige al login.
  // Para qué sirve: Salir del sistema de forma segura.
  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Inventario
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/products">
                Productos
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/products?stock=low">
                Stock bajo
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/movements">
                Movimientos
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/categories">
                Categorías
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/users">
                Usuarios
              </Link>
            </li>
          </ul>
          {user && (
            <div className="d-flex align-items-center">
              <span className="navbar-text me-3">{user.nombre}</span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}