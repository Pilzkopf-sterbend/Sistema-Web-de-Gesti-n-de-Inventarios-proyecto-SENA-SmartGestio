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

// Qué hace: Normaliza la clave de idempotencia recibida.
// Para qué sirve: Evitar claves vacías, inválidas o demasiado largas.
function normalizeIdempotencyKey(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, 'La clave de idempotencia no es válida');
  }

  const key = value.trim();
  if (!key) {
    return undefined;
  }
  if (key.length > 120) {
    throw new ApiError(400, 'La clave de idempotencia es demasiado larga');
  }
  return key;
}

// Qué hace: Comprueba si un movimiento existente tiene los mismos datos.
// Para qué sirve: Distinguir un reintento válido de una clave reutilizada por error.
function isSameMovementPayload(movement, payload) {
  return (
    String(movement.producto) === String(payload.producto) &&
    movement.tipo === payload.tipo &&
    movement.cantidad === payload.cantidad
  );
}

// Qué hace: Prepara la respuesta de un movimiento ya registrado.
// Para qué sirve: Devolver el resultado original sin volver a modificar el stock.
async function buildDuplicateResponse(movement) {
  const product = await Product.findById(movement.producto);
  return {
    message: 'Movimiento ya registrado',
    movement: movement.toSafeObject(),
    producto: product ? product.toSafeObject() : null,
    duplicate: true
  };
}

// Qué hace: Revierte el cambio de stock aplicado antes de un fallo.
// Para qué sirve: Mantener las existencias coherentes si el movimiento no se guarda.
async function compensateStock({ producto, tipo, cantidad }) {
  const delta = tipo === 'entrada' ? -cantidad : cantidad;
  await Product.updateOne({ _id: producto }, { $inc: { cantidadDisponible: delta } });
}

// Qué hace: Registra una entrada o salida y actualiza el stock.
// Para qué sirve: Mantener el inventario sincronizado y evitar existencias negativas.
async function createMovement({
  producto,
  tipo,
  cantidad,
  usuario,
  observacion,
  idempotencyKey
}) {
  if (!['entrada', 'salida'].includes(tipo)) {
    throw new ApiError(400, 'El tipo debe ser entrada o salida');
  }
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    throw new ApiError(400, 'La cantidad debe ser un número entero mayor que cero');
  }
  if (!mongoose.isValidObjectId(producto)) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  const key = normalizeIdempotencyKey(idempotencyKey);
  const payload = { producto, tipo, cantidad };

  if (key) {
    const existing = await Movement.findOne({ idempotencyKey: key });
    if (existing) {
      if (!isSameMovementPayload(existing, payload)) {
        throw new ApiError(
          409,
          'La clave de idempotencia ya fue utilizada con otros datos'
        );
      }
      return buildDuplicateResponse(existing);
    }
  }

  const product = await Product.findById(producto);
  if (!product || !product.activo) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  // Para qué sirve: Actualizar el stock de forma atómica y evitar condiciones de carrera.
  const delta = tipo === 'entrada' ? cantidad : -cantidad;
  const updatedProduct = await Product.findOneAndUpdate(
    tipo === 'entrada'
      ? { _id: producto, activo: true }
      : { _id: producto, activo: true, cantidadDisponible: { $gte: cantidad } },
    { $inc: { cantidadDisponible: delta } },
    { new: true }
  );

  if (!updatedProduct) {
    const currentProduct = await Product.findById(producto);
    if (!currentProduct || !currentProduct.activo) {
      throw new ApiError(404, 'Producto no encontrado');
    }
    throw new ApiError(
      400,
      `Stock insuficiente: disponible ${currentProduct.cantidadDisponible}`
    );
  }

  const stockPosterior = updatedProduct.cantidadDisponible;
  const stockAnterior = stockPosterior - delta;

  try {
    const movement = new Movement({
      producto,
      tipo,
      cantidad,
      usuario,
      observacion,
      stockAnterior,
      stockPosterior,
      idempotencyKey: key
    });
    await movement.save();
    return {
      message: 'Movimiento registrado con éxito',
      movement: movement.toSafeObject(),
      producto: updatedProduct.toSafeObject(),
      duplicate: false
    };
  } catch (error) {
    // Para qué sirve: Revertir el stock si el movimiento no se pudo guardar.
    await compensateStock({ producto, tipo, cantidad }).catch(() => {});

    // Para qué sirve: Resolver la carrera entre dos solicitudes con la misma clave.
    if (error && error.code === 11000 && key) {
      const existing = await Movement.findOne({ idempotencyKey: key });
      if (existing) {
        if (!isSameMovementPayload(existing, payload)) {
          throw new ApiError(
            409,
            'La clave de idempotencia ya fue utilizada con otros datos'
          );
        }
        return buildDuplicateResponse(existing);
      }
    }

    throw error;
  }
}

// Qué hace: Lista los movimientos con filtros por producto, tipo y fecha.
// Para qué sirve: Consultar el historial de entradas y salidas del inventario.
async function listMovements({ producto, tipo, fechaInicio, fechaFin } = {}) {
  const filter = {};

  if (producto) {
    if (!mongoose.isValidObjectId(producto)) {
      throw new ApiError(400, 'El producto del filtro no es válido');
    }
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
