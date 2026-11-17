# Sistema Web de Gestión de Inventarios

Sistema web para la administración de productos y existencias de un inventario. Permite organizar productos por categorías, registrar entradas y salidas, consultar el historial de movimientos, identificar productos con stock bajo y visualizar un resumen general del inventario.

Proyecto académico del programa **Técnico en Programación de Software** del **SENA**.

## Alcance

El sistema cubre autenticación, gestión de usuarios, categorías, productos, entradas y salidas de inventario, consulta de movimientos, etiquetas QR y un panel de control. Está diseñado para una instancia local y una sola organización, con un único rol `admin`.

No incluye módulos de ventas, proveedores, facturación, contabilidad, nómina, aplicación móvil, analítica avanzada ni integraciones externas.

## Funcionalidades

| Módulo | Funcionalidades principales |
|---|---|
| Autenticación | Inicio y cierre de sesión; rutas protegidas mediante JWT. |
| Usuarios | Listado, creación, edición y desactivación; email único; contraseña mínima de 6 caracteres; no permite desactivar la cuenta propia. |
| Categorías | Listado, creación, edición y eliminación; nombre único; no permite eliminar categorías con productos activos asociados. |
| Productos | Listado, búsqueda por nombre o código, filtro por categoría y por stock bajo; creación, edición y eliminación; código único; control de stock mínimo y unidad de medida. |
| Movimientos | Registro de entradas y salidas; actualización automática del stock; validación de stock suficiente; historial con filtros por producto, tipo y rango de fechas; stock anterior y posterior; idempotencia por clave. |
| Códigos QR | Token único e inmutable por producto; vista, descarga e impresión de etiqueta; escaneo con cámara, imagen o token manual; consulta de producto e historial. |
| Panel de control | Indicadores de productos, unidades en stock, stock bajo, movimientos, categorías y usuarios activos; últimos 10 movimientos. |
| Interfaz | Mensajes de éxito y error; navegación por módulos; validación de formularios en el cliente y en el servidor. |

### Reglas de negocio principales

- El precio, la cantidad disponible y el stock mínimo no pueden ser negativos.
- Una entrada incrementa la cantidad disponible; una salida la disminuye.
- Una salida no puede superar el stock disponible.
- Todo movimiento debe registrar producto, usuario, fecha, tipo y cantidad.
- Un producto se considera con stock bajo cuando `cantidadDisponible <= stockMinimo`.
- El stock solo se modifica mediante movimientos. La edición de un producto no permite cambiar `cantidadDisponible`.
- Un producto con movimientos asociados se desactiva en lugar de eliminarse.
- Una categoría con productos activos no puede eliminarse.
- El email de usuario, el nombre de categoría y el código de producto son únicos.
- Un usuario no puede desactivar su propia cuenta.
- Cada producto tiene un identificador QR opaco, único e inmutable; el QR no contiene datos comerciales.
- Todo movimiento guarda el stock anterior y posterior.
- Una clave de idempotencia repetida con los mismos datos no duplica el movimiento; con datos diferentes responde 409.
- La cámara requiere HTTPS o `localhost`; si no está disponible se puede usar una imagen o el token manual.

## Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Frontend | React 18.3, React Router 6.26, Bootstrap 5.3 y Vite 6. |
| Backend | Node.js, Express 4.19, Mongoose 8.5, bcryptjs, jsonwebtoken, dotenv, cors y qrcode 1.5. |
| Base de datos | MongoDB. |
| QR | `qrcode` en backend y `html5-qrcode` 2.3 en frontend. |
| Pruebas | Jest 29.7 y Supertest 7.0 (backend). |

## Arquitectura

```text
Navegador
    │
    ▼
Frontend React + Vite (:5173)
    │ HTTP/JSON (REST)
    ▼
Backend Express (:5000)
    │ Mongoose
    ▼
MongoDB (127.0.0.1:27017)
```

El backend se organiza por capas:

