// Qué hace: Muestra el producto encontrado por QR y su historial.
// Para qué sirve: Consultar existencias y registrar entradas o salidas.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QrMovementForm from '../components/QrMovementForm';
import * as productService from '../services/product.service';
import * as movementService from '../services/movement.service';
import { useAlert } from '../hooks/useAlert';
import { formatCurrency, formatDate } from '../utils/format';

// Qué hace: Carga el producto por token y permite operar sobre él.
// Para qué sirve: Reutilizar una sola pantalla para consulta y movimientos.
export default function QrProductPage() {
  const { token } = useParams();
  const { show } = useAlert();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [movementType, setMovementType] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Qué hace: Consulta el producto y su historial actualizado.
  // Para qué sirve: Refrescar el stock después de cada movimiento.
  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const currentProduct = await productService.getProductByQrToken(token);
      const history = await movementService.listMovements({
        producto: currentProduct.id
      });
      setProduct(currentProduct);
      setMovements(history);
      setImageError(false);
    } catch (err) {
      setProduct(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  // Qué hace: Refresca la vista después de registrar un movimiento.
  // Para qué sirve: Mostrar el nuevo stock y el movimiento en el historial.
  async function handleMovementSuccess(result) {
    show({ type: 'success', text: result.message });
    setMovementType(null);
    await loadData();
  }

  if (loading) {
    return <p>Cargando producto...</p>;
  }

  if (error || !product) {
    return (
      <div className="mx-auto" style={{ maxWidth: '720px' }}>
        <div className="alert alert-danger" role="alert">
          {error || 'Producto no encontrado'}
        </div>
        <Link className="btn btn-primary" to="/scan">
          Escanear otro producto
        </Link>
      </div>
    );
  }

  const lowStock = product.cantidadDisponible <= product.stockMinimo;
  const hasImage = product.imagen && !imageError;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">{product.nombre}</h1>
          <p className="text-muted mb-0">Código: {product.codigo}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-outline-secondary" to="/scan">
            Escanear otro
          </Link>
          <Link className="btn btn-outline-primary" to={`/products/${product.id}/qr`}>
            Ver QR
          </Link>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              {hasImage ? (
                <img
                  src={product.imagen}
                  alt={`Imagen de ${product.nombre}`}
                  className="img-fluid rounded border"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="bg-light border rounded d-flex align-items-center justify-content-center text-muted p-4">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="col-md-8">
              <dl className="row mb-0">
                <dt className="col-sm-4">Categoría</dt>
                <dd className="col-sm-8">{product.categoria?.nombre || '-'}</dd>
                <dt className="col-sm-4">Precio</dt>
                <dd className="col-sm-8">{formatCurrency(product.precio)}</dd>
                <dt className="col-sm-4">Stock actual</dt>
                <dd className="col-sm-8">
                  {product.cantidadDisponible} {product.unidadMedida}{' '}
                  <span className={`badge ${lowStock ? 'text-bg-danger' : 'text-bg-success'}`}>
                    {lowStock ? 'Stock bajo' : 'Disponible'}
                  </span>
                </dd>
                <dt className="col-sm-4">Stock mínimo</dt>
                <dd className="col-sm-8">
                  {product.stockMinimo} {product.unidadMedida}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              className={`btn ${movementType === 'entrada' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setMovementType('entrada')}
            >
              Registrar entrada
            </button>
            <button
              type="button"
              className={`btn ${movementType === 'salida' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setMovementType('salida')}
              disabled={product.cantidadDisponible <= 0}
            >
              Registrar salida
            </button>
          </div>

          {movementType && (
            <QrMovementForm
              key={`${movementType}-${product.cantidadDisponible}`}
              product={product}
              tipo={movementType}
              onSuccess={handleMovementSuccess}
            />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="h5 mb-3">Historial del producto</h2>

          {movements.length === 0 ? (
            <p className="text-muted mb-0">Este producto aún no tiene movimientos.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock antes</th>
                    <th>Stock después</th>
                    <th>Usuario</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id}>
                      <td>{formatDate(movement.fecha)}</td>
                      <td>
                        <span
                          className={`badge ${
                            movement.tipo === 'entrada'
                              ? 'text-bg-success'
                              : 'text-bg-danger'
                          }`}
                        >
                          {movement.tipo}
                        </span>
                      </td>
                      <td>{movement.cantidad}</td>
                      <td>{movement.stockAnterior ?? '-'}</td>
                      <td>{movement.stockPosterior ?? '-'}</td>
                      <td>{movement.usuario?.nombre || '-'}</td>
                      <td>{movement.observacion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
