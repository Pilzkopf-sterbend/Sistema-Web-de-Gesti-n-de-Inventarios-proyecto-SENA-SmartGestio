// Qué hace: Muestra el historial de movimientos del inventario.
// Para qué sirve: Consultar entradas y salidas por producto, tipo o fecha.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as movementService from '../services/movement.service';
import * as productService from '../services/product.service';
import { useAlert } from '../hooks/useAlert';
import { formatDate } from '../utils/format';

// Qué hace: Carga y filtra los movimientos registrados.
// Para qué sirve: Revisar cómo ha cambiado el stock a lo largo del tiempo.
export default function MovementsPage() {
  const { show } = useAlert();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    producto: '',
    tipo: '',
    fechaInicio: '',
    fechaFin: ''
  });

  // Qué hace: Solicita los movimientos con los filtros seleccionados.
  // Para qué sirve: Actualizar la tabla sin recargar la página.
  async function loadMovements() {
    setLoading(true);
    try {
      // Para qué sirve: Enviar solo los filtros que tienen un valor.
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value)
      );
      setMovements(await movementService.listMovements(activeFilters));
    } catch (err) {
      show({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Para qué sirve: Cargar los productos para el filtro de la tabla.
  useEffect(() => {
    productService.listProducts().then(setProducts).catch(() => {});
  }, []);

  // Para qué sirve: Recargar la tabla cuando cambia algún filtro.
  useEffect(() => {
    loadMovements();
  }, [filters]);

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Movimientos de inventario</h2>
        <Link to="/movements/new" className="btn btn-primary">
          Registrar movimiento
        </Link>
      </div>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-3">
            <select
              name="producto"
              className="form-select"
              value={filters.producto}
              onChange={handleChange}
            >
              <option value="">Todos los productos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              name="tipo"
              className="form-select"
              value={filters.tipo}
              onChange={handleChange}
            >
              <option value="">Todos los tipos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div className="col-md-3">
            <input
              name="fechaInicio"
              type="date"
              className="form-control"
              value={filters.fechaInicio}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <input
              name="fechaFin"
              type="date"
              className="form-control"
              value={filters.fechaFin}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-1">
            <button className="btn btn-secondary w-100" onClick={loadMovements}>
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : movements.length === 0 ? (
        <p className="text-muted">No hay movimientos para los filtros seleccionados.</p>
      ) : (
        <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Usuario</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>{formatDate(movement.fecha)}</td>
                <td>{movement.producto?.nombre || movement.producto || '-'}</td>
                <td>
                  {movement.tipo === 'entrada' ? (
                    <span className="badge text-bg-success">Entrada</span>
                  ) : (
                    <span className="badge text-bg-danger">Salida</span>
                  )}
                </td>
                <td>{movement.cantidad}</td>
                <td>{movement.usuario?.nombre || '-'}</td>
                <td>{movement.observacion || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}