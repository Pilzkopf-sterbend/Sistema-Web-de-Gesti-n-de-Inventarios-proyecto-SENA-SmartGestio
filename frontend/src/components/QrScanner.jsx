// Qué hace: Lee códigos QR con la cámara, una imagen o un token manual.
// Para qué sirve: Consultar un producto sin depender únicamente de la cámara.

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const READER_ID = 'qr-reader';

// Qué hace: Extrae el token de un texto o de una URL de escaneo.
// Para qué sirve: Aceptar tanto el UUID puro como una URL que lo contenga.
function extractQrToken(text) {
  const value = String(text || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    const queryToken = url.searchParams.get('token');
    if (queryToken) return queryToken.trim();
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  } catch {
    return value;
  }
}

// Qué hace: Comprueba si el navegador puede solicitar la cámara.
// Para qué sirve: Avisar cuando se abre la app por HTTP en otro dispositivo.
function isCameraAvailable() {
  if (typeof window === 'undefined') return false;
  const localHosts = ['localhost', '127.0.0.1'];
  return window.isSecureContext || localHosts.includes(window.location.hostname);
}

// Qué hace: Detiene y libera el lector de cámara.
// Para qué sirve: Apagar la cámara al salir de la pantalla o al detectar un QR.
async function releaseScanner(scanner) {
  if (!scanner) return;
  try {
    await scanner.stop();
  } catch {
    // El lector puede no estar iniciado; no es un error para el usuario.
  }
  try {
    scanner.clear();
  } catch {
    // La limpieza visual tampoco debe interrumpir la navegación.
  }
}

// Qué hace: Muestra el escáner y las alternativas de lectura.
// Para qué sirve: Resolver el producto a partir de una etiqueta QR.
export default function QrScanner({ onDecoded }) {
  const scannerRef = useRef(null);
  const resultHandledRef = useRef(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [manualToken, setManualToken] = useState('');
  const cameraAvailable = isCameraAvailable();

  // Para qué sirve: Apagar la cámara si el usuario cambia de página.
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      releaseScanner(scanner);
    };
  }, []);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    await releaseScanner(scanner);
  }

  // Qué hace: Entrega el token una sola vez y detiene la cámara.
  // Para qué sirve: Evitar consultas repetidas por el mismo código.
  async function handleDecoded(text) {
    if (resultHandledRef.current) return;
    const token = extractQrToken(text);
    if (!token) {
      setError('No se pudo leer un código QR válido.');
      return;
    }

    resultHandledRef.current = true;
    setStatus('processing');
    setError('');
    await stopScanner();
    onDecoded(token);
  }

  // Qué hace: Solicita permiso y enciende la cámara.
  // Para qué sirve: Permitir el escaneo en dispositivos compatibles.
  async function startScanner() {
    if (!cameraAvailable || status === 'starting' || status === 'scanning') {
      return;
    }

    setStatus('starting');
    setError('');
    resultHandledRef.current = false;

    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error('No se encontraron cámaras disponibles.');
      }

      // Para qué sirve: Preferir la cámara trasera cuando el dispositivo la reporta.
      const rearCamera = cameras.find((camera) =>
        /back|rear|environment|trasera|traseira/i.test(camera.label)
      );
      const selectedCamera = rearCamera || cameras[cameras.length - 1];

      await scanner.start(
        selectedCamera.id,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleDecoded,
        () => {}
      );
      setStatus('scanning');
    } catch (err) {
      await stopScanner();
      setStatus('error');
      setError(
        'No se pudo iniciar la cámara. Verifica los permisos del navegador y usa una imagen o el token manual.'
      );
    }
  }

  // Qué hace: Detiene la cámara desde el botón.
  // Para qué sirve: Liberar el dispositivo cuando el usuario termina.
  async function handleStop() {
    await stopScanner();
    resultHandledRef.current = false;
    setStatus('idle');
    setError('');
  }

  // Qué hace: Lee un QR desde un archivo de imagen.
  // Para qué sirve: Ofrecer una alternativa cuando la cámara no funciona.
  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setStatus('processing');
    resultHandledRef.current = false;
    await stopScanner();

    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;

    try {
      const decodedText = await scanner.scanFile(file, true);
      await handleDecoded(decodedText);
    } catch (err) {
      resultHandledRef.current = false;
      setStatus('error');
      setError('No se pudo leer el QR de la imagen seleccionada.');
    } finally {
      await releaseScanner(scanner);
      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    }
  }

  // Qué hace: Procesa un token escrito manualmente.
  // Para qué sirve: Permitir la consulta cuando no hay cámara ni imagen.
  async function handleManualSubmit(event) {
    event.preventDefault();
    if (!manualToken.trim()) {
      setError('Ingresa el identificador del QR.');
      return;
    }
    await handleDecoded(manualToken);
  }

  return (
    <div className="card p-3 p-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h2 className="h5 mb-1">Escanear código QR</h2>
          <p className="text-muted mb-0">
            Enfoca la etiqueta del producto o usa una alternativa.
          </p>
        </div>
        <span className="badge text-bg-primary" aria-live="polite">
          {status === 'scanning'
            ? 'Cámara activa'
            : status === 'starting'
              ? 'Iniciando...'
              : status === 'processing'
                ? 'Procesando...'
                : 'Listo'}
        </span>
      </div>

      {!cameraAvailable && (
        <div className="alert alert-warning" role="alert">
          La cámara requiere HTTPS o `localhost`. Usa la imagen o el token manual.
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="qr-reader-wrap mb-3">
        <div id={READER_ID} className="qr-reader" />
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {status === 'scanning' || status === 'starting' ? (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleStop}
          >
            Detener cámara
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={startScanner}
            disabled={!cameraAvailable || status === 'processing'}
          >
            Activar cámara
          </button>
        )}
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label" htmlFor="qr-file">
            Subir imagen del QR
          </label>
          <input
            id="qr-file"
            type="file"
            accept="image/*"
            className="form-control"
            onChange={handleFileChange}
            disabled={status === 'processing'}
          />
        </div>
        <div className="col-md-6">
          <form onSubmit={handleManualSubmit}>
            <label className="form-label" htmlFor="qr-token">
              Token manual
            </label>
            <div className="input-group">
              <input
                id="qr-token"
                className="form-control"
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="UUID del QR"
                disabled={status === 'processing'}
              />
              <button
                className="btn btn-outline-secondary"
                type="submit"
                disabled={status === 'processing'}
              >
                Consultar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
