// Qué hace: Envuelve una función asíncrona de Express.
// Para qué sirve: Capturar sus errores y enviarlos al middleware de errores.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;