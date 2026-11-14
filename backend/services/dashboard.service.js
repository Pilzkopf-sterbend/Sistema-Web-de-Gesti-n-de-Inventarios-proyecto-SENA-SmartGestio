// Qué hace: Calcula las estadísticas generales del inventario.
// Para qué sirve: Alimentar el dashboard con totales y movimientos recientes.

const Product = require('../models/product.model');
const Category = require('../models/category.model');
const User = require('../models/user.model');
const Movement = require('../models/movement.model');

// Qué hace: Obtiene los totales y los últimos movimientos.
// Para qué sirve: Mostrar un resumen rápido del estado del inventario.
async function getSummary() {
  const [
    totalProductos,
    totalStock,
    productosStockBajo,
    totalMovimientos,
    totalCategorias,
    totalUsuariosActivos
  ] = await Promise.all([
    Product.countDocuments({ activo: true }),
    Product.aggregate([
      { $match: { activo: true } },
      { $group: { _id: null, total: { $sum: '$cantidadDisponible' } } }
    ]).then((rows) => (rows.length ? rows[0].total : 0)),
    // Para qué sirve: Contar los productos que necesitan reposición.
    Product.countDocuments({
      activo: true,
      $expr: { $lte: ['$cantidadDisponible', '$stockMinimo'] }
    }),
    Movement.countDocuments(),
    Category.countDocuments(),
    User.countDocuments({ activo: true })
  ]);

  // Para qué sirve: Mostrar los últimos movimientos registrados en el sistema.
  const movimientosRecientes = await Movement.find({})
    .sort({ fecha: -1 })
    .limit(10)
    .populate('producto', 'codigo nombre')
    .populate('usuario', 'nombre');

  return {
    totalProductos,
    totalStock,
    productosStockBajo,
    totalMovimientos,
    totalCategorias,
    totalUsuariosActivos,
    movimientosRecientes: movimientosRecientes.map((m) => m.toSafeObject())
  };
}

module.exports = { getSummary };