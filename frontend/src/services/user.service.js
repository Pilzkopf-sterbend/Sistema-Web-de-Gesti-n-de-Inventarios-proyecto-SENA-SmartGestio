// Qué hace: Realiza las peticiones de usuarios al backend.
// Para qué sirve: Consultar, crear, actualizar y desactivar cuentas.

import { http } from './api';

// Qué hace: Obtiene todos los usuarios.
// Para qué sirve: Alimentar la tabla de usuarios.
export async function listUsers() {
  const data = await http.get('/users');
  return data.users;
}

// Qué hace: Crea un usuario.
// Para qué sirve: Registrar una nueva cuenta en el sistema.
export async function createUser(user) {
  const data = await http.post('/users', user);
  return data.user;
}

// Qué hace: Actualiza un usuario.
// Para qué sirve: Cambiar sus datos o contraseña.
export async function updateUser(id, user) {
  const data = await http.put(`/users/${id}`, user);
  return data.user;
}

// Qué hace: Desactiva un usuario.
// Para qué sirve: Retirar el acceso sin borrar su historial.
export async function deactivateUser(id) {
  const data = await http.del(`/users/${id}`);
  return data.user;
}