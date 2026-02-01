# reclamofacil-server — API REST multi-tenant

API REST para gestión de Libro de Reclamaciones con arquitectura SaaS multi-tenant completa. Sistema empresarial de reclamos con RBAC, autenticación híbrida (JWT + API Keys), suscripciones por planes, branding personalizado y notificaciones automatizadas.

**Stack:** Node.js 18+ • Express • Sequelize • MySQL 8 • Redis 7

---

## 🎯 Funcionalidad principal

### Sistema de gestión de reclamos
- **CRUD completo de reclamos** con flujos de estado (pendiente → asignado → resuelto)
- **Gestión de clientes y tutores** para reclamos
- **Catálogos configurables**: tipos de documento, tipos de consumo, tipos de reclamo, monedas
- **Adjuntos de archivos** con validación y almacenamiento seguro
- **Notificaciones por email** automatizadas en cada cambio de estado

### Arquitectura multi-tenant
- **Aislamiento de datos** por tenant (empresa/organización)
- **Resolución de tenant** por subdominio, header `x-tenant`/`x-tenant-slug` o parámetro de ruta
- **Pertenencia de usuarios** vía tabla `user_tenants` con roles por tenant
- **Branding personalizado** (logos, colores, nombre de empresa) por tenant

### Sistema de suscripciones SaaS
- **4 planes disponibles**: Free, Basic, Professional, Enterprise
- **Feature gating**: acceso a funcionalidades según plan (API access, custom branding, etc.)
- **Usage metering**: seguimiento de uso vs límites del plan
- **Rate limiting dinámico**: basado en el plan (30-1000 req/min)
- **Billing endpoints**: upgrade/downgrade de planes, cancelación

### Autenticación y seguridad
- **JWT** para usuarios de la aplicación web
- **API Keys** con scopes para integraciones externas (`claims:read`, `claims:write`)
- **Autenticación híbrida**: endpoints aceptan JWT o API key
- **RBAC por tenant**: roles `admin` y `staff` con permisos diferenciados
- **Auditoría**: logging de todas las operaciones sensibles
- **Rate limiting** por tenant usando Redis
- **CORS configurable** con whitelist de dominios

### Notas rápidas (operación SaaS)
- **Rate limit por plan**: Free 30/min, Basic 60/min, Pro 200/min, Enterprise 1000/min.
- **Feature gating**: middleware `requireFeature` habilita/deniega según plan.
- **Auditoría**: cambios sensibles se registran automáticamente.
- **Billing clave**: `GET /api/tenants/:slug/billing/subscription`, `GET /api/tenants/:slug/billing/usage`, `POST /api/tenants/:slug/billing/upgrade|cancel`.

### Integraciones
- **Endpoints de integración** para crear/consultar reclamos vía API key
- **Sistema de emails** con templates personalizables (HTML)
- **Branding API**: endpoints públicos para obtener logos y colores del tenant
- **Health checks**: monitoreo de estado de BD y servicios

---

## 🏗️ Arquitectura

```
src/
├── app.js              # Punto de entrada, configuración Express
├── config/             # Configuración de BD, Redis, planes, defaults
├── controllers/        # Lógica de negocio (11 controladores)
├── middlewares/        # Auth, validación, rate limiting, feature gates
├── models/             # 12 modelos Sequelize (User, Claim, Tenant, etc.)
├── routes/             # Definición de endpoints (13 archivos)
├── scripts/            # Seeds de inicialización
├── services/           # Email service con templates HTML
└── utils/              # Helpers (JWT, API keys, logger)
```

### Modelos principales
- **Tenant**: empresas/organizaciones (slug, branding, notificaciones)
- **User**: usuarios del sistema (email, password, role)
- **UserTenant**: relación many-to-many con roles por tenant
- **Claim**: reclamos (customer, tipo, descripción, estado, adjuntos)
- **Customer/Tutor**: clientes y sus tutores legales
- **Subscription**: suscripción del tenant (plan, estado, billing cycle)
- **ApiKey**: claves de integración con scopes y hash seguro
- **Catálogos**: DocumentType, ConsumptionType, ClaimType, Currency

