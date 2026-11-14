// Qué hace: Atiende las peticiones HTTP de usuarios.
// Para qué sirve: Conectar las rutas con el servicio de gestión de cuentas.

const userService = require('../services/user.service');

// Qué hace: Lista todos los usuarios.
// Para qué sirve: Alimentar la tabla de usuarios del panel administrativo.
async function list(req, res) {
  const users = await userService.listUsers();
  res.json({ users });
}

// Qué hace: Obtiene un usuario por su id.
// Para qué sirve: Consultar una cuenta específica.
async function getById(req, res) {
  const user = await userService.getUserById(req.params.id);
  res.json({ user });
}

// Qué hace: Crea un usuario con los datos recibidos.
// Para qué sirve: Registrar nuevas cuentas desde el panel.
async function create(req, res) {
  const user = await userService.createUser(req.body);
  res.status(201).json({ user });
}

// Qué hace: Actualiza un usuario existente.
// Para qué sirve: Cambiar sus datos sin crear otra cuenta.
async function update(req, res) {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json({ user });
}

// Qué hace: Desactiva un usuario en lugar de eliminarlo.
// Para qué sirve: Retirar el acceso conservando su historial.
async function remove(req, res) {
  // Para qué sirve: Evitar que el usuario actual se desactive a sí mismo.
  const user = await userService.deactivateUser(req.params.id, req.user.id);
  res.json({ user });
}

module.exports = { list, getById, create, update, remove };