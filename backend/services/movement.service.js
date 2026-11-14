// Qué hace: Registra y consulta los movimientos de inventario.
// Para qué sirve: Mantener el stock actualizado mediante entradas y salidas.

const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Movement = require('../models/movement.model');
const { ApiError } = require('../utils/apiError');

// Qué hace: Convierte un texto en una fecha válida.
// Para qué sirve: Validar los filtros de fecha antes de consultar movimientos.
function parseDate(value, fieldName) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `Fecha inválida: ${fieldName}`);
  }
  return date;
}

// Qué hace: Registra una entrada o salida y actualiza el stock.
// Para qué sirve: Mantener el inventario sincronizado y evitar existencias negativas.
async function createMovement({ producto, tipo, cantidad, usuario, observacion }) {
  if (!['entrada', 'salida'].includes(tipo)) {
    throw new ApiError(400, 'El tipo debe ser entrada o salida');
  }
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    throw new ApiError(400, 'La cantidad debe ser un número entero mayor que cero');
  }
  if (!mongoose.isValidObjectId(producto)) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  const product = await Product.findById(producto);
  if (!product || !product.activo) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  // Para qué sirve: Actualizar el stock de forma atómica y evitar condiciones de carrera.
  let updatedProduct;
  if (tipo === 'entrada') {
    updatedProduct = await Product.findOneAndUpdate(
      { _id: producto, activo: true },
      { $inc: { cantidadDisponible: cantidad } },
      { new: true }
    );
  } else {
    updatedProduct = await Product.findOneAndUpdate(
      { _id: producto, activo: true, cantidadDisponible: { $gte: cantidad } },
      { $inc: { cantidadDisponible: -cantidad } },
      { new: true }
    );
    if (!updatedProduct) {
      throw new ApiError(
        400,
        `Stock insuficiente: disponible ${product.cantidadDisponible}`
      );
    }
  }

  if (!updatedProduct) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  try {
    const movement = new Movement({ producto, tipo, cantidad, usuario, observacion });
    await movement.save();
    return {
      message: 'Movimiento registrado con éxito',
      movement: movement.toSafeObject(),
      producto: updatedProduct.toSafeObject()
    };
  } catch (error) {
    // Para qué sirve: Revertir el stock si el movimiento no se pudo guardar.
    await Product.updateOne(
      { _id: producto },
      { $inc: { cantidadDisponible: tipo === 'entrada' ? -cantidad : cantidad } }
    );
    throw error;
  }
}

// Qué hace: Lista los movimientos con filtros por producto, tipo y fecha.
// Para qué sirve: Consultar el historial de entradas y salidas del inventario.
async function listMovements({ producto, tipo, fechaInicio, fechaFin } = {}) {
  const filter = {};

  if (producto) {
    filter.producto = producto;
  }
  if (tipo) {
    if (!['entrada', 'salida'].includes(tipo)) {
      throw new ApiError(400, 'El tipo debe ser entrada o salida');
    }
    filter.tipo = tipo;
  }
  if (fechaInicio || fechaFin) {
    filter.fecha = {};
    if (fechaInicio) {
      filter.fecha.$gte = parseDate(fechaInicio, 'fechaInicio');
    }
    if (fechaFin) {
      const end = parseDate(fechaFin, 'fechaFin');
      filter.fecha.$lte = new Date(end.setHours(23, 59, 59, 999));
    }
  }

  const movements = await Movement.find(filter)
    .sort({ fecha: -1 })
    .populate('producto', 'codigo nombre')
    .populate('usuario', 'nombre email');

  return movements.map((movement) => movement.toSafeObject());
}

module.exports = { createMovement, listMovements };