# Organizador de Comercio

Aplicacion web para gestionar operaciones comerciales con control por roles, caja, inventario, ventas, compras y configuracion operativa por punto de venta.

## Stack

- Frontend: Next.js 14 + React 18
- Backend: Node.js + Express + Sequelize
- Base de datos: PostgreSQL
- Autenticacion: JWT + control de permisos por rol

## Funcionalidades principales

- Login con roles `ADMIN` y `VENDEDOR`.
- Dashboard con metricas (ventas, compras, stock y caja).
- Gestion de caja: apertura, cierre y retiros.
- Ventas y compras con detalle de productos e impacto en stock.
- Ajustes de inventario.
- Configuracion:
  - Clientes y proveedores.
  - Productos.
  - Usuarios.
  - Puntos de venta (alta, edicion, activacion/desactivacion).
- Seleccion de punto de venta activo para operar (afecta ventas/compras/caja/stock).
- Expiracion de sesion por 24 horas de inactividad en frontend.

## Estructura del proyecto

```text
.
├─ backend/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ utils/
│  │  ├─ app.js
│  │  └─ server.js
│  └─ package.json
├─ frontend/
│  ├─ app/
│  ├─ lib/
│  └─ package.json
└─ README.md
```

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- PostgreSQL en ejecucion

## Configuracion de entorno

Crear archivo `backend/.env` con:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=comercio
DB_USER=postgres
DB_PASSWORD=tu_password
DB_LOGGING=false
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=8h
```

Crear archivo `frontend/.env.local` con:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Instalacion

Desde la raiz del proyecto:

```bash
cd backend
npm install
cd ../frontend
npm install
```

## Ejecucion en desarrollo

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:3001` (o puerto asignado por Next)  
Backend healthcheck: `http://localhost:3000/health`

## Usuarios demo

- Admin:
  - Email: `admin@comercio.local`
  - Password: `admin123`
- Vendedor:
  - Email: `vendedor@comercio.local`
  - Password: `vendedor123`

Estos usuarios se generan automaticamente en el seed inicial del backend.

## Scripts disponibles

### Backend

- `npm run dev`: levanta backend con nodemon
- `npm start`: levanta backend en modo normal

### Frontend

- `npm run dev`: levanta Next.js en desarrollo
- `npm run build`: build de produccion
- `npm run start`: levanta build de produccion
- `npm run lint`: lint de frontend

## Notas tecnicas

- El backend ejecuta `sequelize.sync({ force: false })` al iniciar.
- Tambien asegura columnas faltantes en tablas clave durante bootstrap.
- Rutas protegidas usan JWT Bearer en `Authorization`.
- Permisos:
  - Lectura comercial: `ADMIN`, `VENDEDOR`
  - Escritura administrativa: `ADMIN`
  - Escritura comercial (ventas/compras/operacion): `ADMIN`, `VENDEDOR`

## Flujo recomendado de uso

1. Iniciar sesion.
2. Seleccionar punto de venta activo.
3. Abrir caja (si corresponde).
4. Operar ventas/compras.
5. Cerrar caja al finalizar.

## Estado actual

Proyecto funcional para entorno local y pruebas operativas internas.