---

## 🚀 Inicio rápido

### Requisitos
- **Docker Desktop** (recomendado) o Node 18+, MySQL 8, Redis 7
- Variables de entorno configuradas (ver `.env.example`)

### Opción 1: Docker (recomendado)
Desde la **raíz del monorepo**:
```bash
docker compose build
docker compose up
```

**Servicios disponibles:**
- 🌐 API: http://localhost:3000
- 🎨 Angular: http://localhost:4200
- 🗄️ MySQL: localhost:3306 (DB `reclamofacil_db`)
- ⚡ Redis: localhost:6379
- 📁 Uploads: montados en `uploads/`

### Opción 2: Local (sin Docker)
```bash
cd reclamofacil-server
npm install
npm run dev   # nodemon con hot reload
```
⚠️ Requiere MySQL y Redis levantados localmente.

### Variables de entorno
Copia y configura el archivo `.env`:
```bash
cp .env.example .env
```

**Variables esenciales:**
```env
# Base de datos
DB_HOST=localhost
DB_NAME=reclamofacil_db
DB_USER=root
DB_PASSWORD=

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:4200

# Email (opcional, para notificaciones)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Variables opcionales de branding:**
- `DEFAULT_TENANT_COMPANY_NAME`, `DEFAULT_TENANT_COMPANY_BRAND`, `DEFAULT_TENANT_COMPANY_RUC`
- `DEFAULT_TENANT_PRIMARY_COLOR`, `DEFAULT_TENANT_ACCENT_COLOR`
- `DEFAULT_TENANT_LOGO_LIGHT_PATH`, `DEFAULT_TENANT_LOGO_DARK_PATH`, `DEFAULT_TENANT_FAVICON_PATH`
- `DEFAULT_TENANT_CONTACT_EMAIL`

---

## 🌱 Inicialización de datos

Después de levantar el servidor, ejecuta uno de los seeds:

### Seed completo (recomendado)
```bash
npm run seed
# o con Docker:
docker compose exec server npm run seed
```

**Inicializa:**
- ✅ Catálogos básicos (5 tipos de documento, 2 tipos de consumo, 2 tipos de reclamo, 2 monedas)
- ✅ Tenant por defecto (slug: `default`)
- ✅ Usuario administrador
- ✅ Suscripción plan Free (1 año)
- ✅ **API Key** con scopes `claims:read,claims:write` (se imprime en consola)

**Credenciales por defecto:**
- 📧 Email: `admin@example.com`
- 🔑 Password: `admin123`
- 🔐 API Key: impresa en consola (guárdala)

### Seed mínimo
```bash
npm run seed:default
```
Igual que el completo pero **sin API Key** (útil para desarrollo frontend puro).

### Personalizar credenciales
```bash
ADMIN_EMAIL=admin@miempresa.com ADMIN_PASSWORD=mipassword npm run seed
```

---

## 🔐 Autenticación y Seguridad

### Documentación de Seguridad

Esta aplicación implementa un **sistema de seguridad multi-tenant completo** con:
- ✅ Aislamiento de datos por tenant (row-level security)
- ✅ Autenticación dual (JWT + API Keys)
- ✅ Roles globales (superadmin) y por tenant (admin/staff)
- ✅ Validación de membresía en cada request
- ✅ Uploads namespaced por tenant
- ✅ Rate limiting por tenant
- ✅ Protección contra IDOR y cross-tenant data access

### JWT (usuarios web)
```bash
# Login
POST /api/users/login
{
  "email": "admin@example.com",
  "password": "admin123"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}

# Usar en headers
Authorization: Bearer <token>
```

### API Keys (integraciones)
```bash
# Crear API key (requiere JWT de admin)
POST /api/tenants/:slug/api-keys
{
  "label": "Mi integración",
  "scopes": "claims:read,claims:write"
}

