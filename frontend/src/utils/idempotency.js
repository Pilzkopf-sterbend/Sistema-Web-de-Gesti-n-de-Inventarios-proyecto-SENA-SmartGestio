// Qué hace: Genera una clave única para un envío de movimiento.
// Para qué sirve: Permitir reintentos seguros sin duplicar entradas o salidas.

export function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `mov-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
