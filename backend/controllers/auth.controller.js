// Qué hace: Atiende las peticiones HTTP de autenticación.
// Para qué sirve: Conectar las rutas de login y perfil con el servicio de autenticación.

const authService = require('../services/auth.service');

// Qué hace: Recibe el correo y la contraseña para iniciar sesión.
// Para qué sirve: Devolver el token y los datos del usuario autenticado.
async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
  }
  const result = await authService.login(email, password);
  if (!result) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }
  res.json(result);
}

// Qué hace: Devuelve el usuario de la sesión actual.
// Para qué sirve: Permitir que el frontend recupere el perfil autenticado.
async function me(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = { login, me };