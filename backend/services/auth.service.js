// Qué hace: Valida las credenciales y genera la sesión del usuario.
// Para qué sirve: Permitir el acceso al sistema solo a usuarios activos.

const User = require('../models/user.model');
const { signToken } = require('../utils/jwt');

// Qué hace: Busca el usuario, compara la contraseña y crea un token.
// Para qué sirve: Iniciar sesión de forma segura y devolver los datos públicos del usuario.
async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.activo) {
    return null;
  }
  const passwordOk = await user.comparePassword(password);
  if (!passwordOk) {
    return null;
  }
  const token = signToken(user);
  return { token, user: user.toSafeObject() };
}

module.exports = { login };