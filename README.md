
# Reclamofacil — Monorepo SaaS Multi-tenant

Sistema completo de Libro de Reclamaciones digital con arquitectura SaaS multi-tenant. Incluye frontend Angular 21 para formulario público de reclamos y backend Node.js/Express con API REST, suscripciones por planes, branding personalizado y notificaciones automatizadas.

**Stack:** Angular 21 • Node.js 18+ • Express • Sequelize • MySQL 8 • Redis 7 • Docker

---

## 🎯 Características principales

### 🌐 Sistema multi-tenant
- **Aislamiento completo de datos** por empresa/organización
- **Branding personalizado** (logos, colores, nombre) por tenant
- **Resolución automática** del tenant por subdominio, header o ruta
- **Suscripciones independientes** por tenant con planes diferenciados

### 📝 Gestión de reclamos
- **Formulario público wizard** de 4 pasos con validación avanzada
- **Autocompletado** de clientes por documento
- **Gestión de menores** con tutores legales
- **Adjuntos de archivos** (imágenes, PDFs)
- **Estados de reclamo**: pendiente → asignado → resuelto
- **Notificaciones por email** automatizadas

### 💼 Sistema SaaS
- **4 planes**: Free, Basic, Professional, Enterprise
- **Feature gating**: acceso a funcionalidades según plan
- **Usage metering**: seguimiento de uso vs límites
- **Rate limiting dinámico**: 30-1000 req/min según plan
- **API de billing**: upgrade, downgrade, cancelación

### 🔐 Autenticación híbrida
- **JWT** para usuarios web (dashboard admin)
- **API Keys** con scopes para integraciones externas
- **RBAC por tenant**: roles admin y staff
- **reCAPTCHA v3 (score)** en formularios públicos

---

## 🏗️ Arquitectura

```
reclamofacil/
├── reclamofacil-client/        # Frontend Angular 21
│   ├── src/app/
│   │   ├── pages/              # Form (wizard 4 pasos), Dashboard
│   │   ├── services/           # Auth, Claims, Tenant
│   │   ├── interceptors/       # API Key injection
│   │   └── interfaces/         # TypeScript types
│   └── environments/           # Config dev/prod
│
├── reclamofacil-server/        # Backend Node.js/Express
│   ├── src/
│   │   ├── controllers/        # 11 controladores (claims, tenants, subs, etc.)
│   │   ├── models/             # 12 modelos Sequelize
│   │   ├── routes/             # 13 grupos de endpoints
│   │   ├── middlewares/        # Auth, feature gates, rate limit
│   │   ├── services/           # Email, templates HTML
│   │   ├── scripts/            # Seeds (completo/mínimo)
│   │   └── config/             # DB, Redis, planes, defaults
│   └── uploads/                # Logos y adjuntos
│
└── docker-compose.yml          # Orquestación de servicios
```

### Modelos de datos
- **Tenant**: empresas con branding y config
- **User + UserTenant**: usuarios con roles por tenant
- **Subscription**: plan activo del tenant
- **Claim**: reclamos con estados y adjuntos
- **Customer + Tutor**: clientes y representantes
- **ApiKey**: claves de integración con scopes
- **Catálogos**: DocumentType, ConsumptionType, ClaimType, Currency

---

## 🚀 Quick Start

### Prerequisitos
- **Docker Desktop** (WSL2 backend recomendado en Windows)
- Node.js no requerido localmente; Docker provee todo

### 1. Levantar el entorno
```bash
# Desde la raíz del repositorio
docker-compose build
docker-compose up
```

**Servicios disponibles:**
- 🌐 **Cliente**: http://localhost:4200 (formulario público)
- 🔌 **API**: http://localhost:3000 (backend REST)
- 🗄️ **MySQL**: localhost:3306 (DB `reclamofacil_db`)
- ⚡ **Redis**: localhost:6379 (cache + rate limiting)

### 2. Inicializar base de datos

