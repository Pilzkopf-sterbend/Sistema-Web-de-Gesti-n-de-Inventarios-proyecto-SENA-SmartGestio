// Qué hace: Muestra la gestión de categorías.
// Para qué sirve: Crear, editar y eliminar las categorías de los productos.

import { useEffect, useState } from 'react';
import * as categoryService from '../services/category.service';
import { useAlert } from '../hooks/useAlert';

// Qué hace: Carga las categorías y permite administrarlas desde un formulario.
// Para qué sirve: Mantener organizado el catálogo de productos.
export default function CategoriesPage() {
  const { show } = useAlert();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [editing, setEditing] = useState(null);

  // Qué hace: Solicita la lista de categorías.
  // Para qué sirve: Actualizar la tabla después de crear, editar o eliminar.
  async function loadCategories() {
    setLoading(true);
    try {
      setCategories(await categoryService.listCategories());
    } catch (err) {
      show({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Para qué sirve: Cargar las categorías al abrir la página.
  useEffect(() => {
    loadCategories();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Qué hace: Carga una categoría en el formulario.
  // Para qué sirve: Editar sus datos sin crear un registro nuevo.
  function startEdit(category) {
    setEditing(category);
    setForm({ nombre: category.nombre, descripcion: category.descripcion || '' });
  }

  // Qué hace: Crea o actualiza una categoría.
  // Para qué sirve: Guardar los cambios del formulario.
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await categoryService.updateCategory(editing.id, form);
        show({ type: 'success', text: 'Categoría actualizada' });
      } else {
        await categoryService.createCategory(form);
        show({ type: 'success', text: 'Categoría creada' });
      }
      setForm({ nombre: '', descripcion: '' });
      setEditing(null);
      loadCategories();
    } catch (err) {
      show({ type: 'error', text: err.message });
    }
  }

  // Qué hace: Elimina una categoría.
  // Para qué sirve: Quitarla del catálogo cuando ya no está en uso.
  async function handleDelete(category) {
    if (!window.confirm(`¿Eliminar la categoría "${category.nombre}"?`)) {
      return;
    }
    try {
      await categoryService.deleteCategory(category.id);
      show({ type: 'success', text: 'Categoría eliminada' });
      loadCategories();
    } catch (err) {
      show({ type: 'error', text: err.message });
    }
  }

  // Qué hace: Limpia el formulario y cancela la edición.
  // Para qué sirve: Volver al modo de creación.
  function cancelEdit() {
    setEditing(null);
    setForm({ nombre: '', descripcion: '' });
  }

  return (
    <div>
      <h2>Gestión de categorías</h2>
      <form onSubmit={handleSubmit} className="card p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-4">
            <input
              name="nombre"
              className="form-control"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-5">
            <input
              name="descripcion"
              className="form-control"
              placeholder="Descripción (opcional)"
              value={form.descripcion}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3 d-flex gap-2">
            <button className="btn btn-primary flex-fill">
              {editing ? 'Guardar' : 'Crear'}
            </button>
            {editing && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.nombre}</td>
                <td>{category.descripcion || '-'}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => startEdit(category)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(category)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}