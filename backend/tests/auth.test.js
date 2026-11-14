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

const existingUser = {
  nombre: 'Admin Demo',
  email: 'admin@demo.com',
  password: '123456'
};

async function seedUser() {
  const user = new User({
    nombre: existingUser.nombre,
    email: existingUser.email,
    passwordHash: existingUser.password
  });
  return user.save();
}

describe('RF-001 - Autenticación', () => {
  describe('CA-001 - Acceso con credenciales válidas', () => {
    test('devuelve 200 con token y usuario sin passwordHash', async () => {
      await seedUser();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: existingUser.email, password: existingUser.password });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe(existingUser.email);
      expect(res.body.user.passwordHash).toBeUndefined();
    });
  });

  describe('CA-002 - Acceso denegado con credenciales incorrectas', () => {
    test('rechaza contraseña incorrecta con 401', async () => {
      await seedUser();

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: existingUser.email, password: 'incorrecta' });

      expect(res.status).toBe(401);
      expect(res.body.token).toBeUndefined();
    });

    test('rechaza email inexistente con 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noexiste@demo.com', password: '123456' });

      expect(res.status).toBe(401);
    });

    test('rechaza campos vacíos con 400', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('CA-003 - Ruta protegida sin sesión', () => {
    test('devuelve 401 sin token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('devuelve 401 con token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido');
      expect(res.status).toBe(401);
    });

    test('devuelve 200 con token válido y usuario de la sesión', async () => {
      const user = await seedUser();
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: existingUser.email, password: existingUser.password });
      const token = login.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(user.id.toString());
    });
  });
});