**Opción A: Seed completo (recomendado)**
```bash
docker compose exec server npm run seed
```
✅ Crea: catálogos, tenant, admin, suscripción, **API Key**

**Opción B: Seed mínimo**
```bash
docker compose exec server npm run seed:default
```
✅ Crea: catálogos, tenant, admin, suscripción (sin API Key)

**Credenciales generadas:**
- 📧 Admin: `admin@example.com`
- 🔑 Password: `admin123`
- 🔐 API Key: impresa en consola (guárdala para el frontend)

### 3. Configurar frontend
1. Copia la **API Key** impresa en el seed
2. Pégala en `reclamofacil-client/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  API_URL_CLAIM: 'http://localhost:3000',
  PUBLIC_API_KEY: 'tu-api-key-aqui',  // ← PEGAR AQUÍ
  RECAPTCHA_V3_KEY: 'tu-recaptcha-key'
};
```
3. Reinicia el contenedor client si ya estaba corriendo:
```bash
docker-compose restart client
```

### 4. Verificar instalación
```bash
# Backend health
curl http://localhost:3000/health

# Catálogos
curl http://localhost:3000/api/document_types
curl http://localhost:3000/api/claim_types

# Frontend
# Abre http://localhost:4200 en el navegador
```

---

## 📚 Documentación

- Backend: [reclamofacil-server/README.md](reclamofacil-server/README.md)
- Frontend: [reclamofacil-client/README.md](reclamofacil-client/README.md)

---

## 🛠️ Comandos útiles

### Docker
```bash
# Levantar servicios
docker-compose up

# Levantar en background
docker-compose up -d

# Ver logs
docker-compose logs -f server
docker-compose logs -f client

# Reconstruir contenedores
docker-compose build --no-cache

# Reiniciar un servicio
docker-compose restart server

# Detener todo
docker-compose down

# Eliminar volúmenes (⚠️ borra datos)
docker-compose down -v
```

### Backend
```bash
# Seed completo
docker compose exec server npm run seed

# Seed mínimo
docker compose exec server npm run seed:default

# Acceder a shell del contenedor
docker compose exec server sh

# Ver logs en tiempo real
docker compose exec server npm run dev
```

### Frontend
```bash
# Acceder a shell del contenedor
docker compose exec client sh

# Build de producción
docker compose exec client npm run build
```

---

## 🌱 Personalización inicial

### Credenciales de administrador
```bash
# Sobrescribir antes del seed
ADMIN_EMAIL=admin@miempresa.com \
ADMIN_PASSWORD=mipassword \
docker compose exec server npm run seed
```

### Branding del tenant
Editar `reclamofacil-server/.env`:
```env
DEFAULT_TENANT_SLUG=miempresa
DEFAULT_TENANT_COMPANY_NAME=Mi Empresa S.A.
DEFAULT_TENANT_COMPANY_BRAND=Mi Empresa
DEFAULT_TENANT_COMPANY_RUC=20123456789
DEFAULT_TENANT_PRIMARY_COLOR=#007bff
DEFAULT_TENANT_ACCENT_COLOR=#6c757d
DEFAULT_TENANT_NOTIFICATIONS_EMAIL=soporte@miempresa.com
```

Luego ejecuta el seed.

---

## 🔧 Troubleshooting

### El frontend no puede conectarse al backend
✅ Verifica que el backend esté corriendo:
```bash
curl http://localhost:3000/health
```
✅ Revisa la API Key en `environment.ts`
✅ Verifica CORS en `.env` del backend:
```env
ALLOWED_ORIGINS=http://localhost:4200
```

### Error "API Key inválida"
✅ Regenera la API Key:
```bash
docker compose down
docker compose up -d
docker compose exec server npm run seed
# Copia la nueva key a environment.ts
```

### MySQL no inicia
✅ Revisa permisos del directorio de datos
✅ Elimina volúmenes y recrea:
```bash
docker-compose down -v
docker-compose up -d
```

