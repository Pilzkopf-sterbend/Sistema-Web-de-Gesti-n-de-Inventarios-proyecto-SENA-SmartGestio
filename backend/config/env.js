// Qué hace: Carga y exporta las variables de entorno.
// Para qué sirve: Configurar el puerto, la base de datos y JWT sin repetir valores.
// Los valores por defecto permiten ejecutar en local, pero deben cambiarse en producción.

require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventario',
  // Para qué sirve: Firmar los tokens; en producción debe venir de un archivo .env.
  JWT_SECRET: process.env.JWT_SECRET || 'secreto-seguro-cambiar-en-produccion',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h'
};