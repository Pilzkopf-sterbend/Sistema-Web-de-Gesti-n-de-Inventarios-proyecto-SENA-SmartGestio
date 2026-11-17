// Qué hace: Muestra la herramienta para escanear códigos QR.
// Para qué sirve: Abrir el producto asociado a una etiqueta del inventario.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from '../components/QrScanner';
import * as productService from '../services/product.service';

// Qué hace: Carga la página de escaneo y resuelve el token leído.
// Para qué sirve: Llevar al administrador a la vista del producto correcto.
export default function QrScanPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  // Qué hace: Busca el producto asociado al QR.
  // Para qué sirve: Validar la etiqueta antes de abrir sus movimientos.
  async function handleDecoded(token) {
    setLoading(true);
    setError('');

    try {
      await productService.getProductByQrToken(token);
      navigate(`/scan/${encodeURIComponent(token)}`);
    } catch (err) {
      setError(err.message);
      // Para qué sirve: Reiniciar el escáner después de un código inválido.
      setScannerKey((key) => key + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '760px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Escaneo de inventario</h1>
      </div>

      {loading && (
        <div className="alert alert-info" role="status">
          Buscando el producto...
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <QrScanner key={scannerKey} onDecoded={handleDecoded} />
    </div>
  );
}
