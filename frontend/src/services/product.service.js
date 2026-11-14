// Qué hace: Realiza las peticiones de productos al backend.
// Para qué sirve: Consultar y administrar los artículos del inventario.

import { http } from './api';

// Qué hace: Lista los productos con filtros opcionales.
// Para qué sirve: Buscar por texto, categoría o stock bajo.
export async function listProducts(params = {}) {
  // Para qué sirve: Construir la cadena de filtros de la URL.
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.categoria) query.set('categoria', params.categoria);
  if (params.stockLow) query.set('stock', 'low');
  const qs = query.toString();
  const data = await http.get(`/products${qs ? `?${qs}` : ''}`);
  return data.products;
}

// Qué hace: Obtiene un producto por su id.
// Para qué sirve: Cargar los datos en el formulario de edición.
export async function getProduct(id) {
  const data = await http.get(`/products/${id}`);
  return data.product;
}

// Qué hace: Crea un producto.
// Para qué sirve: Registrar un nuevo artículo en el inventario.
export async function createProduct(product) {
  const data = await http.post('/products', product);
  return data.product;
}

// Qué hace: Actualiza un producto.
// Para qué sirve: Corregir sus datos sin modificar el stock directamente.
export async function updateProduct(id, product) {
  const data = await http.put(`/products/${id}`, product);
  return data.product;
}

// Qué hace: Elimina o desactiva un producto.
// Para qué sirve: Conservar el historial de los productos con movimientos.
export async function deleteProduct(id) {
  const data = await http.del(`/products/${id}`);
  return data;
}