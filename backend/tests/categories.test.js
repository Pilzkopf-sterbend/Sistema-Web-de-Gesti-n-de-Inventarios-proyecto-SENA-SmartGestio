const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/user.model');
const Category = require('../models/category.model');
const Product = require('../models/product.model');

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
    Product.deleteMany({})
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

describe('RF-003 - Gestión de categorías', () => {
  test('crear categoría devuelve 201', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Lácteos', descripcion: 'Productos lácteos' });

    expect(res.status).toBe(201);
    expect(res.body.category.nombre).toBe('Lácteos');
  });

  test('nombre de categoría duplicado devuelve 409 (RN-010)', async () => {
    await seedAdmin();
    const token = await getToken();

    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Lácteos' });

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Lácteos' });

    expect(res.status).toBe(409);
  });

  test('crear categoría sin nombre devuelve 400', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('CA-006 - eliminar categoría con productos devuelve 409 (RN-011)', async () => {
    await seedAdmin();
    const token = await getToken();

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Bebidas' });
    const categoryId = categoryRes.body.category.id;

    const product = new Product({
      codigo: 'P001',
      nombre: 'Jugo de naranja',
      categoria: categoryId,
      cantidadDisponible: 10,
      stockMinimo: 2
    });
    await product.save();

    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    const stillExists = await Category.findById(categoryId);
    expect(stillExists).toBeTruthy();
  });

  test('eliminar categoría sin productos devuelve 200', async () => {
    await seedAdmin();
    const token = await getToken();

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Granos' });

    const res = await request(app)
      .delete(`/api/categories/${categoryRes.body.category.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test('listar categorías devuelve la lista ordenada', async () => {
    await seedAdmin();
    const token = await getToken();

    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Bebidas' });
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Aseo' });

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.categories.map((c) => c.nombre)).toEqual(['Aseo', 'Bebidas']);
  });

  test('editar categoría actualiza sus datos', async () => {
    await seedAdmin();
    const token = await getToken();

    const categoryRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Cárnicos' });

    const res = await request(app)
      .put(`/api/categories/${categoryRes.body.category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Carnes' });

    expect(res.status).toBe(200);
    expect(res.body.category.nombre).toBe('Carnes');
  });
});