// Qué hace: Define un error con código de estado HTTP.
// Para qué sirve: Enviar respuestas de error claras desde cualquier parte del backend.
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { ApiError };