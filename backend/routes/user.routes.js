// Qué hace: Define las rutas de usuarios.
// Para qué sirve: Exponer las operaciones de gestión de cuentas.

const express = require('express');
const auth = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Para qué sirve: Proteger todas las rutas de usuarios con autenticación.
router.use(auth);

// Qué hace: Lista los usuarios.
// Para qué sirve: Mostrar las cuentas registradas.
router.get('/', asyncHandler(userController.list));

// Qué hace: Crea un usuario.
// Para qué sirve: Registrar una nueva cuenta.
router.post('/', asyncHandler(userController.create));

// Qué hace: Consulta un usuario por su id.
// Para qué sirve: Ver los datos de una cuenta específica.
router.get('/:id', asyncHandler(userController.getById));

// Qué hace: Actualiza un usuario.
// Para qué sirve: Cambiar sus datos o contraseña.
router.put('/:id', asyncHandler(userController.update));

// Qué hace: Desactiva un usuario.
// Para qué sirve: Retirar el acceso sin borrar su historial.
router.delete('/:id', asyncHandler(userController.remove));

module.exports = router;