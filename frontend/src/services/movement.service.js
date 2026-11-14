// Qué hace: Realiza las peticiones de movimientos al backend.
// Para qué sirve: Registrar y consultar entradas y salidas del inventario.

import { http } from './api';

// Qué hace: Registra un movimiento de entrada o salida.
// Para qué sirve: Actualizar el stock del producto.
export async function createMovement(movement) {
  const data = await http.post('/movements', movement);
  return data;
}

// Qué hace: Lista los movimientos con filtros opcionales.
// Para qué sirve: Consultar el historial por producto, tipo o fechas.
export async function listMovements(filters = {}) {
  // Para qué sirve: Construir la cadena de filtros de la URL.
  const query = new URLSearchParams();
  if (filters.producto) query.set('producto', filters.producto);
  if (filters.tipo) query.set('tipo', filters.tipo);
  if (filters.fechaInicio) query.set('fechaInicio', filters.fechaInicio);
  if (filters.fechaFin) query.set('fechaFin', filters.fechaFin);
  const qs = query.toString();
  const data = await http.get(`/movements${qs ? `?${qs}` : ''}`);
  return data.movements;
}