```text
routes → controllers → services → models → MongoDB
```

- La capa de `routes` define los endpoints REST y aplica el middleware de autenticación.
- La capa de `controllers` recibe la solicitud, valida los datos de entrada y construye la respuesta HTTP.
- La capa de `services` concentra la lógica de negocio y las validaciones de dominio.
- La capa de `models` define los esquemas de Mongoose, las validaciones y las relaciones.
- La capa de `middleware` gestiona la autenticación, las rutas no encontradas y los errores.
- La capa de `utils` contiene utilidades para JWT, manejo de errores y ejecución asíncrona.

En desarrollo, Vite redirige las solicitudes `/api` al backend en `http://localhost:5000`.

## Estructura del proyecto

```text
SENA-PROYECT/
├── backend/
│   ├── config/          # Conexión a MongoDB y variables de entorno
│   ├── controllers/     # Manejo de solicitudes y respuestas HTTP
│   ├── middleware/      # Autenticación y manejo de errores
│   ├── models/          # Esquemas Mongoose
│   ├── routes/          # Endpoints REST
│   ├── seed/            # Datos de demostración
│   ├── services/        # Lógica de negocio
│   ├── tests/           # Pruebas con Jest y Supertest
│   ├── utils/           # Utilidades (JWT, errores, asyncHandler)
│   ├── .env.example     # Variables de entorno de ejemplo
│   ├── package.json
│   └── server.js        # Punto de entrada de la API
├── frontend/
│   ├── src/
│   │   ├── components/  # Layout, Navbar, escáner y formulario QR
│   │   ├── hooks/       # useAuth, useAlert
│   │   ├── pages/       # Login, Dashboard, Productos, Movimientos, QR, etc.
│   │   ├── services/    # Cliente HTTP y servicios por recurso
│   │   ├── utils/       # Formato de fechas, moneda e idempotencia
│   │   ├── App.jsx      # Definición de rutas
│   │   ├── main.jsx     # Punto de entrada de React
│   │   └── index.css    # Estilos base
│   ├── index.html
│   ├── vite.config.js   # Configuración de Vite y proxy /api
│   └── package.json
├── package.json         # Scripts de arranque unificado
├── .gitignore
└── README.md
```

## Requisitos previos

- Node.js 20 o superior. El proyecto se ha probado con Node.js 24.
- npm, incluido con Node.js.
- MongoDB en ejecución local en `mongodb://127.0.0.1:27017/`.
- Puertos `5000` (backend) y `5173` (frontend) disponibles.

## Instalación

Desde la raíz del proyecto, instale las dependencias de la raíz, del backend y del frontend:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

La instalación de la raíz incorpora `concurrently`, utilizado por el script `npm run dev` para iniciar ambos servidores.

## Configuración

La aplicación funciona con valores por defecto para desarrollo local. Para personalizar la configuración, cree `backend/.env` a partir de `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

En Windows (PowerShell):

```powershell
Copy-Item backend\.env.example backend\.env
```

Variables disponibles:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `5000` | Puerto del servidor Express. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/inventario` | Cadena de conexión a MongoDB. |
| `JWT_SECRET` | `secreto-seguro-cambiar-en-produccion` | Secreto para firmar los tokens JWT. |
| `JWT_EXPIRES_IN` | `8h` | Vigencia de los tokens JWT. |

Si `backend/.env` no existe, se utilizan los valores por defecto definidos en `backend/config/env.js`.

El frontend utiliza `/api` como URL base. En desarrollo, el proxy de Vite redirige esas solicitudes al backend. Para apuntar a un backend diferente, defina `VITE_API_URL` en `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Arranque en desarrollo

Asegúrese de que MongoDB esté en ejecución y ejecute desde la raíz:

```bash
npm run dev
```

El comando inicia:

- Backend Express en `http://localhost:5000`.
- Frontend Vite en `http://localhost:5173`.

