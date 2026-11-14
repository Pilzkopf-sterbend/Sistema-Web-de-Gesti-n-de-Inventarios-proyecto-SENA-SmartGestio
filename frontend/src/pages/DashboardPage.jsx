// Qué hace: Muestra el resumen general del inventario.
// Para qué sirve: Dar una vista rápida de productos, stock y movimientos.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as dashboardService from '../services/dashboard.service';
import { useAlert } from '../hooks/useAlert';
import { formatDate } from '../utils/format';

// Qué hace: Carga las estadísticas y los últimos movimientos.
// Para qué sirve: Presentar los indicadores principales del sistema.
export default function DashboardPage() {
  const { show } = useAlert();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Qué hace: Solicita el resumen al cargar la página.
  // Para qué sirve: Mostrar los datos actualizados del inventario.
  useEffect(() => {
    dashboardService
      .getDashboardSummary()
      .then(setSummary)
      .catch((err) => show({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!summary) {
    return <p>No hay información disponible.</p>;
  }

  // Para qué sirve: Definir las tarjetas de resumen y sus enlaces.
  const cards = [
    { label: 'Productos', value: summary.totalProductos, link: '/products' },
    { label: 'Unidades en stock', value: summary.totalStock, link: '/products' },
    { label: 'Stock bajo', value: summary.productosStockBajo, link: '/products?stock=low' },
    { label: 'Movimientos', value: summary.totalMovimientos, link: '/movements' },
    { label: 'Categorías', value: summary.totalCategorias, link: '/categories' },
    { label: 'Usuarios activos', value: summary.totalUsuariosActivos, link: '/users' }
  ];

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div className="col-md-4 col-lg-2" key={card.label}>
            <Link
              to={card.link}
              className="card text-center text-decoration-none h-100"
            >
              <div className="card-body">
                <div className="fs-2 fw-bold">{card.value}</div>
                <div className="text-muted">{card.label}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <h3 className="h5 mb-3">Últimos movimientos</h3>
      {/* Para qué sirve: Mostrar el historial reciente de entradas y salidas. */}
      <table className="table table-striped align-middle">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {summary.movimientosRecientes.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-muted">
                No hay movimientos registrados.
              </td>
            </tr>
          ) : (
            summary.movimientosRecientes.map((movement) => (
              <tr key={movement._id}>
                <td>{formatDate(movement.fecha)}</td>
                <td>{movement.producto?.nombre || '-'}</td>
                <td>
                  {movement.tipo === 'entrada' ? (
                    <span className="badge text-bg-success">Entrada</span>
                  ) : (
                    <span className="badge text-bg-danger">Salida</span>
                  )}
                </td>
                <td>{movement.cantidad}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}