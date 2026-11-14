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

async function seedProduct(overrides = {}) {
  const category = await Category.create({ nombre: 'Bebidas' });
  const product = await Product.create({
    codigo: 'P001',
    nombre: 'Jugo natural',
    categoria: category.id,
    cantidadDisponible: 10,
    stockMinimo: 2,
    ...overrides
  });
  return { category, product };
}

describe('RF-005/RF-006 - Movimientos de inventario', () => {
  test('CA-009 - entrada aumenta el stock (RN-002)', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();

    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ producto: product.id, tipo: 'entrada', cantidad: 3 });

    expect(res.status).toBe(201);
    expect(res.body.movement.tipo).toBe('entrada');
    expect(res.body.movement.cantidad).toBe(3);
    expect(res.body.producto.cantidadDisponible).toBe(13);

    const updated = await Product.findById(product.id);
    expect(updated.cantidadDisponible).toBe(13);
  });

  test('CA-010 - salida disminuye el stock (RN-003)', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();

    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ producto: product.id, tipo: 'salida', cantidad: 3 });

    expect(res.status).toBe(201);
    expect(res.body.movement.tipo).toBe('salida');
    expect(res.body.producto.cantidadDisponible).toBe(7);

    const updated = await Product.findById(product.id);
    expect(updated.cantidadDisponible).toBe(7);
  });

  test('CA-011 - salida superior al stock se rechaza (RN-004)', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct({ cantidadDisponible: 5 });

    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ producto: product.id, tipo: 'salida', cantidad: 8 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Stock insuficiente');

    const updated = await Product.findById(product.id);
    expect(updated.cantidadDisponible).toBe(5);
    const movementCount = await Movement.countDocuments();
    expect(movementCount).toBe(0);
  });

  test('cantidad cero o negativa se rechaza (400)', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();

    const zero = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ producto: product.id, tipo: 'entrada', cantidad: 0 });
    expect(zero.status).toBe(400);

    const negative = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ producto: product.id, tipo: 'entrada', cantidad: -2 });
    expect(negative.status).toBe(400);
  });

  test('tipo inválido se rechaza (400)', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();

    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ producto: product.id, tipo: 'ajuste', cantidad: 1 });

    expect(res.status).toBe(400);
  });

  test('producto inexistente devuelve 404 (RN-005)', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ producto: '000000000000000000000000', tipo: 'entrada', cantidad: 1 });

    expect(res.status).toBe(404);
  });

  test('CA-013 - consulta de movimientos registra fecha, tipo, cantidad, producto y usuario', async () => {
    await seedAdmin();
    const adminUser = await User.findOne({ email: admin.email });
    const token = await getToken();
    const { product } = await seedProduct();

    await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ producto: product.id, tipo: 'entrada', cantidad: 5 });
    await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ producto: product.id, tipo: 'salida', cantidad: 2 });

    const res = await request(app)
      .get('/api/movements')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.movements.length).toBe(2);
    const movement = res.body.movements[0];
    expect(movement.fecha).toBeTruthy();
    expect(movement.tipo).toBe('salida');
    expect(movement.cantidad).toBe(2);
    expect(movement.producto.nombre).toBe('Jugo natural');
    expect(movement.usuario._id.toString()).toBe(adminUser.id.toString());
  });

  test('CA-014 - filtro de movimientos por rango de fechas', async () => {
    await seedAdmin();
    const adminUser = await User.findOne({ email: admin.email });
    const token = await getToken();
    const { product } = await seedProduct();

    await Movement.create({
      producto: product.id,
      tipo: 'entrada',
      cantidad: 1,
      usuario: adminUser.id,
      fecha: new Date('2026-01-05T10:00:00.000Z')
    });
    await Movement.create({
      producto: product.id,
      tipo: 'salida',
      cantidad: 1,
      usuario: adminUser.id,
      fecha: new Date('2026-02-10T10:00:00.000Z')
    });

    const res = await request(app)
      .get('/api/movements?fechaInicio=2026-01-01&fechaFin=2026-01-31')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.movements.length).toBe(1);
    expect(res.body.movements[0].tipo).toBe('entrada');
  });

  test('filtro por tipo de movimiento', async () => {
    await seedAdmin();
    const adminUser = await User.findOne({ email: admin.email });
    const token = await getToken();
    const { product } = await seedProduct();

    await Movement.create({
      producto: product.id,
      tipo: 'entrada',
      cantidad: 1,
      usuario: adminUser.id
    });
    await Movement.create({
      producto: product.id,
      tipo: 'salida',
      cantidad: 1,
      usuario: adminUser.id
    });

    const res = await request(app)
      .get('/api/movements?tipo=entrada')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.movements.length).toBe(1);
    expect(res.body.movements[0].tipo).toBe('entrada');
  });

  test('RN-009 - no existen endpoints para editar o eliminar movimientos', async () => {
    await seedAdmin();
    const token = await getToken();

    const putRes = await request(app)
      .put('/api/movements/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ cantidad: 5 });
    expect(putRes.status).toBe(404);

    const delRes = await request(app)
      .delete('/api/movements/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(404);
  });
});