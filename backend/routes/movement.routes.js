// Qué hace: Define las rutas de movimientos.
// Para qué sirve: Exponer el registro y la consulta de entradas y salidas.

const express = require('express');
const auth = require('../middleware/auth.middleware');
const movementController = require('../controllers/movement.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Para qué sirve: Proteger todas las rutas de movimientos con autenticación.
router.use(auth);

// Qué hace: Registra una entrada o salida.
// Para qué sirve: Actualizar el stock del producto.
router.post('/', asyncHandler(movementController.create));

// Qué hace: Lista los movimientos con filtros.
// Para qué sirve: Consultar el historial del inventario.
router.get('/', asyncHandler(movementController.list));

module.exports = router;