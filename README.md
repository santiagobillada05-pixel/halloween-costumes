# 🎃 Halloween Costumes Manager — Full-Stack

Stack: **React + Vite + Tailwind** | **Node.js + Express** | **SQLite (better-sqlite3)**

---

## Estructura de carpetas

```
HALLOWEN/
├── backend/          ← API REST Node.js + Express
│   ├── src/
│   │   ├── db/       ← Schema SQL, init, seed, conexión
│   │   ├── routes/   ← costumes.js, transactions.js, bot.js
│   │   ├── middleware/
│   │   └── server.js
│   ├── .env
│   └── package.json
└── frontend/         ← React + Vite + Tailwind CSS
    ├── src/
    │   ├── components/
    │   ├── services/api.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## ▶️ Pasos para ejecutar en local (primera vez)

### 1. Instalar dependencias

```bash
# Abrir terminal en la carpeta HALLOWEN
cd backend
npm install

cd ../frontend
npm install
```

### 2. Inicializar la base de datos SQLite

```bash
cd backend
npm run db:init    # Crea el archivo halloween.db con las tablas
npm run db:seed    # Carga 6 disfraces + clientes + 1 transacción de ejemplo
```

### 3. Arrancar el backend

```bash
cd backend
npm run dev        # Escucha en http://localhost:3001
```

Verificar: `http://localhost:3001/api/health` debe devolver `{"status":"ok"}`

### 4. Arrancar el frontend

```bash
# Nueva terminal
cd frontend
npm run dev        # Escucha en http://localhost:5173
```

Abrir `http://localhost:5173` en el navegador.

---

## API Endpoints

| Método | Ruta                             | Descripción                     |
|--------|----------------------------------|---------------------------------|
| GET    | /api/health                      | Health check                    |
| GET    | /api/costumes                    | Listar (filtros: search, category, status) |
| GET    | /api/costumes/:id                | Detalle de un disfraz           |
| POST   | /api/costumes                    | Crear disfraz                   |
| PUT    | /api/costumes/:id                | Actualizar disfraz              |
| DELETE | /api/costumes/:id                | Eliminar disfraz                |
| GET    | /api/transactions                | Listar transacciones            |
| POST   | /api/transactions                | Registrar venta/alquiler        |
| GET    | /api/transactions/stats/summary  | Estadísticas de negocio         |
| POST   | /api/bot/chat                    | Consultar al asistente IA       |

---

## 🚀 Build de producción

```bash
# 1. Compilar frontend
cd frontend
npm run build      # Genera frontend/dist/

# 2. Configurar .env del backend
# NODE_ENV=production
# PORT=3001

# 3. Arrancar solo el backend (sirve el frontend compilado)
cd backend
npm start
```

La app completa queda en `http://localhost:3001`

---

## 🗄️ Base de datos

La BD SQLite se guarda en `backend/data/halloween.db`.
- Es un solo archivo portable — cópialo para hacer backup.
- Para resetear todo: elimina `halloween.db` y vuelve a correr `npm run db:init && npm run db:seed`.
