// Qué hace: Carga datos de demostración en la base de datos.
// Para qué sirve: Probar el sistema con usuarios, categorías y productos.
// Advertencia: elimina los datos actuales antes de insertar los de ejemplo.

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/env');
const User = require('../models/user.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const Movement = require('../models/movement.model');
const movementService = require('../services/movement.service');

// Para qué sirve: Mantener las mismas unidades de medida usadas por los productos.
const UNIDADES = ['unidades', 'kg', 'litros', 'metros'];

// Qué hace: Limpia la base de datos y crea los datos de ejemplo.
// Para qué sirve: Dejar el sistema listo para demostraciones y pruebas manuales.
async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a:', MONGODB_URI);

  // Para qué sirve: Evitar duplicados al ejecutar el seed más de una vez.
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Movement.deleteMany({})
  ]);

  // Para qué sirve: Crear el usuario administrador de demostración.
  const admin = await User.create({
    nombre: 'Administrador',
    email: 'admin@inventario.com',
    passwordHash: 'admin123'
  });

  // Para qué sirve: Agrupar los productos de ejemplo por tipo.
  const categoryData = [
    { nombre: 'Granos', descripcion: 'Legumbres y cereales' },
    { nombre: 'Lácteos', descripcion: 'Productos derivados de la leche' },
    { nombre: 'Aseo', descripcion: 'Insumos de limpieza' },
    { nombre: 'Bebidas', descripcion: 'Jugos y gaseosas' }
  ];
  const categories = await Category.insertMany(categoryData);

  // Para qué sirve: Crear productos con stock y niveles mínimos variados.
  const productData = [
    { codigo: 'FR-001', nombre: 'Arroz', descripcion: 'Arroz blanco x500g', cat: categories[0].id, precio: 4200, stock: 20, minimo: 5, u: 'unidades' },
    { codigo: 'FR-002', nombre: 'Lentejas', descripcion: 'Lentejas x500g', cat: categories[0].id, precio: 3800, stock: 15, minimo: 5, u: 'unidades' },
    { codigo: 'FR-003', nombre: 'Leche', descripcion: 'Leche entera x1L', cat: categories[1].id, precio: 4500, stock: 3, minimo: 10, u: 'litros' },
    { codigo: 'FR-004', nombre: 'Jabón', descripcion: 'Jabón de barra', cat: categories[2].id, precio: 1500, stock: 40, minimo: 8, u: 'unidades' },
    { codigo: 'FR-005', nombre: 'Jugo natural', descripcion: 'Jugo de naranja x2L', cat: categories[3].id, precio: 8900, stock: 12, minimo: 6, u: 'litros' }
  ];

  const products = [];
  for (const p of productData) {
    const product = await Product.create({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      categoria: p.cat,
      precio: p.precio,
      cantidadDisponible: p.stock,
      stockMinimo: p.minimo,
      unidadMedida: p.u
    });
    products.push(product);
  }

  // Para qué sirve: Generar un historial inicial de entradas y salidas.
  await movementService.createMovement({
    producto: products[2].id,
    tipo: 'entrada',
    cantidad: 5,
    usuario: admin.id,
    observacion: 'Reposición inicial leche'
  });
  await movementService.createMovement({
    producto: products[2].id,
    tipo: 'salida',
    cantidad: 2,
    usuario: admin.id,
    observacion: 'Salida por venta'
  });
  await movementService.createMovement({
    producto: products[0].id,
    tipo: 'entrada',
    cantidad: 30,
    usuario: admin.id,
    observacion: 'Recepción proveedor'
  });
  await movementService.createMovement({
    producto: products[4].id,
    tipo: 'salida',
    cantidad: 4,
    usuario: admin.id,
    observacion: 'Salida por venta'
  });

  console.log('Seed completado.');
  console.log('Usuario demo:', admin.email, '/ admin123');
  console.log(`Productos: ${products.length}, Categorías: ${categories.length}`);

  // Para qué sirve: Cerrar la conexión al terminar la carga.
  await mongoose.disconnect();
}

// Para qué sirve: Ejecutar el seed y salir con un código de éxito o error.
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error en el seed:', error);
    process.exit(1);
  });