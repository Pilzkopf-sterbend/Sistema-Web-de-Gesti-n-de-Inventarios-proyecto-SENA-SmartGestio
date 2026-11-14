// Qué hace: Atiende la petición HTTP del dashboard.
// Para qué sirve: Entregar las estadísticas generales del inventario.

const dashboardService = require('../services/dashboard.service');

// Qué hace: Obtiene el resumen del inventario.
// Para qué sirve: Alimentar las tarjetas y la tabla del dashboard.
async function summary(req, res) {
  const summary = await dashboardService.getSummary();
  res.json({ summary });
}

module.exports = { summary };