// Qué hace: Atiende las peticiones HTTP de productos.
// Para qué sirve: Conectar las rutas con el servicio de inventario.

const productService = require('../services/product.service');
const qrService = require('../services/qr.service');

// Qué hace: Lista los productos con los filtros de la URL.
// Para qué sirve: Permitir búsquedas por texto, categoría o stock bajo.
async function list(req, res) {
  const products = await productService.listProducts({
    search: req.query.search,
    categoria: req.query.categoria,
    // Para qué sirve: Activar el filtro de stock bajo solo cuando se solicita.
    stockLow: req.query.stock === 'low' ? 'low' : undefined
  });
  res.json({ products });
}

// Qué hace: Obtiene un producto por su id.
// Para qué sirve: Consultar un artículo específico.
async function getById(req, res) {
  const product = await productService.getProductById(req.params.id);
  res.json({ product });
}

// Qué hace: Busca un producto activo por su token QR.
// Para qué sirve: Mostrar el producto después de escanear una etiqueta.
async function getByQrToken(req, res) {
  const product = await qrService.getProductByQrToken(req.params.qrToken);
  res.json({ product });
}

// Qué hace: Genera la imagen QR de un producto.
// Para qué sirve: Visualizar, descargar o imprimir la etiqueta.
async function getQr(req, res) {
  const result = await qrService.getProductQr(req.params.id);
  res.json(result);
}

// Qué hace: Crea un producto con los datos recibidos.
// Para qué sirve: Registrar un nuevo artículo en el inventario.
async function create(req, res) {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ product });
}

// Qué hace: Actualiza un producto existente.
// Para qué sirve: Corregir sus datos sin cambiar el stock directamente.
async function update(req, res) {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.json({ product });
}

// Qué hace: Elimina o desactiva un producto.
// Para qué sirve: Conservar el historial cuando el producto ya tiene movimientos.
async function remove(req, res) {
  const result = await productService.deleteProduct(req.params.id);
  res.json(result);
}

module.exports = { list, getById, getByQrToken, getQr, create, update, remove };