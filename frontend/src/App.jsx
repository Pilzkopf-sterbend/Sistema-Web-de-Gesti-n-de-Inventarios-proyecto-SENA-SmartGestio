// Qué hace: Define las rutas y los proveedores de la aplicación.
// Para qué sirve: Conectar las páginas con la autenticación y las alertas.

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AlertProvider } from './hooks/useAlert';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import MovementsPage from './pages/MovementsPage';
import MovementFormPage from './pages/MovementFormPage';
import CategoriesPage from './pages/CategoriesPage';
import UsersPage from './pages/UsersPage';

// Qué hace: Agrupa las rutas públicas y protegidas.
// Para qué sirve: Controlar qué páginas requieren iniciar sesión.
function App() {
  return (
    <BrowserRouter>
      {/* Para qué sirve: Compartir las alertas y la sesión con todas las páginas. */}
      <AlertProvider>
        <AuthProvider>
          <Routes>
            {/* Para qué sirve: Permitir el acceso al login sin autenticación. */}
            <Route path="/login" element={<LoginPage />} />
            {/* Para qué sirve: Proteger las páginas internas con la sesión del usuario. */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/:id/edit" element={<ProductFormPage />} />
              <Route path="/movements" element={<MovementsPage />} />
              <Route path="/movements/new" element={<MovementFormPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
            {/* Para qué sirve: Enviar las rutas desconocidas al login. */}
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </AlertProvider>
    </BrowserRouter>
  );
}

export default App;