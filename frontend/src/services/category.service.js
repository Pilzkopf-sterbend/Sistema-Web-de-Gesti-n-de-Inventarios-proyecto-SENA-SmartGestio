// Qué hace: Realiza las peticiones de categorías al backend.
// Para qué sirve: Consultar, crear, actualizar y eliminar categorías.

import { http } from './api';

// Qué hace: Obtiene todas las categorías.
// Para qué sirve: Alimentar las tablas y los formularios de productos.
export async function listCategories() {
  const data = await http.get('/categories');
  return data.categories;
}

// Qué hace: Crea una categoría.
// Para qué sirve: Agregar una nueva agrupación de productos.
export async function createCategory(category) {
  const data = await http.post('/categories', category);
  return data.category;
}

// Qué hace: Actualiza una categoría.
// Para qué sirve: Corregir su nombre o descripción.
export async function updateCategory(id, category) {
  const data = await http.put(`/categories/${id}`, category);
  return data.category;
}

// Qué hace: Elimina una categoría.
// Para qué sirve: Quitarla del catálogo cuando ya no tiene productos.
export async function deleteCategory(id) {
  await http.del(`/categories/${id}`);
}