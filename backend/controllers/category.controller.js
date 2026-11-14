// Qué hace: Atiende las peticiones HTTP de categorías.
// Para qué sirve: Conectar las rutas con el servicio de categorías.

const categoryService = require('../services/category.service');

// Qué hace: Lista todas las categorías.
// Para qué sirve: Alimentar las tablas y los formularios de productos.
async function list(req, res) {
  const categories = await categoryService.listCategories();
  res.json({ categories });
}

// Qué hace: Obtiene una categoría por su id.
// Para qué sirve: Consultar una categoría específica.
async function getById(req, res) {
  const category = await categoryService.getCategoryById(req.params.id);
  res.json({ category });
}

// Qué hace: Crea una categoría con los datos recibidos.
// Para qué sirve: Agregar una nueva agrupación de productos.
async function create(req, res) {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ category });
}

// Qué hace: Actualiza una categoría existente.
// Para qué sirve: Corregir su nombre o descripción.
async function update(req, res) {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.json({ category });
}

// Qué hace: Elimina una categoría sin productos asociados.
// Para qué sirve: Mantener organizado el catálogo de categorías.
async function remove(req, res) {
  const result = await categoryService.deleteCategory(req.params.id);
  res.json(result);
}

module.exports = { list, getById, create, update, remove };