Abra `http://localhost:5173` en el navegador. Vite redirige las solicitudes `/api` al backend.

También puede iniciar cada servicio por separado:

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

## Datos de demostración

Para cargar datos de ejemplo:

```bash
npm run seed
```

> **Advertencia:** el seed elimina los documentos existentes de las colecciones `users`, `categories`, `products` y `movements` antes de insertar los datos de demostración. No lo ejecute sobre una base con información que desee conservar.

El seed crea:

- Un usuario administrador.
- Cuatro categorías: Granos, Lácteos, Aseo y Bebidas.
- Cinco productos; uno de ellos (Leche) queda con stock bajo.
- Cuatro movimientos de entrada y salida de ejemplo.

Credenciales del usuario demo:

| Campo | Valor |
|---|---|
| Email | `admin@inventario.com` |
| Contraseña | `admin123` |

Los productos creados antes de la funcionalidad QR pueden recibir su token con:

```bash
npm run qr:backfill
```

El comando solo completa productos sin `qrToken`; no modifica stock ni movimientos.

## Uso básico

1. Inicie MongoDB.
2. Ejecute `npm run seed` si desea cargar los datos de demostración.
3. Ejecute `npm run dev`.
4. Abra `http://localhost:5173` e inicie sesión con las credenciales demo.
5. Use el menú superior para acceder a Panel de control (Dashboard), Productos, Escanear QR, Stock bajo, Movimientos, Categorías y Usuarios.
6. Para modificar el stock, registre un movimiento de entrada o salida. La edición de un producto no cambia la cantidad disponible.
7. Para generar una etiqueta, abra **Productos → QR** y use **Descargar PNG** o **Imprimir etiqueta**.
8. Para operar desde una etiqueta, abra **Escanear QR**, active la cámara y registre entradas o salidas desde la vista del producto.

## API REST

La API se expone en `http://localhost:5000/api`. Todas las rutas bajo `/api`, excepto `POST /api/auth/login`, requieren el encabezado:

```http
Authorization: Bearer <token>
```

### Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Inicia sesión y devuelve un token JWT y los datos del usuario. |
| GET | `/api/auth/me` | Devuelve el usuario autenticado. |
| GET | `/api/users` | Lista los usuarios. |
| POST | `/api/users` | Crea un usuario. |
| GET | `/api/users/:id` | Consulta un usuario por ID. |
| PUT | `/api/users/:id` | Actualiza un usuario. |
| DELETE | `/api/users/:id` | Desactiva un usuario. |
| GET | `/api/categories` | Lista las categorías. |
| POST | `/api/categories` | Crea una categoría. |
| GET | `/api/categories/:id` | Consulta una categoría por ID. |
| PUT | `/api/categories/:id` | Actualiza una categoría. |
| DELETE | `/api/categories/:id` | Elimina una categoría sin productos activos. |
| GET | `/api/products` | Lista los productos activos. Admite `search`, `categoria` y `stock=low`. |
| POST | `/api/products` | Crea un producto. |
| GET | `/api/products/:id` | Consulta un producto por ID. |
| PUT | `/api/products/:id` | Actualiza los datos del producto. No admite `cantidadDisponible`. |
| DELETE | `/api/products/:id` | Elimina el producto o lo desactiva si tiene movimientos. |
| GET | `/api/products/:id/qr` | Devuelve el producto y su imagen QR en data URL. |
| GET | `/api/products/qr/:qrToken` | Consulta un producto activo por su token QR. |
| POST | `/api/movements` | Registra una entrada o una salida. Admite `idempotencyKey`. |
| GET | `/api/movements` | Lista movimientos. Admite `producto`, `tipo`, `fechaInicio` y `fechaFin`. |
| GET | `/api/dashboard/summary` | Devuelve los indicadores y los últimos movimientos. |

La actualización de productos no acepta `cantidadDisponible`; el stock se modifica exclusivamente con `POST /api/movements`.

