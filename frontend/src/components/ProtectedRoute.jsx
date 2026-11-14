// Qué hace: Protege las rutas que requieren iniciar sesión.
// Para qué sirve: Evitar que usuarios sin sesión accedan al sistema.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Qué hace: Comprueba si hay un usuario autenticado.
// Para qué sirve: Mostrar la ruta protegida o redirigir al login.
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  // Para qué sirve: Enviar al login cuando no existe una sesión activa.
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}