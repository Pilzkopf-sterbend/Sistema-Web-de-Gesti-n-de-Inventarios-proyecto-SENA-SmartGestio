// Qué hace: Atiende las peticiones HTTP de movimientos.
// Para qué sirve: Conectar las rutas con el servicio de entradas y salidas.

const movementService = require('../services/movement.service');

// Qué hace: Registra una entrada o salida de inventario.
// Para qué sirve: Actualizar el stock usando el usuario autenticado.
async function create(req, res) {
  const result = await movementService.createMovement({
    producto: req.body.producto,
    tipo: req.body.tipo,
    cantidad: req.body.cantidad,
    // Para qué sirve: Asociar el movimiento al usuario que inició sesión.
    usuario: req.user.id,
    observacion: req.body.observacion
  });
  res.status(201).json(result);
}

// Qué hace: Lista los movimientos con los filtros de la URL.
// Para qué sirve: Consultar el historial por producto, tipo o rango de fechas.
async function list(req, res) {
  const movements = await movementService.listMovements({
    producto: req.query.producto,
    tipo: req.query.tipo,
    fechaInicio: req.query.fechaInicio,
    fechaFin: req.query.fechaFin
  });
  res.json({ movements });
}

module.exports = { create, list };