// Qué hace: Gestiona las operaciones de los usuarios.
// Para qué sirve: Centralizar las validaciones y la seguridad de las cuentas.

const mongoose = require('mongoose');
const User = require('../models/user.model');
const { ApiError } = require('../utils/apiError');

// Para qué sirve: Definir la longitud mínima aceptada para una contraseña.
const MIN_PASSWORD_LENGTH = 6;

// Qué hace: Obtiene todos los usuarios ordenados por fecha de creación.
// Para qué sirve: Mostrar la lista de usuarios en el panel administrativo.
async function listUsers() {
  const users = await User.find({}).sort({ createdAt: -1 });
  return users.map((user) => user.toSafeObject());
}

// Qué hace: Busca un usuario por su id.
// Para qué sirve: Consultar o actualizar una cuenta específica.
async function getUserById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Usuario no encontrado');
  }
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }
  return user.toSafeObject();
}

// Qué hace: Crea un usuario con contraseña cifrada.
// Para qué sirve: Registrar nuevas cuentas con una contraseña segura.
async function createUser({ nombre, email, password }) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(
      400,
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
    );
  }
  const user = new User({ nombre, email, passwordHash: password });
  await user.save();
  return user.toSafeObject();
}

// Qué hace: Actualiza los datos de un usuario.
// Para qué sirve: Cambiar nombre, correo o contraseña sin crear otra cuenta.
async function updateUser(id, { nombre, email, password }) {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }
  if (nombre !== undefined) {
    user.nombre = nombre;
  }
  if (email !== undefined) {
    user.email = email;
  }
  if (password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ApiError(
        400,
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
      );
    }
    user.passwordHash = password;
  }
  await user.save();
  return user.toSafeObject();
}

// Qué hace: Desactiva un usuario sin eliminarlo.
// Para qué sirve: Quitar el acceso sin perder el historial asociado.
async function deactivateUser(id, currentUserId) {
  // Para qué sirve: Evitar que el administrador se bloquee a sí mismo.
  if (id === currentUserId.toString()) {
    throw new ApiError(400, 'No puedes desactivar tu propia cuenta');
  }
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }
  user.activo = false;
  await user.save();
  return user.toSafeObject();
}

module.exports = { listUsers, getUserById, createUser, updateUser, deactivateUser };