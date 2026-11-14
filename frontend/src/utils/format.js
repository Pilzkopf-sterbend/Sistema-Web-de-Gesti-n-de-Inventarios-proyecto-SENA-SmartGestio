// Qué hace: Da formato a fechas y valores monetarios.
// Para qué sirve: Mostrar la información de forma legible para el usuario.

// Qué hace: Convierte una fecha en texto con formato colombiano.
// Para qué sirve: Mostrar la fecha y hora de los movimientos.
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Qué hace: Convierte un número en pesos colombianos.
// Para qué sirve: Mostrar los precios de los productos de forma clara.
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '-';
  return Number(value).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}