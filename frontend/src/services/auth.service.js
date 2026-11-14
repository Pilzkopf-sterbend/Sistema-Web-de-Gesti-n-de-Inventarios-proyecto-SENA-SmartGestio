// Qué hace: Gestiona la sesión del usuario en el navegador.
// Para qué sirve: Guardar, recuperar y eliminar el token y los datos del usuario.

import { http } from './api';

// Qué hace: Envía las credenciales y guarda la sesión.
// Para qué sirve: Mantener al usuario autenticado entre recargas de la página.
export async function login(email, password) {
  const data = await http.post('/auth/login', { email, password });
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

// Qué hace: Elimina el token y los datos del usuario.
// Para qué sirve: Cerrar la sesión de forma segura.
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Qué hace: Recupera el usuario guardado en el navegador.
// Para qué sirve: Restaurar la sesión al cargar la aplicación.
export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

// Qué hace: Obtiene el token de la sesión actual.
// Para qué sirve: Consultar si el usuario tiene una sesión iniciada.
export function getToken() {
  return localStorage.getItem('token');
}