// Qué hace: Gestiona los productos y sus reglas de inventario.
// Para qué sirve: Consultar, crear, actualizar y eliminar productos de forma segura.

const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Movement = require('../models/movement.model');
const { ApiError } = require('../utils/apiError');

// Qué hace: Escapa caracteres especiales de una búsqueda.
// Para qué sirve: Evitar errores al buscar textos con símbolos de expresión regular.
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Qué hace: Valida la URL o data URL de la imagen del producto.
// Para qué sirve: Evitar guardar valores que no puedan mostrarse como imagen.
function validateImagen(imagen) {
  if (imagen === undefined) {
    return undefined;
  }
  if (imagen === null || imagen === '') {
    return '';
  }
  if (typeof imagen !== 'string') {
    throw new ApiError(400, 'La imagen debe ser una URL válida');
  }

  const value = imagen.trim();
  if (!value) {
    return '';
  }

  const isUrl = /^https?:\/\/\S+$/i.test(value);
  const isDataImage = /^data:image\/[a-z0-9.+-]+;base64,\S+$/i.test(value);
  if (!isUrl && !isDataImage) {
    throw new ApiError(
      400,
      'La imagen debe ser una URL http(s) o una data URL de imagen'
    );
  }

  return value;
}

// Qué hace: Lista los productos activos con filtros opcionales.
// Para qué sirve: Permitir búsquedas por texto, categoría o stock bajo.
async function listProducts({ search, categoria, stockLow } = {}) {
  const filter = { activo: true };

  if (categoria) {
    filter.categoria = categoria;
  }

  // Para qué sirve: Mostrar solo los productos que están en el nivel mínimo o por debajo.
  if (stockLow === 'low') {
    filter.$expr = { $lte: ['$cantidadDisponible', '$stockMinimo'] };
  }

  // Para qué sirve: Buscar por nombre o código sin distinguir mayúsculas.
  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i');
    filter.$or = [{ nombre: regex }, { codigo: regex }];
  }

  const products = await Product.find(filter)
    .sort({ nombre: 1 })
    .populate('categoria', 'nombre');
  return products.map((product) => product.toSafeObject());
}

// Qué hace: Busca un producto activo por su id.
// Para qué sirve: Consultar o editar un producto específico.
async function getProductById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Producto no encontrado');
  }
  const product = await Product.findById(id).populate('categoria', 'nombre');
  if (!product || !product.activo) {
    throw new ApiError(404, 'Producto no encontrado');
  }
  return product.toSafeObject();
}

// Qué hace: Comprueba que la categoría exista.
// Para qué sirve: Evitar productos asociados a categorías inexistentes.
async function validateCategory(categoria) {
  if (!mongoose.isValidObjectId(categoria)) {
    throw new ApiError(400, 'La categoría no existe');
  }
  const category = await Category.findById(categoria);
  if (!category) {
    throw new ApiError(400, 'La categoría no existe');
  }
}

// Qué hace: Crea un producto después de validar su categoría.
// Para qué sirve: Registrar nuevos artículos en el inventario.
async function createProduct(data) {
  await validateCategory(data.categoria);
  const productData = { ...data };
  if (data.imagen !== undefined) {
    productData.imagen = validateImagen(data.imagen);
  }
  const product = new Product(productData);
  await product.save();
  return product.toSafeObject();
}

// Qué hace: Actualiza los datos editables de un producto.
// Para qué sirve: Corregir la información sin alterar el stock directamente.
async function updateProduct(id, data) {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  if (data.categoria !== undefined) {
    await validateCategory(data.categoria);
    product.categoria = data.categoria;
  }
  if (data.codigo !== undefined) {
    product.codigo = data.codigo;
  }
  if (data.nombre !== undefined) {
    product.nombre = data.nombre;
  }
  if (data.descripcion !== undefined) {
    product.descripcion = data.descripcion;
  }
  if (data.precio !== undefined) {
    product.precio = data.precio;
  }
  if (data.stockMinimo !== undefined) {
    product.stockMinimo = data.stockMinimo;
  }
  if (data.unidadMedida !== undefined) {
    product.unidadMedida = data.unidadMedida;
  }
  if (data.imagen !== undefined) {
    product.imagen = validateImagen(data.imagen);
  }
  // Para qué sirve: Garantizar que el stock solo cambie mediante movimientos.
  if (data.cantidadDisponible !== undefined) {
    throw new ApiError(
      400,
      'El stock solo se modifica mediante movimientos de entrada o salida'
    );
  }

  await product.save();
  return product.toSafeObject();
}

// Qué hace: Elimina o desactiva un producto según su historial.
// Para qué sirve: Conservar los movimientos sin perder la información del producto.
async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Producto no encontrado');
  }
  // Para qué sirve: Evitar borrar productos que ya tienen movimientos registrados.
  const movementCount = await Movement.countDocuments({ producto: id });
  if (movementCount > 0) {
    product.activo = false;
    await product.save();
    return { message: 'Producto desactivado', product: product.toSafeObject() };
  }
  await product.deleteOne();
  return { message: 'Producto eliminado' };
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};