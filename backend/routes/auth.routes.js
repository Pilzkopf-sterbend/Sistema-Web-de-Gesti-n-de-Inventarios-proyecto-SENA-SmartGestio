// Qué hace: Define las rutas de autenticación.
// Para qué sirve: Exponer el inicio de sesión y la consulta del usuario actual.

const express = require('express');
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Qué hace: Recibe las credenciales del usuario.
// Para qué sirve: Permitir el inicio de sesión y obtener el token.
router.post('/login', asyncHandler(authController.login));

// Qué hace: Consulta el usuario autenticado.
// Para qué sirve: Mantener actualizada la sesión en el frontend.
router.get('/me', auth, asyncHandler(authController.me));

module.exports = router;