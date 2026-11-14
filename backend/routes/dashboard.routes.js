// Qué hace: Define la ruta del dashboard.
// Para qué sirve: Exponer el resumen general del inventario.

const express = require('express');
const auth = require('../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Para qué sirve: Proteger el resumen con autenticación.
router.use(auth);

// Qué hace: Obtiene las estadísticas del inventario.
// Para qué sirve: Alimentar las tarjetas y la tabla del dashboard.
router.get('/summary', asyncHandler(dashboardController.summary));

module.exports = router;