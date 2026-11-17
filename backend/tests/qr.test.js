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
  // Para qué sirve: Asegurar los índices únicos usados por QR e idempotencia.
  await Promise.all([Product.init(), Movement.init()]);
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

const admin = { nombre: 'Admin QR', email: 'admin-qr@demo.com', password: '123456' };

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
  const category = await Category.create({
    nombre: `QR Test ${overrides.codigo || 'QR001'}`
  });
  const product = await Product.create({
    codigo: 'QR001',
    nombre: 'Producto QR',
    categoria: category.id,
    cantidadDisponible: 10,
    stockMinimo: 2,
    ...overrides
  });
  return { category, product };
}

describe('RF-012 - Generación y consulta de QR', () => {
  test('CA-018 - cada producto recibe un token QR único', async () => {
    const { product: first } = await seedProduct();
    const { product: second } = await seedProduct({
      codigo: 'QR002',
      nombre: 'Producto QR 2'
    });

    expect(first.qrToken).toBeTruthy();
    expect(second.qrToken).toBeTruthy();
    expect(first.qrToken).not.toBe(second.qrToken);
  });

  test('CA-019/CA-020 - el QR contiene solo el token opaco', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();

    const res = await request(app)
      .get(`/api/products/${product.id}/qr`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.qr.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(res.body.qr.content).toBe(product.qrToken);
    expect(res.body.qr.content).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(res.body.qr.content).not.toContain(product.nombre);
    expect(res.body.product.nombre).toBe('Producto QR');
  });

  test('genera el token de un producto antiguo al consultar su QR', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();

    await Product.collection.updateOne(
      { _id: product._id },
      { $unset: { qrToken: '' } }
    );

    const res = await request(app)
      .get(`/api/products/${product.id}/qr`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.qr.content).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    const updated = await Product.findById(product.id);
    expect(updated.qrToken).toBe(res.body.qr.content);
  });

  test('CA-021 - consulta el producto activo por token', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();

    const res = await request(app)
      .get(`/api/products/qr/${product.qrToken}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.product.id).toBe(product.id);
    expect(res.body.product.cantidadDisponible).toBe(10);
  });

  test('CA-022 - token inválido o producto inactivo devuelve 404', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();

    const invalid = await request(app)
      .get('/api/products/qr/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(invalid.status).toBe(404);

    const malformed = await request(app)
      .get('/api/products/qr/no-es-un-token')
      .set('Authorization', `Bearer ${token}`);
    expect(malformed.status).toBe(404);

    await Product.updateOne({ _id: product.id }, { activo: false });
    const inactive = await request(app)
      .get(`/api/products/qr/${product.qrToken}`)
      .set('Authorization', `Bearer ${token}`);
    expect(inactive.status).toBe(404);
  });

  test('las rutas QR requieren autenticación', async () => {
    const { product } = await seedProduct();

    const withoutToken = await request(app).get(`/api/products/${product.id}/qr`);
    expect(withoutToken.status).toBe(401);

    const scanWithoutToken = await request(app).get(
      `/api/products/qr/${product.qrToken}`
    );
    expect(scanWithoutToken.status).toBe(401);
  });

  test('valida el formato de la imagen del producto', async () => {
    await seedAdmin();
    const token = await getToken();
    const category = await Category.create({ nombre: 'Imagen' });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        codigo: 'IMG001',
        nombre: 'Producto con imagen',
        categoria: category.id,
        cantidadDisponible: 1,
        stockMinimo: 0,
        imagen: 'javascript:alert(1)'
      });

    expect(res.status).toBe(400);
  });
});

describe('RF-014 - Movimientos desde QR e idempotencia', () => {
  test('CA-024/CA-026 - entrada, snapshots e idempotencia', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();
    const idempotencyKey = 'qr-entrada-001';
    const body = {
      producto: product.id,
      tipo: 'entrada',
      cantidad: 3,
      observacion: 'Entrada desde QR',
      idempotencyKey
    };

    const first = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(first.status).toBe(201);
    expect(first.body.movement.stockAnterior).toBe(10);
    expect(first.body.movement.stockPosterior).toBe(13);
    expect(first.body.producto.cantidadDisponible).toBe(13);

    const duplicate = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(duplicate.status).toBe(200);
    expect(duplicate.body.duplicate).toBe(true);
    expect(duplicate.body.movement.id).toBe(first.body.movement.id);

    const updated = await Product.findById(product.id);
    expect(updated.cantidadDisponible).toBe(13);
    expect(await Movement.countDocuments()).toBe(1);

    const conflict = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...body, cantidad: 4 });

    expect(conflict.status).toBe(409);
    expect((await Product.findById(product.id)).cantidadDisponible).toBe(13);
  });

  test('CA-025 - salida desde QR, stock insuficiente e historial', async () => {
    await seedAdmin();
    const token = await getToken();
    const { product } = await seedProduct();

    const salida = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        producto: product.id,
        tipo: 'salida',
        cantidad: 3,
        idempotencyKey: 'qr-salida-001'
      });

    expect(salida.status).toBe(201);
    expect(salida.body.movement.stockAnterior).toBe(10);
    expect(salida.body.movement.stockPosterior).toBe(7);

    const insuficiente = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        producto: product.id,
        tipo: 'salida',
        cantidad: 8,
        idempotencyKey: 'qr-salida-002'
      });

    expect(insuficiente.status).toBe(400);
    expect((await Product.findById(product.id)).cantidadDisponible).toBe(7);

    const history = await request(app)
      .get(`/api/movements?producto=${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(history.status).toBe(200);
    expect(history.body.movements.length).toBe(1);
    expect(history.body.movements[0].stockAnterior).toBe(10);
    expect(history.body.movements[0].stockPosterior).toBe(7);
  });
});
