// Qué hace: Muestra la etiqueta QR de un producto.
// Para qué sirve: Visualizar, descargar e imprimir el código para el inventario.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as productService from '../services/product.service';
import { formatCurrency } from '../utils/format';

// Qué hace: Carga el producto y su imagen QR.
// Para qué sirve: Generar una etiqueta lista para imprimir.
export default function ProductQrPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    productService
      .getProductQr(id)
      .then((result) => {
        if (!active) return;
        setProduct(result.product);
        setQr(result.qr);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Qué hace: Descarga la imagen QR como PNG.
  // Para qué sirve: Guardar o enviar la etiqueta a impresión.
  function handleDownload() {
    if (!qr?.dataUrl || !product) return;
    const link = document.createElement('a');
    link.href = qr.dataUrl;
    link.download = `QR-${product.codigo || product.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return <p>Cargando etiqueta QR...</p>;
  }

  if (error || !product || !qr) {
    return (
      <div className="mx-auto" style={{ maxWidth: '720px' }}>
        <div className="alert alert-danger" role="alert">
          {error || 'No se pudo generar el QR'}
        </div>
        <Link className="btn btn-secondary" to="/products">
          Volver a productos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '680px' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 no-print">
        <h1 className="h4 mb-0">Etiqueta QR</h1>
        <Link className="btn btn-outline-secondary" to="/products">
          Volver a productos
        </Link>
      </div>

      <div className="card p-4 qr-print-area">
        <div className="text-center">
          <h2 className="h5 mb-1">{product.nombre}</h2>
          <p className="text-muted mb-1">Código: {product.codigo}</p>
          <p className="mb-3">
            {product.categoria?.nombre || 'Sin categoría'} ·{' '}
            {formatCurrency(product.precio)}
          </p>
          <img
            src={qr.dataUrl}
            alt={`Código QR de ${product.nombre}`}
            className="img-fluid border rounded p-2 bg-white"
            style={{ maxWidth: '320px' }}
          />
          <p className="mt-3 mb-0">
            Stock: {product.cantidadDisponible} {product.unidadMedida}
          </p>
          {!product.activo && (
            <p className="text-danger mt-2 mb-0">Producto desactivado</p>
          )}
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mt-3 no-print">
        <button type="button" className="btn btn-primary" onClick={handleDownload}>
          Descargar PNG
        </button>
        <button type="button" className="btn btn-outline-primary" onClick={() => window.print()}>
          Imprimir etiqueta
        </button>
      </div>
    </div>
  );
}
