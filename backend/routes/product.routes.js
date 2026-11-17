// Qué hace: Define las rutas de productos.
// Para qué sirve: Exponer las operaciones del inventario.

const express = require('express');
const auth = require('../middleware/auth.middleware');
const productController = require('../controllers/product.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Para qué sirve: Proteger todas las rutas de productos con autenticación.
router.use(auth);

// Qué hace: Lista los productos con filtros.
// Para qué sirve: Consultar el inventario por texto, categoría o stock bajo.
router.get('/', asyncHandler(productController.list));

// Qué hace: Crea un producto.
// Para qué sirve: Registrar un nuevo artículo.
router.post('/', asyncHandler(productController.create));

// Qué hace: Consulta un producto activo por su token QR.
// Para qué sirve: Resolver una etiqueta escaneada.
router.get('/qr/:qrToken', asyncHandler(productController.getByQrToken));

// Qué hace: Genera la imagen QR de un producto.
// Para qué sirve: Mostrar, descargar o imprimir su etiqueta.
router.get('/:id/qr', asyncHandler(productController.getQr));

// Qué hace: Consulta un producto por su id.
// Para qué sirve: Ver los datos de un artículo específico.
router.get('/:id', asyncHandler(productController.getById));

// Qué hace: Actualiza un producto.
// Para qué sirve: Corregir sus datos sin modificar el stock directamente.
router.put('/:id', asyncHandler(productController.update));

// Qué hace: Elimina o desactiva un producto.
// Para qué sirve: Conservar el historial de los productos con movimientos.
router.delete('/:id', asyncHandler(productController.remove));

module.exports = router;