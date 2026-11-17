// Qué hace: Genera tokens QR para productos creados antes de esta funcionalidad.
// Para qué sirve: Dejar todas las etiquetas existentes listas para escanear.

const crypto = require('crypto');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/env');
const Product = require('../models/product.model');

async function backfillQr() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a:', MONGODB_URI);

  const products = await Product.find({
    $or: [{ qrToken: { $exists: false } }, { qrToken: null }, { qrToken: '' }]
  });

  // Para qué sirve: Actualizar documento por documento para asignar un UUID distinto.
  for (const product of products) {
    await Product.collection.updateOne(
      { _id: product._id },
      { $set: { qrToken: crypto.randomUUID() } }
    );
  }

  console.log(`Productos actualizados con QR: ${products.length}`);
  await mongoose.disconnect();
}

backfillQr().catch(async (error) => {
  console.error('No se pudo completar el backfill de QR:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
