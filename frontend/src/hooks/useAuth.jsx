// Qué hace: Comparte el usuario autenticado en toda la aplicación.
// Para qué sirve: Permitir que cualquier componente consulte o cierre la sesión.

import { createContext, useContext, useState, useCallback } from 'react';
import {
  login as loginService,
  logout as logoutService,
  getStoredUser
} from '../services/auth.service';

const AuthContext = createContext(null);

// Qué hace: Guarda el usuario actual y expone las acciones de sesión.
// Para qué sirve: Mantener el estado de autenticación disponible en las rutas.
export function AuthProvider({ children }) {
  // Para qué sirve: Recuperar la sesión guardada al recargar la página.
  const [user, setUser] = useState(getStoredUser());

  // Qué hace: Inicia sesión con el correo y la contraseña.
  // Para qué sirve: Actualizar el usuario autenticado en el contexto.
  const login = useCallback(async (email, password) => {
    const loggedUser = await loginService(email, password);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  // Qué hace: Cierra la sesión del usuario.
  // Para qué sirve: Eliminar la sesión y volver al estado sin autenticación.
  const logout = useCallback(() => {
    logoutService();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Qué hace: Permite consumir el contexto de autenticación.
// Para qué sirve: Usar el usuario y las acciones de sesión en otros componentes.
export function useAuth() {
  return useContext(AuthContext);
}