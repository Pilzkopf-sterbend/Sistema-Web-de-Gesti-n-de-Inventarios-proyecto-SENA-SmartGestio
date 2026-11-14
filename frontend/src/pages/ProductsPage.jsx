// Qué hace: Muestra y filtra la lista de productos.
// Para qué sirve: Consultar las existencias y detectar productos con stock bajo.

import { useEffect, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import * as productService from '../services/product.service';
import * as categoryService from '../services/category.service';
import { useAlert } from '../hooks/useAlert';
import { formatCurrency } from '../utils/format';

// Qué hace: Carga los productos y permite buscarlos o filtrarlos.
// Para qué sirve: Administrar el inventario desde una sola tabla.
export default function ProductsPage({ stockLow = false }) {
  const { show } = useAlert();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(true);

  // Para qué sirve: Activar el filtro de stock bajo desde la ruta o la URL.
  const isLow = stockLow || searchParams.get('stock') === 'low';

  // Qué hace: Solicita los productos con los filtros actuales.
  // Para qué sirve: Actualizar la tabla después de buscar o eliminar.
  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(
        await productService.listProducts({
          search,
          categoria,
          stockLow: isLow
        })
      );
    } catch (err) {
      show({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Para qué sirve: Cargar las categorías para el filtro y los formularios.
  useEffect(() => {
    categoryService.listCategories().then(setCategories).catch(() => {});
  }, []);

  // Para qué sirve: Recargar la lista cuando cambian la búsqueda o los filtros.
  useEffect(() => {
    loadProducts();
  }, [search, categoria, location.search]);

  // Qué hace: Elimina o desactiva un producto.
  // Para qué sirve: Quitarlo del inventario conservando su historial.
  async function handleDelete(product) {
    if (!window.confirm(`¿Eliminar el producto "${product.nombre}"?`)) {
      return;
    }
    try {
      const result = await productService.deleteProduct(product.id);
      show({ type: 'success', text: result.message });
      loadProducts();
    } catch (err) {
      show({ type: 'error', text: err.message });
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">{isLow ? 'Productos con stock bajo' : 'Productos y existencias'}</h2>
        <Link to="/products/new" className="btn btn-primary">
          Nuevo producto
        </Link>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-5">
          <input
            className="form-control"
            placeholder="Buscar por nombre o código (RF-011)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : products.length === 0 ? (
        <p className="text-muted">No hay productos para mostrar.</p>
      ) : (
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Unidad</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              // Para qué sirve: Marcar el producto cuando alcanza el stock mínimo.
              const low = product.cantidadDisponible <= product.stockMinimo;
              return (
                <tr key={product.id}>
                  <td>{product.codigo}</td>
                  <td>{product.nombre}</td>
                  <td>{product.categoria?.nombre || '-'}</td>
                  <td>
                    {product.cantidadDisponible}{' '}
                    {low && <span className="badge text-bg-danger">Stock bajo</span>}
                  </td>
                  <td>{product.unidadMedida}</td>
                  <td>{formatCurrency(product.precio)}</td>
                  <td>
                    <span className="badge text-bg-info">Mín {product.stockMinimo}</span>
                  </td>
                  <td>
                    <Link
                      className="btn btn-sm btn-outline-primary me-2"
                      to={`/products/${product.id}/edit`}
                    >
                      Editar
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(product)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}