# Usar en headers
x-api-key: <key>
```

### Resolución de tenant
- **Subdominio**: `acme.api.tudominio.com` → tenant `acme`
- **Header**: `x-tenant: acme` o `x-tenant-slug: acme`
- **Ruta**: `/api/tenants/acme/claims`

### Roles por tenant
- **admin**: acceso completo al tenant (CRUD usuarios, API keys, claims, config)
- **staff**: acceso limitado (solo claims asignados, lectura de catálogos)

---

## 📡 Endpoints API

### Catálogos públicos (sin auth)
```
GET /api/document_types       # Tipos de documento (DNI, RUC, etc.)
GET /api/consumption_types    # Producto/Servicio
GET /api/claim_types          # Reclamo/Queja
GET /api/currencies           # PEN, USD
```

### Autenticación
```
POST /api/users/login         # Login (retorna JWT)
GET  /api/users               # Listar usuarios del tenant (JWT)
POST /api/users               # Crear usuario (JWT admin)
PUT  /api/users/:id           # Actualizar usuario (JWT)
DELETE /api/users/:id         # Eliminar usuario (JWT admin)
```

### Tenants (solo admin global)
```
GET    /api/tenants                  # Listar todos los tenants
POST   /api/tenants                  # Crear tenant
GET    /api/tenants/:slug            # Detalles de tenant
PUT    /api/tenants/:slug            # Actualizar tenant
DELETE /api/tenants/:slug            # Eliminar tenant
GET    /api/tenants/:slug/stats      # Estadísticas de uso
```

### Claims (JWT o API key)
```
GET    /api/tenants/:slug/claims           # Listar reclamos
POST   /api/tenants/:slug/claims           # Crear reclamo
GET    /api/tenants/:slug/claims/:id       # Detalle de reclamo
PUT    /api/tenants/:slug/claims/:id       # Actualizar reclamo
DELETE /api/tenants/:slug/claims/:id       # Eliminar reclamo
PUT    /api/tenants/:slug/claims/:id/assign    # Asignar a usuario
PUT    /api/tenants/:slug/claims/:id/resolve   # Marcar como resuelto
```

### API Keys (JWT admin)
```
GET    /api/tenants/:slug/api-keys         # Listar keys
POST   /api/tenants/:slug/api-keys         # Crear key
GET    /api/tenants/:slug/api-keys/:id     # Detalle de key
PUT    /api/tenants/:slug/api-keys/:id     # Actualizar key
DELETE /api/tenants/:slug/api-keys/:id     # Eliminar key
POST   /api/tenants/:slug/api-keys/:id/revoke    # Revocar key
POST   /api/tenants/:slug/api-keys/:id/reactivate # Reactivar key
GET    /api/tenants/:slug/api-keys/:id/stats     # Estadísticas de uso
```

### Suscripciones/Billing (JWT)
```
GET  /api/tenants/:slug/billing/plans         # Planes disponibles
GET  /api/tenants/:slug/billing/subscription  # Suscripción actual
GET  /api/tenants/:slug/billing/usage         # Uso vs límites
POST /api/tenants/:slug/billing/upgrade       # Cambiar plan (admin)
POST /api/tenants/:slug/billing/cancel        # Cancelar (admin)
```

### Integraciones (solo API key)
```
POST /api/integrations/:slug/claims           # Crear reclamo vía integración
GET  /api/integrations/:slug/claims/:id       # Consultar reclamo
```

### Branding (público)
```
GET /api/tenants/:slug                       # Logos, colores y datos del tenant
GET /api/tenants/default                     # Branding/datos del tenant por defecto
```

### Branding (admin, multipart)
```
PUT /api/tenants/:slug                       # Actualizar branding + logos/favicons (rol admin)
```

### Clientes y Tutores (JWT)
```
GET    /api/tenants/:slug/customers          # Listar clientes
POST   /api/tenants/:slug/customers          # Crear cliente
GET    /api/tenants/:slug/customers/:id      # Detalle de cliente
PUT    /api/tenants/:slug/customers/:id      # Actualizar cliente
DELETE /api/tenants/:slug/customers/:id      # Eliminar cliente

