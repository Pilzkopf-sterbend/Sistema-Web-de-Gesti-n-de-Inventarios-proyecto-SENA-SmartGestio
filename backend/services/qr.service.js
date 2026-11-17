// Qué hace: Gestiona los identificadores y las imágenes QR de los productos.
// Para qué sirve: Consultar un producto escaneado y generar su etiqueta QR.

const crypto = require('crypto');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Product = require('../models/product.model');
const { ApiError } = require('../utils/apiError');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Qué hace: Comprueba que el token tenga el formato UUID esperado.
// Para qué sirve: Evitar consultas arbitrarias con tokens manipulados.
function isValidQrToken(qrToken) {
  return typeof qrToken === 'string' && UUID_REGEX.test(qrToken);
}

// Qué hace: Genera un token QR para productos creados antes de esta funcionalidad.
// Para qué sirve: Garantizar que todo producto existente tenga una etiqueta válida.
async function ensureQrToken(product) {
  if (product.qrToken) {
    return product.qrToken;
  }

  const qrToken = crypto.randomUUID();
  await Product.collection.updateOne(
    { _id: product._id },
    { $set: { qrToken } }
  );
  return qrToken;
}

// Qué hace: Busca un producto activo por su token QR.
// Para qué sirve: Resolver el escaneo sin exponer otros datos en el código.
async function getProductByQrToken(qrToken) {
  if (!isValidQrToken(qrToken)) {
    throw new ApiError(404, 'Código QR inválido o producto no encontrado');
  }

  const product = await Product.findOne({ qrToken, activo: true }).populate(
    'categoria',
    'nombre'
  );
  if (!product) {
    throw new ApiError(404, 'Código QR inválido o producto no encontrado');
  }
  return product.toSafeObject();
}

// Qué hace: Obtiene el producto y genera su imagen QR.
// Para qué sirve: Mostrar, descargar e imprimir la etiqueta del producto.
async function getProductQr(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  const product = await Product.findById(id).populate('categoria', 'nombre');
  if (!product) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  const qrToken = await ensureQrToken(product);
  const dataUrl = await QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  return {
    product: product.toSafeObject(),
    qr: {
      token: qrToken,
      content: qrToken,
      dataUrl
    }
  };
}

module.exports = { getProductByQrToken, getProductQr };
