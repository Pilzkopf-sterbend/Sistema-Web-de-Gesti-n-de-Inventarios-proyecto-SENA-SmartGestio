const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/user.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const Movement = require('../models/movement.model');

const TEST_URI =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/inventario_test';

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Movement.deleteMany({})
  ]);
});

const admin = { nombre: 'Admin Demo', email: 'admin@demo.com', password: '123456' };

async function seedAdmin() {
  const user = new User({
    nombre: admin.nombre,
    email: admin.email,
    passwordHash: admin.password
  });
  return user.save();
}

async function getToken() {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: admin.password });
  return res.body.token;
}

describe('RF-010 - Dashboard de resumen', () => {
  test('CA-016 - muestra totales de productos, stock bajo y movimientos recientes', async () => {
    const adminUser = await seedAdmin();
    const token = await getToken();

    const category = await Category.create({ nombre: 'Granos' });
    const product1 = await Product.create({
      codigo: 'P001',
      nombre: 'Arroz',
      categoria: category.id,
      cantidadDisponible: 2,
      stockMinimo: 5
    });
    await Product.create({
      codigo: 'P002',
      nombre: 'Lentejas',
      categoria: category.id,
      cantidadDisponible: 30,
      stockMinimo: 5
    });

    await Movement.create({
      producto: product1.id,
      tipo: 'entrada',
      cantidad: 10,
      usuario: adminUser.id
    });
    await Movement.create({
      producto: product1.id,
      tipo: 'salida',
      cantidad: 4,
      usuario: adminUser.id
    });

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.summary.totalProductos).toBe(2);
    expect(res.body.summary.totalStock).toBe(32);
    expect(res.body.summary.productosStockBajo).toBe(1);
    expect(res.body.summary.totalMovimientos).toBe(2);
    expect(res.body.summary.totalCategorias).toBe(1);
    expect(res.body.summary.totalUsuariosActivos).toBe(1);
    expect(res.body.summary.movimientosRecientes.length).toBe(2);
    expect(res.body.summary.movimientosRecientes[0].tipo).toBe('salida');
  });

  test('resumen con datos vacíos devuelve ceros', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.summary.totalProductos).toBe(0);
    expect(res.body.summary.totalStock).toBe(0);
    expect(res.body.summary.totalMovimientos).toBe(0);
  });
});