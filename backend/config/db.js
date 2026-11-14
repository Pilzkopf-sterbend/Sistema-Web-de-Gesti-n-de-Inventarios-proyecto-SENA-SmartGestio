// Qué hace: Gestiona la conexión con MongoDB.
// Para qué sirve: Centralizar la conexión y desconexión de la base de datos.

const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

// Qué hace: Conecta Mongoose con la base de datos.
// Para qué sirve: Habilitar las consultas y guardados del sistema.
async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');
}

// Qué hace: Cierra la conexión con MongoDB.
// Para qué sirve: Liberar recursos al terminar procesos o pruebas.
async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };