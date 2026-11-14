// Qué hace: Define las rutas de categorías.
// Para qué sirve: Exponer las operaciones de organización de productos.

const express = require('express');
const auth = require('../middleware/auth.middleware');
const categoryController = require('../controllers/category.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Para qué sirve: Proteger todas las rutas de categorías con autenticación.
router.use(auth);

// Qué hace: Lista las categorías.
// Para qué sirve: Alimentar las tablas y los formularios.
router.get('/', asyncHandler(categoryController.list));

// Qué hace: Crea una categoría.
// Para qué sirve: Agregar una nueva agrupación de productos.
router.post('/', asyncHandler(categoryController.create));

// Qué hace: Consulta una categoría por su id.
// Para qué sirve: Ver los datos de una categoría específica.
router.get('/:id', asyncHandler(categoryController.getById));

// Qué hace: Actualiza una categoría.
// Para qué sirve: Corregir su nombre o descripción.
router.put('/:id', asyncHandler(categoryController.update));

// Qué hace: Elimina una categoría sin productos.
// Para qué sirve: Mantener limpio el catálogo de categorías.
router.delete('/:id', asyncHandler(categoryController.remove));

module.exports = router;