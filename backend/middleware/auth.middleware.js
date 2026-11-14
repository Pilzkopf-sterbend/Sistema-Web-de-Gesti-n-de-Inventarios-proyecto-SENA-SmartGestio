// Qué hace: Protege las rutas que requieren sesión.
// Para qué sirve: Verificar el token y cargar el usuario antes de continuar.

const { verifyToken } = require('../utils/jwt');
const User = require('../models/user.model');

// Qué hace: Valida el token Bearer y adjunta el usuario a la petición.
// Para qué sirve: Permitir el acceso solo a usuarios autenticados y activos.
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autenticado: falta el token' });
    }
    const token = header.split(' ')[1];
    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (!user || !user.activo) {
      return res.status(401).json({ message: 'No autenticado: usuario no válido' });
    }
    // Para qué sirve: Dejar el usuario disponible en los controladores.
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

module.exports = auth;