// Qué hace: Centraliza las respuestas de error de la API.
// Para qué sirve: Devolver mensajes claros y códigos HTTP coherentes.

const { ApiError } = require('../utils/apiError');

// Qué hace: Responde cuando una ruta no existe.
// Para qué sirve: Informar al cliente que la dirección solicitada no está disponible.
function notFound(req, res) {
  res.status(404).json({ message: 'Recurso no encontrado' });
}

// Qué hace: Traduce los errores conocidos a respuestas HTTP.
// Para qué sirve: Evitar que los detalles internos lleguen al cliente.
function errorHandler(err, req, res, next) {
  // Para qué sirve: Respetar el estado y el mensaje de los errores controlados.
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }
  // Para qué sirve: Mostrar los mensajes de validación de Mongoose.
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  // Para qué sirve: Tratar un id con formato inválido como recurso no encontrado.
  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Recurso no encontrado' });
  }
  // Para qué sirve: Informar cuando un valor único ya está registrado.
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ message: `El valor ya existe: ${field}` });
  }
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
}

module.exports = { notFound, errorHandler };