Parámetros de consulta:

- `GET /api/products?search=arroz&categoria=<id>&stock=low`
- `GET /api/movements?producto=<id>&tipo=entrada&fechaInicio=2026-01-01&fechaFin=2026-01-31`

### Ejemplo de inicio de sesión

```http
POST /api/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "email": "admin@inventario.com",
  "password": "admin123"
}
```

Respuesta:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "<id>",
    "nombre": "Administrador",
    "email": "admin@inventario.com",
    "rol": "admin",
    "activo": true
  }
}
```

El contrato detallado de la API, incluidos los códigos de estado y los cuerpos de solicitud, está documentado en [`design/api.md`](design/api.md).

## Modelo de datos

| Entidad | Campos principales | Relaciones |
|---|---|---|
| Usuario | `nombre`, `email` (único), `passwordHash`, `rol` (`admin`), `activo` | Referenciado por `Movimiento.usuario`. |
| Categoría | `nombre` (único), `descripcion` | Referenciada por `Producto.categoria`. |
| Producto | `codigo` (único), `nombre`, `descripcion`, `precio`, `cantidadDisponible`, `stockMinimo`, `unidadMedida`, `imagen`, `qrToken` (único), `activo` | Pertenece a una categoría; referenciado por `Movimiento.producto`. |
| Movimiento | `tipo` (`entrada`/`salida`), `cantidad`, `fecha`, `observacion`, `stockAnterior`, `stockPosterior`, `idempotencyKey` | Pertenece a un producto y a un usuario. |

- Las relaciones se implementan mediante referencias de Mongoose (`ref`).
- Las contraseñas se almacenan con hash bcrypt y no se devuelven en las respuestas de la API.
- `unidadMedida` admite `unidades`, `kg`, `litros` y `metros`.

## Pruebas

```bash
npm test
```

Las pruebas usan Jest y Supertest sobre una instancia real de MongoDB. Por defecto se conectan a `mongodb://127.0.0.1:27017/inventario_test` y eliminan la base al finalizar. Para utilizar otra base, defina la variable `MONGODB_URI_TEST`.

La suite actual contiene **56 pruebas en 7 suites** y cubre:

- Autenticación y protección de rutas.
- Gestión de usuarios.
- Gestión de categorías.
- Gestión de productos, incluida la actualización sin modificar el stock.
- Registro de entradas y salidas, validación de stock y consulta de movimientos.
- Generación y consulta de QR, tokens únicos, imagen, seguridad e idempotencia.
- Resumen del panel de control.

No existen pruebas automatizadas de frontend; la interfaz fue verificada manualmente el 2026-11-14, incluido el módulo QR.

## Compilación y ejecución en producción

Para generar la versión compilada del frontend:

```bash
npm run build
```

El resultado se genera en `frontend/dist/`. El backend puede iniciarse en modo producción con:

```bash
npm --prefix backend start
```

El backend expone únicamente la API REST. El contenido de `frontend/dist/` debe servirse con un servidor estático; la configuración de despliegue no forma parte del alcance del proyecto.

## Consideraciones de seguridad

- Las contraseñas se almacenan con hash bcrypt (10 rondas) y no se devuelven en las respuestas.
- La autenticación utiliza JWT con una vigencia por defecto de 8 horas; el token se envía en el encabezado `Authorization: Bearer`.
- Las rutas protegidas verifican el token y que el usuario esté activo.
- El token se almacena en `localStorage` en el navegador.
- La configuración actual está pensada para desarrollo local: CORS está abierto y `JWT_SECRET` tiene un valor por defecto. En producción, defina un secreto seguro, restrinja CORS y utilice HTTPS.
- El QR solo contiene un UUID opaco y su consulta exige JWT; el código impreso no autoriza movimientos por sí solo.
- La cámara se activa con permiso del usuario y requiere HTTPS o `localhost`. Para pruebas móviles puede usarse un túnel HTTPS.


