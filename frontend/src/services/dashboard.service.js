// Qué hace: Consulta las estadísticas del dashboard.
// Para qué sirve: Mostrar los totales y movimientos recientes del inventario.

import { http } from './api';

// Qué hace: Obtiene el resumen general del inventario.
// Para qué sirve: Alimentar las tarjetas y la tabla del dashboard.
export async function getDashboardSummary() {
  const data = await http.get('/dashboard/summary');
  return data.summary;
}