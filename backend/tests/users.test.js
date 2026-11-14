const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/user.model');

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
  await User.deleteMany({});
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

const USER_BODY = { nombre: 'Juan Pérez', email: 'juan@demo.com', password: '123456' };

describe('RF-002 - Gestión de usuarios', () => {
  test('CA-004 - Email duplicado se rechaza con 409', async () => {
    const adminUser = await seedAdmin();
    const token = await getToken();

    const first = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Otro', email: admin.email, password: '123456' });
    expect(first.status).toBe(409);

    const duplicate = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...USER_BODY });
    expect(duplicate.status).toBe(201);

    const again = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...USER_BODY });
    expect(again.status).toBe(409);
    expect(adminUser).toBeTruthy();
  });

  test('CA-005 - No se puede desactivar la propia cuenta (400)', async () => {
    const adminUser = await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .delete(`/api/users/${adminUser.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    const stillActive = await User.findById(adminUser.id);
    expect(stillActive.activo).toBe(true);
  });

  test('crear usuario devuelve 201 sin passwordHash', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(USER_BODY);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(USER_BODY.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('crear usuario sin campos obligatorios devuelve 400', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'solocorreo@demo.com' });

    expect(res.status).toBe(400);
  });

  test('crear usuario con contraseña corta devuelve 400', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...USER_BODY, password: '123' });

    expect(res.status).toBe(400);
  });

  test('listar usuarios devuelve la lista sin contraseñas', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(1);
    expect(res.body.users[0].passwordHash).toBeUndefined();
  });

  test('consultar usuario inexistente devuelve 404', async () => {
    await seedAdmin();
    const token = await getToken();

    const res = await request(app)
      .get('/api/users/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('editar usuario actualiza sus datos', async () => {
    await seedAdmin();
    const token = await getToken();
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(USER_BODY);

    const res = await request(app)
      .put(`/api/users/${created.body.user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Juan Actualizado' });

    expect(res.status).toBe(200);
    expect(res.body.user.nombre).toBe('Juan Actualizado');
  });

  test('desactivar otro usuario lo marca inactivo (200)', async () => {
    await seedAdmin();
    const token = await getToken();
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(USER_BODY);

    const res = await request(app)
      .delete(`/api/users/${created.body.user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.activo).toBe(false);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: USER_BODY.email, password: USER_BODY.password });
    expect(loginRes.status).toBe(401);
  });
});