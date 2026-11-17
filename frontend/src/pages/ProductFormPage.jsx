// Qué hace: Muestra el formulario para crear o editar un producto.
// Para qué sirve: Registrar los datos del inventario y mantener el stock inicial.

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as productService from '../services/product.service';
import * as categoryService from '../services/category.service';
import { useAlert } from '../hooks/useAlert';

// Para qué sirve: Ofrecer las mismas unidades de medida aceptadas por el backend.
const UNIDADES = ['unidades', 'kg', 'litros', 'metros'];

const emptyForm = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria: '',
  precio: '',
  cantidadDisponible: 0,
  stockMinimo: 0,
  unidadMedida: 'unidades',
  imagen: ''
};

// Qué hace: Carga las categorías y el producto cuando se está editando.
// Para qué sirve: Crear un producto nuevo o actualizar uno existente.
export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useAlert();
  const isEditing = Boolean(id);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEditing);

  // Para qué sirve: Cargar las categorías disponibles en el selector.
  useEffect(() => {
    categoryService.listCategories().then(setCategories).catch(() => {});
  }, []);

  // Para qué sirve: Rellenar el formulario cuando se edita un producto.
  useEffect(() => {
    if (isEditing) {
      productService
        .getProduct(id)
        .then((product) => {
          setForm({
            codigo: product.codigo,
            nombre: product.nombre,
            descripcion: product.descripcion || '',
            categoria: product.categoria?.id || product.categoria || '',
            precio: product.precio ?? '',
            cantidadDisponible: product.cantidadDisponible,
            stockMinimo: product.stockMinimo,
            unidadMedida: product.unidadMedida,
            imagen: product.imagen || ''
          });
        })
        .catch((err) => show({ type: 'error', text: err.message }))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Qué hace: Crea o actualiza un producto.
  // Para qué sirve: Guardar los datos del formulario y volver a la lista.
  async function handleSubmit(e) {
    e.preventDefault();
    // Para qué sirve: Enviar solo los campos que acepta el backend.
    const payload = {
      codigo: form.codigo,
      nombre: form.nombre,
      descripcion: form.descripcion,
      categoria: form.categoria,
      precio: form.precio === '' ? undefined : Number(form.precio),
      stockMinimo: Number(form.stockMinimo),
      unidadMedida: form.unidadMedida,
      imagen: form.imagen.trim()
    };
    // Para qué sirve: Enviar el stock inicial solo al crear el producto.
    if (!isEditing) {
      payload.cantidadDisponible = Number(form.cantidadDisponible);
    }
    try {
      if (isEditing) {
        await productService.updateProduct(id, payload);
        show({ type: 'success', text: 'Producto actualizado' });
      } else {
        await productService.createProduct(payload);
        show({ type: 'success', text: 'Producto creado' });
      }
      navigate('/products');
    } catch (err) {
      show({ type: 'error', text: err.message });
    }
  }

  // Para qué sirve: Evitar mostrar el formulario mientras se cargan los datos.
  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="card p-4" style={{ maxWidth: '640px' }}>
      <h2 className="h4 mb-3">
        {isEditing ? 'Editar producto' : 'Nuevo producto'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Código</label>
            <input
              name="codigo"
              className="form-control"
              value={form.codigo}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Nombre</label>
            <input
              name="nombre"
              className="form-control"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label">Descripción (opcional)</label>
            <textarea
              name="descripcion"
              className="form-control"
              rows="2"
              value={form.descripcion}
              onChange={handleChange}
            />
          </div>
          <div className="col-12">
            <label className="form-label">URL de imagen (opcional)</label>
            <input
              name="imagen"
              className="form-control"
              value={form.imagen}
              onChange={handleChange}
              placeholder="https://ejemplo.com/producto.jpg"
            />
            <small className="text-muted">
              Acepta una URL http(s) o una data URL de imagen.
            </small>
          </div>
          <div className="col-md-6">
            <label className="form-label">Categoría</label>
            <select
              name="categoria"
              className="form-select"
              value={form.categoria}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Unidad de medida</label>
            <select
              name="unidadMedida"
              className="form-select"
              value={form.unidadMedida}
              onChange={handleChange}
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Precio de venta (opcional)</label>
            <input
              name="precio"
              type="number"
              min="0"
              className="form-control"
              value={form.precio}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Stock inicial</label>
            <input
              name="cantidadDisponible"
              type="number"
              min="0"
              step="1"
              className="form-control"
              value={form.cantidadDisponible}
              onChange={handleChange}
              disabled={isEditing}
            />
            {isEditing && (
              <small className="text-muted">
                El stock se modifica con movimientos.
              </small>
            )}
          </div>
          <div className="col-md-4">
            <label className="form-label">Stock mínimo</label>
            <input
              name="stockMinimo"
              type="number"
              min="0"
              step="1"
              className="form-control"
              value={form.stockMinimo}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-primary">
            {isEditing ? 'Guardar cambios' : 'Crear producto'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/products')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}