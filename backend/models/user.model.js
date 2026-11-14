// Qué hace: Define el esquema de los usuarios.
// Para qué sirve: Guardar las cuentas y validar el acceso al sistema.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'El email no es válido']
    },
    // Para qué sirve: Guardar la contraseña cifrada, nunca en texto plano.
    passwordHash: {
      type: String,
      required: true
    },
    rol: {
      type: String,
      enum: ['admin'],
      default: 'admin'
    },
    // Para qué sirve: Permitir desactivar usuarios sin borrarlos.
    activo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Qué hace: Compara una contraseña escrita con la contraseña cifrada.
// Para qué sirve: Validar el inicio de sesión sin exponer la contraseña real.
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Qué hace: Convierte el usuario en un objeto público.
// Para qué sirve: Evitar enviar la contraseña cifrada al frontend.
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    nombre: this.nombre,
    email: this.email,
    rol: this.rol,
    activo: this.activo
  };
};

// Qué hace: Cifra la contraseña antes de guardar el usuario.
// Para qué sirve: Proteger las credenciales si la base de datos es comprometida.
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);