// Qué hace: Crea y verifica tokens JWT.
// Para qué sirve: Mantener la sesión del usuario autenticado de forma segura.

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

// Qué hace: Genera un token con el id del usuario.
// Para qué sirve: Identificar al usuario en las siguientes peticiones.
function signToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Qué hace: Verifica y decodifica un token JWT.
// Para qué sirve: Comprobar que la sesión es válida antes de acceder a rutas protegidas.
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };