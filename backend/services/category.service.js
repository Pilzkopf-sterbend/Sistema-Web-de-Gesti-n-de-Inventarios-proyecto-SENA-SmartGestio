// Qué hace: Gestiona las categorías de los productos.
// Para qué sirve: Organizar el inventario y evitar categorías duplicadas.

const mongoose = require('mongoose');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const { ApiError } = require('../utils/apiError');

// Qué hace: Obtiene todas las categorías ordenadas por nombre.
// Para qué sirve: Alimentar las tablas y los formularios de productos.
async function listCategories() {
  const categories = await Category.find({}).sort({ nombre: 1 });
  return categories.map((category) => category.toSafeObject());
}

// Qué hace: Busca una categoría por su id.
// Para qué sirve: Consultar o modificar una categoría específica.
async function getCategoryById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Categoría no encontrada');
  }
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Categoría no encontrada');
  }
  return category.toSafeObject();
}

// Qué hace: Crea una nueva categoría.
// Para qué sirve: Agrupar productos bajo un mismo tipo.
async function createCategory({ nombre, descripcion }) {
  const category = new Category({ nombre, descripcion });
  await category.save();
  return category.toSafeObject();
}

// Qué hace: Actualiza el nombre o la descripción de una categoría.
// Para qué sirve: Corregir o mejorar la información existente.
async function updateCategory(id, { nombre, descripcion }) {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Categoría no encontrada');
  }
  if (nombre !== undefined) {
    category.nombre = nombre;
  }
  if (descripcion !== undefined) {
    category.descripcion = descripcion;
  }
  await category.save();
  return category.toSafeObject();
}

// Qué hace: Elimina una categoría si no tiene productos activos.
// Para qué sirve: Evitar que los productos queden sin una categoría válida.
async function deleteCategory(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Categoría no encontrada');
  }
  // Para qué sirve: Comprobar que la categoría no esté en uso antes de borrarla.
  const productCount = await Product.countDocuments({ categoria: id, activo: true });
  if (productCount > 0) {
    throw new ApiError(
      409,
      'No se puede eliminar una categoría que tiene productos asociados'
    );
  }
  await category.deleteOne();
  return { message: 'Categoría eliminada' };
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};