### No aparece el branding del tenant
✅ Verifica que el seed haya creado el tenant:
```bash
curl http://localhost:3000/api/tenants/default
```
✅ Revisa la consola del navegador por errores

### Ver logs detallados
```bash
# Todos los servicios
docker-compose logs -f

# Solo servidor
docker-compose logs -f server

# Solo cliente
docker-compose logs -f client

# MySQL
docker-compose logs -f mysql

# Redis
docker-compose logs -f redis
```

---

## 📊 Planes y características

| Plan | Precio | Usuarios | Reclamos/mes | Storage | API | Branding | Rate Limit |
|------|--------|----------|--------------|---------|-----|----------|------------|
| **Free** | $0 | 2 | 100 | 1 GB | ❌ | ❌ | 30/min |
| **Basic** | $49 | 5 | 1,000 | 10 GB | ❌ | ✅ | 60/min |
| **Pro** | $149 | 20 | 10,000 | 100 GB | ✅ | ✅ | 200/min |
| **Enterprise** | Custom | ∞ | ∞ | ∞ | ✅ | ✅ | 1000/min |

Ver [reclamofacil-server/src/config/planFeatures.js](reclamofacil-server/src/config/planFeatures.js) para detalles completos.

---

## 🔐 Seguridad

- **JWT** con expiración configurable
- **API Keys** hasheadas en base de datos
- **Rate limiting** por tenant vía Redis
- **CORS** restrictivo con whitelist
- **reCAPTCHA v3 (score)** en formularios públicos
- **Validación** de inputs en cliente y servidor
- **Helmet.js** para headers de seguridad
- **Auditoría** de operaciones sensibles

---

## 📝 Flujo completo del sistema

### 1. Usuario llega al formulario público
- http://localhost:4200
- Sistema carga branding del tenant (colores, logos, título)
- Catálogos se cargan desde API

### 2. Usuario llena el formulario wizard
**Paso 1:** Datos personales (con búsqueda automática por documento)  
**Paso 2:** Tipo de consumo y reclamo  
**Paso 3:** Detalles, monto y adjuntos  
**Paso 4:** Revisión y confirmación

### 3. Reclamo se crea en el backend
- Validación de API Key
- Rate limiting por tenant
- Creación en base de datos
- Guardado de adjuntos
- **Email automático** al tenant

### 4. Admin gestiona en dashboard
- Login con JWT
- Ve todos los reclamos del tenant
- Asigna reclamos a staff
- Marca como resueltos
- **Emails automáticos** en cada cambio

---

## 🚢 Despliegue a producción

### Backend
1. Configura `.env` con valores de producción
2. Set `NODE_ENV=production`
3. Configura dominio para CORS
4. Set `FORCE_HTTPS=true`
5. Usa MySQL y Redis en servicios cloud
6. Configura SMTP real para emails

### Frontend
1. Actualiza `environment.prod.ts` con URL de producción
2. Configura reCAPTCHA para dominio real
3. Build: `ng build --configuration production`
4. Sirve desde `dist/` con Nginx o similar

### Docker Compose para producción
Crea `docker-compose.prod.yml` con:
- Variables de entorno seguras
- Volúmenes persistentes
- Healthchecks configurados
- Restart policies

Ver documentación de cada componente para detalles completos de despliegue.

---

## 🤝 Contribución

Contribución limitada a colaboradores internos. Si eres del equipo:
1. Revisa la documentación en `reclamofacil-server/` y `reclamofacil-client/`
2. Crea una rama para tu feature
3. Implementa cambios con tests
4. Actualiza documentación relevante
5. Crea Pull Request con descripción detallada

---

## 📞 Soporte

Para dudas técnicas o issues:
- 📖 Revisa los READMEs específicos de cada componente
- 🐛 Abre un issue en el repositorio con detalles completos

---

## 📜 Licencia

Proyecto privado. Todos los derechos reservados.
