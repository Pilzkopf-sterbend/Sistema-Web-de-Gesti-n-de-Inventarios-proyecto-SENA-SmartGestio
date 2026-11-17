// Qué hace: Registra una entrada o salida desde la vista QR del producto.
// Para qué sirve: Actualizar el stock con confirmación y protección contra duplicados.

import { useRef, useState } from 'react';
import * as movementService from '../services/movement.service';
import { createIdempotencyKey } from '../utils/idempotency';

// Qué hace: Muestra y envía el formulario de movimiento.
// Para qué sirve: Reutilizar la misma operación para entradas y salidas.
export default function QrMovementForm({ product, tipo, onSuccess }) {
  const [cantidad, setCantidad] = useState('');
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef(null);

  const isEntrada = tipo === 'entrada';
  const label = isEntrada ? 'entrada' : 'salida';

  // Qué hace: Invalida la clave anterior cuando cambian los datos.
  // Para qué sirve: No reutilizar una clave con una cantidad diferente.
  function resetIdempotencyKey() {
    idempotencyKeyRef.current = null;
  }

  function handleCantidadChange(event) {
    setCantidad(event.target.value);
    resetIdempotencyKey();
  }

  function handleObservacionChange(event) {
    setObservacion(event.target.value);
    resetIdempotencyKey();
  }

  // Qué hace: Valida, confirma y registra el movimiento.
  // Para qué sirve: Evitar salidas inválidas y envíos duplicados.
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const cantidadNumerica = Number(cantidad);
    if (!Number.isInteger(cantidadNumerica) || cantidadNumerica < 1) {
      setError('La cantidad debe ser un número entero mayor que cero.');
      return;
    }
    if (!isEntrada && cantidadNumerica > product.cantidadDisponible) {
      setError(
        `Stock insuficiente: disponible ${product.cantidadDisponible} ${product.unidadMedida}.`
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Confirmas registrar una ${label} de ${cantidadNumerica} ${product.unidadMedida} para "${product.nombre}"?`
    );
    if (!confirmed) return;

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createIdempotencyKey();
    }

    setSubmitting(true);
    try {
      const result = await movementService.createMovement({
        producto: product.id,
        tipo,
        cantidad: cantidadNumerica,
        observacion,
        idempotencyKey: idempotencyKeyRef.current
      });

      setCantidad('');
      setObservacion('');
      idempotencyKeyRef.current = null;
      await onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-3 bg-light">
      <h3 className="h6 mb-3">
        Registrar {label}
      </h3>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="row g-2">
        <div className="col-sm-4">
          <label className="form-label" htmlFor={`qr-cantidad-${tipo}`}>
            Cantidad
          </label>
          <input
            id={`qr-cantidad-${tipo}`}
            type="number"
            min="1"
            step="1"
            max={isEntrada ? undefined : product.cantidadDisponible}
            className="form-control"
            value={cantidad}
            onChange={handleCantidadChange}
            disabled={submitting}
            required
          />
        </div>
        <div className="col-sm-8">
          <label className="form-label" htmlFor={`qr-observacion-${tipo}`}>
            Observación (opcional)
          </label>
          <input
            id={`qr-observacion-${tipo}`}
            className="form-control"
            value={observacion}
            onChange={handleObservacionChange}
            disabled={submitting}
            maxLength="250"
          />
        </div>
      </div>

      <button
        type="submit"
        className={`btn mt-3 ${isEntrada ? 'btn-success' : 'btn-danger'}`}
        disabled={submitting}
      >
        {submitting ? 'Guardando...' : `Registrar ${label}`}
      </button>
    </form>
  );
}
