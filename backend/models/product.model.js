// Qué hace: Define el esquema de los productos.
// Para qué sirve: Guardar los datos del inventario y validar el stock.

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: [true, 'El código es obligatorio'],
      unique: true,
      uppercase: true,
      trim: true
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    descripcion: {
      type: String,
      trim: true
    },
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es obligatoria']
    },
    precio: {
      type: Number,
      min: [0, 'El precio no puede ser negativo']
    },
    // Para qué sirve: Controlar las existencias disponibles del producto.
    cantidadDisponible: {
      type: Number,
      required: [true, 'La cantidad disponible es obligatoria'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0
    },
    // Para qué sirve: Avisar cuándo el producto necesita reposición.
    stockMinimo: {
      type: Number,
      required: [true, 'El stock mínimo es obligatorio'],
      min: [0, 'El stock mínimo no puede ser negativo'],
      default: 0
    },
    unidadMedida: {
      type: String,
      enum: ['unidades', 'kg', 'litros', 'metros'],
      default: 'unidades'
    },
    // Para qué sirve: Permitir desactivar productos sin borrar su historial.
    activo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Qué hace: Convierte el producto en un objeto público.
// Para qué sirve: Enviar al frontend solo los datos necesarios.
productSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    codigo: this.codigo,
    nombre: this.nombre,
    descripcion: this.descripcion,
    categoria: this.categoria,
    precio: this.precio,
    cantidadDisponible: this.cantidadDisponible,
    stockMinimo: this.stockMinimo,
    unidadMedida: this.unidadMedida,
    activo: this.activo
  };
};

module.exports = mongoose.model('Product', productSchema);