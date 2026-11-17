// Qué hace: Muestra la barra de navegación principal.
// Para qué sirve: Permitir el acceso a las secciones y cerrar la sesión.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Qué hace: Renderiza los enlaces del sistema y el usuario actual.
// Para qué sirve: Navegar entre las páginas y gestionar la sesión.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Qué hace: Abre o cierra el menú en pantallas pequeñas.
  // Para qué sirve: Permitir la navegación sin depender del JavaScript de Bootstrap.
  function toggleMenu() {
    setMenuOpen((open) => !open);
  }

  // Qué hace: Cierra el menú móvil.
  // Para qué sirve: Liberar la pantalla después de elegir una opción.
  function closeMenu() {
    setMenuOpen(false);
  }

  // Qué hace: Cierra la sesión y redirige al login.
  // Para qué sirve: Salir del sistema de forma segura.
  function handleLogout() {
    closeMenu();
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/" onClick={closeMenu}>
          Inventario
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={toggleMenu}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div
          className={`collapse navbar-collapse${menuOpen ? ' show' : ''}`}
          id="navbarNav"
        >
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={closeMenu}>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/products" onClick={closeMenu}>
                Productos
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/scan" onClick={closeMenu}>
                Escanear QR
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link"
                to="/products?stock=low"
                onClick={closeMenu}
              >
                Stock bajo
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/movements" onClick={closeMenu}>
                Movimientos
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/categories" onClick={closeMenu}>
                Categorías
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/users" onClick={closeMenu}>
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