GET    /api/tenants/:slug/tutors             # Listar tutores
POST   /api/tenants/:slug/tutors             # Crear tutor
GET    /api/tenants/:slug/tutors/:id         # Detalle de tutor
PUT    /api/tenants/:slug/tutors/:id         # Actualizar tutor
DELETE /api/tenants/:slug/tutors/:id         # Eliminar tutor
```

### Health & Monitoring
```
GET /health                                  # Estado de DB y servicios
```

### Ejemplo con API Key
```bash
# Crear reclamo vía integración
curl -X POST http://localhost:3000/api/integrations/default/claims \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "consumption_type_id": 1,
    "claim_type_id": 1,
    "description": "Producto defectuoso",
    "amount": 100.00
  }'
```

---

## 💼 Planes y suscripciones

| Plan | Precio/mes | Usuarios | Reclamos/mes | Storage | API Access | Branding |
|------|-----------|----------|--------------|---------|------------|----------|
| **Free** | $0 | 2 | 100 | 1 GB | ❌ | ❌ |
| **Basic** | $49 | 5 | 1,000 | 10 GB | ❌ | ✅ |
| **Professional** | $149 | 20 | 10,000 | 100 GB | ✅ | ✅ |
| **Enterprise** | Custom | ∞ | ∞ | ∞ | ✅ | ✅ |

**Rate limits:** 30-1000 req/min según plan

Ver [src/config/planFeatures.js](src/config/planFeatures.js) para detalles completos.

---

## 🎨 Branding y personalización

### Activos estáticos
- **Por defecto**: `assets/default-tenant/` (logo-light, logo-dark, favicon)
- **Por tenant**: `uploads/logos/` (logos subidos)
- **Adjuntos**: `uploads/claims/` (archivos de reclamos)

### Configuración de branding
Cada tenant puede personalizar:
- Nombre de empresa y marca
- RUC/ID fiscal
- Colores primario y de acento
- Logo claro y oscuro
- Favicon
- Email de notificaciones

### Actualizar branding (admin)
Use multipart/form-data sobre el tenant:

```bash
curl -X PUT http://localhost:3000/api/tenants/default \
  -H "Authorization: Bearer <adminToken>" \
  -F "company_brand=Mi Marca" \
  -F "company_name=Mi Empresa" \
  -F "primary_color=#005BD4" \
  -F "accent_color=#0E948C" \
  -F "logo_light=@./logo-light.png" \
  -F "logo_dark=@./logo-dark.png" \
  -F "favicon=@./favicon.ico"
```

### URLs HTTPS
Para forzar URLs HTTPS en producción:
```bash
NODE_ENV=production
# o
FORCE_HTTPS=true
```

---

## 📧 Sistema de notificaciones

### Templates de email
- **newClaim.html**: notificación de nuevo reclamo
- **claimAssigned.html**: reclamo asignado a usuario
- **updatedClaim.html**: cambios en el reclamo
- **claimResolved.html**: reclamo resuelto

### Configuración de emails
El sistema envía BCC a `contact_email` del tenant. Fallback:
1. `contact_email` del tenant
2. `DEFAULT_TENANT_CONTACT_EMAIL` (env)

---

## 🔧 Monitoreo y debugging

### Health check
```bash
curl http://localhost:3000/health
```

### Logs
- **Ubicación**: `logs/`
- **Formato**: JSON con pino-http
- **Incluye**: request ID, timestamp, método, ruta, status, duración

### Métricas Redis
- Rate limiting: keys por tenant
- Cache: TTL configurable
- Usa `redis-cli` para inspeccionar

### Auditoría
Todas las operaciones sensibles se registran con:
- Usuario/API key
- Timestamp
- Método y ruta
- Parámetros
- Respuesta

---

## 📚 Recursos disponibles

- **Colección Postman**: [postman_collection.json](postman_collection.json)

---

## 🛠️ Scripts disponibles

```bash
npm start          # Producción (node)
npm run dev        # Desarrollo (nodemon con hot reload)
npm run seed       # Seed completo (con API key)
npm run seed:default  # Seed mínimo (sin API key)
```

---

## 📞 Soporte y contribución

Para dudas técnicas o issues:
- Revisa este README
- Abre un issue en el repositorio con detalles del problema

Contribución limitada a colaboradores internos.

---

## 📜 Licencia

Proyecto privado. Todos los derechos reservados.