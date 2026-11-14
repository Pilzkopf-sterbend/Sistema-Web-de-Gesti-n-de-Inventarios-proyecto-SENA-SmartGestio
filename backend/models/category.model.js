// Qué hace: Define el esquema de las categorías.
// Para qué sirve: Agrupar productos y validar sus datos en MongoDB.

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      unique: true,
      trim: true
    },
    descripcion: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Qué hace: Convierte la categoría en un objeto público.
// Para qué sirve: Evitar enviar datos internos de Mongoose al frontend.
categorySchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    nombre: this.nombre,
    descripcion: this.descripcion
  };
};

module.exports = mongoose.model('Category', categorySchema);