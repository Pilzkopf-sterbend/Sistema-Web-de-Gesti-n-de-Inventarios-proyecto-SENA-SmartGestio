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

async function seedCategory(token, nombre = 'Lácteos') {
  const res = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre });
  return res.body.category;
}

function productBody(categoria) {
  return {
    codigo: 'P001',
    nombre: 'Leche entera',
    descripcion: 'Leche de vaca',
    categoria,
    precio: 4000,
    cantidadDisponible: 10,
    stockMinimo: 3,
    unidadMedida: 'litros'
  };
}

describe('RF-004 - Gestión de productos', () => {
  test('crear producto devuelve 201 con sus datos', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody(categoria));

    expect(res.status).toBe(201);
    expect(res.body.product.codigo).toBe('P001');
    expect(res.body.product.nombre).toBe('Leche entera');
  });

  test('CA-007 - código duplicado devuelve 409 (RN-010)', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody(categoria));

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productBody(categoria), nombre: 'Otra marca' });

    expect(res.status).toBe(409);
  });

  test('categoría inexistente devuelve 400 (RN-007)', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody('000000000000000000000000'));

    expect(res.status).toBe(400);
  });

  test('campos obligatorios vacíos devuelven 400', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoria });

    expect(res.status).toBe(400);
  });

  test('no permite modificar el stock vía edición (SUP-007)', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody(categoria));

    const res = await request(app)
      .put(`/api/products/${created.body.product.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cantidadDisponible: 999 });

    expect(res.status).toBe(400);
  });

  test('actualizar producto sin stock conserva la cantidad disponible', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody(categoria));

    const res = await request(app)
      .put(`/api/products/${created.body.product.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Leche descremada', precio: 4500, stockMinimo: 5 });

    expect(res.status).toBe(200);
    expect(res.body.product.nombre).toBe('Leche descremada');
    expect(res.body.product.precio).toBe(4500);
    expect(res.body.product.stockMinimo).toBe(5);
    expect(res.body.product.cantidadDisponible).toBe(10);
  });

  test('CA-012 - listado muestra el stock actual', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody(categoria));

    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].cantidadDisponible).toBe(10);
  });

  test('CA-017 - búsqueda por nombre', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody(categoria));

    const res = await request(app)
      .get('/api/products?search=leche')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);

    const none = await request(app)
      .get('/api/products?search=inexistente')
      .set('Authorization', `Bearer ${token}`);
    expect(none.body.products.length).toBe(0);
  });

  test('CA-017 - búsqueda por código', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody(categoria));

    const res = await request(app)
      .get('/api/products?search=P001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.products.length).toBe(1);
  });

  test('CA-015 - listado stock bajo (RN-008)', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productBody(categoria), cantidadDisponible: 2 });

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productBody(categoria), codigo: 'P002', cantidadDisponible: 50 });

    const res = await request(app)
      .get('/api/products?stock=low')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].codigo).toBe('P001');
  });

  test('CA-008 - eliminar producto sin movimientos lo elimina', async () => {
    await seedAdmin();
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody(categoria));

    const res = await request(app)
      .delete(`/api/products/${created.body.product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Producto eliminado');
    const gone = await Product.findById(created.body.product.id);
    expect(gone).toBeNull();
  });

  test('CA-008 - eliminar producto con movimientos lo desactiva (RN-012)', async () => {
    await seedAdmin();
    const adminUser = await User.findOne({ email: admin.email });
    const token = await getToken();
    const categoria = (await seedCategory(token)).id;

    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productBody(categoria));
    const productId = created.body.product.id;

    await Movement.create({
      producto: productId,
      tipo: 'entrada',
      cantidad: 5,
      usuario: adminUser.id
    });

    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Producto desactivado');
    const stillThere = await Product.findById(productId);
    expect(stillThere).toBeTruthy();
    expect(stillThere.activo).toBe(false);

    const list = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.products.length).toBe(0);
  });
});