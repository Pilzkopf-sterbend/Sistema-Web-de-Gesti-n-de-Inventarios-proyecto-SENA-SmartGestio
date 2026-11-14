// Qué hace: Configura y arranca el servidor Express.
// Para qué sirve: Exponer la API del sistema de inventario.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { PORT } = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const movementRoutes = require('./routes/movement.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Para qué sirve: Permitir peticiones del frontend y leer cuerpos JSON.
app.use(cors());
app.use(express.json());

// Qué hace: Responde con un mensaje de bienvenida.
// Para qué sirve: Comprobar que la API está en funcionamiento.
app.get('/', (req, res) => {
  res.json({ message: 'Sistema Web de Gestión de Inventarios - API' });
});

// Para qué sirve: Agrupar los endpoints por recurso del sistema.
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Para qué sirve: Manejar rutas inexistentes y errores de forma centralizada.
app.use(notFound);
app.use(errorHandler);

// Qué hace: Conecta la base de datos y pone a escuchar el servidor.
// Para qué sirve: Iniciar la API cuando se ejecuta el archivo directamente.
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Para qué sirve: Evitar iniciar el servidor cuando se importa en las pruebas.
if (require.main === module) {
  startServer();
}

module.exports = app;