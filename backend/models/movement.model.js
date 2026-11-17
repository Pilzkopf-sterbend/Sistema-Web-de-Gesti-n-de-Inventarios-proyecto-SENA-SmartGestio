// Qué hace: Define el esquema de los movimientos de inventario.
// Para qué sirve: Registrar entradas y salidas con su producto y usuario.

const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto es obligatorio']
    },
    tipo: {
      type: String,
      enum: ['entrada', 'salida'],
      required: [true, 'El tipo es obligatorio']
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad debe ser mayor que cero']
    },
    // Para qué sirve: Dejar constancia de cuándo ocurrió el movimiento.
    fecha: {
      type: Date,
      default: Date.now
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es obligatorio']
    },
    observacion: {
      type: String,
      trim: true
    },
    // Para qué sirve: Conservar la trazabilidad de las existencias antes y después.
    stockAnterior: {
      type: Number,
      min: [0, 'El stock anterior no puede ser negativo']
    },
    stockPosterior: {
      type: Number,
      min: [0, 'El stock posterior no puede ser negativo']
    },
    // Para qué sirve: Evitar movimientos duplicados cuando el cliente reintenta un envío.
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
      trim: true,
      maxlength: [120, 'La clave de idempotencia es demasiado larga']
    }
  },
  { timestamps: true }
);

// Qué hace: Convierte el movimiento en un objeto público.
// Para qué sirve: Enviar al frontend solo los datos necesarios.
movementSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    producto: this.producto,
    tipo: this.tipo,
    cantidad: this.cantidad,
    fecha: this.fecha,
    usuario: this.usuario,
    observacion: this.observacion,
    stockAnterior: this.stockAnterior,
    stockPosterior: this.stockPosterior
  };
};

module.exports = mongoose.model('Movement', movementSchema);