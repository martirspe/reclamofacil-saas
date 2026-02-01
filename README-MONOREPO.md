# ReclamoFacil - Monorepo Multi-Tenant Enterprise

**ARQUITECTURA MONOREPO REFACTORIZADA - Angular 21 + Node.js**

---

## 🏗️ Nueva Arquitectura

```
/apps
  /landing          → Marketing site (Angular SSR, Zoneless)
  /public-form      → Multi-tenant complaint form (Angular Zoneless)
  /dashboard        → Admin dashboard (Angular + ZoneJS, lazy-loaded)
/libs
  /shared
    /models         → TypeScript interfaces compartidas
    /utils          → Helpers, constants
    /ui             → Pipes, directives
/server             → Backend API Node.js/Express (multi-tenant)
/infra
  /docker           → Dockerfiles por app
  /nginx            → Reverse proxy configs
/dist               → Build outputs
angular.json        → Multi-project configuration
package.json        → Monorepo scripts
tsconfig.json       → Path mapping (@shared/*)
```

---

## 🚀 Tech Stack

- **Frontend**: Angular 21, Standalone APIs, Signals, Zoneless (landing + public-form)
- **Backend**: Node.js 18+, Express, Sequelize ORM
- **Database**: MySQL 8
- **Cache**: Redis 7
- **Multi-tenancy**: Subdomain-based detection
- **Deployment**: Docker, NGINX reverse proxy

---

## 📦 Installation

```bash
npm install
cd server && npm install
```

---

## 🔧 Development

```bash
# Frontend apps
npm run start:landing      # http://localhost:4200
npm run start:public-form  # http://localhost:4201 (multi-tenant)
npm run start:dashboard    # http://localhost:4202

# Backend API
npm run start:server       # http://localhost:3000
```

---

## 🏭 Production Build

```bash
npm run build:all          # Builds todas las apps
npm run build:landing
npm run build:public-form
npm run build:dashboard
```

---

## 🐳 Docker Deployment

```bash
docker-compose -f docker-compose.monorepo.yml up --build
```

---

## 🌐 Multi-Tenant Configuration

### Local Testing

1. **Configurar DNS local** (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 empresa.reclamofacil.local
127.0.0.1 acme.reclamofacil.local
127.0.0.1 demo.reclamofacil.local
```

2. **Crear tenant en BD**:
```sql
INSERT INTO tenants (slug, brand_name, primary_color, accent_color, active)
VALUES ('empresa', 'Empresa SAC', '#3B82F6', '#10B981', 1);
```

3. **Acceder**:
- `http://empresa.reclamofacil.local:4201` → Carga configuración de "empresa"
- `http://acme.reclamofacil.local:4201` → Carga configuración de "acme"

### Flujo Multi-Tenant (Public Form)

1. **Detecta subdomain** desde `window.location.hostname`
2. **Llama API** `GET /api/tenants/{subdomain}`
3. **Bloquea bootstrap** con `APP_INITIALIZER` hasta obtener config
4. **Guarda en signal** `TENANT_CONFIG`
5. **Aplica tema** dinámico (CSS variables)
6. **Renderiza formulario** con branding del tenant

---

## 📚 Key Features

### 🔵 PUBLIC-FORM (apps/public-form)
- ✅ **Multi-tenant por subdominio**
- ✅ **APP_INITIALIZER** bloquea bootstrap hasta cargar tenant
- ✅ **Signal global** `TENANT_CONFIG`
- ✅ **Tema dinámico** con CSS variables
- ✅ **Zoneless** (provideExperimentalZonelessChangeDetection)
- ✅ **Alto rendimiento**

### 🟢 DASHBOARD (apps/dashboard)
- ✅ **Autenticación JWT**
- ✅ **Guards** de acceso
- ✅ **Lazy loading** por feature
- ✅ **HTTP Interceptors**
- ✅ **ZoneJS** habilitado
- ✅ **Feature-driven architecture**

### 🟡 LANDING (apps/landing)
- ✅ **SSR habilitado** (Angular Universal)
- ✅ **SEO optimizado**
- ✅ **Zoneless**
- ✅ **Prerendering**

### 🔴 BACKEND (/server)
- ✅ **Multi-tenant middleware**
- ✅ **Detección por subdomain**
- ✅ **Endpoint** `GET /api/tenants/:slug`
- ✅ **Aislamiento de datos** por `tenant_id`
- ✅ **Redis cache**
- ✅ **Rate limiting** por tenant

---

## 🗂️ Production Routing (NGINX)

```
www.reclamofacil.com              → Landing (SSR)
{tenant}.reclamofacil.com         → Public Form (multi-tenant)
dashboard.reclamofacil.com        → Dashboard (autenticado)
api.reclamofacil.com              → Backend API
```

---

## 🔐 Security

- **Helmet.js** security headers
- **CORS** validation por origen
- **JWT** authentication
- **Rate limiting** per tenant
- **Sequelize ORM** (SQL injection protection)
- **Data isolation** by tenant_id

---

## 📖 Documentation

- [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - Guía completa de migración
- Ver documentación original del backend en `reclamofacil-server/README.md`

---

## 🎯 Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Zoneless en public-form** | Máxima performance, no necesita change detection |
| **ZoneJS en dashboard** | Compatibilidad con librerías third-party |
| **SSR en landing** | SEO crítico para marketing |
| **Monorepo** | Código compartido, builds unificados |
| **Subdomain multi-tenancy** | Aislamiento limpio, fácil escalabilidad |
| **Signals** | Reactividad nativa de Angular 21 |
| **Standalone APIs** | Eliminación de NgModules |

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo individual
npm run start:landing
npm run start:public-form
npm run start:dashboard
npm run start:server

# Build producción
npm run build:all

# Docker
docker-compose -f docker-compose.monorepo.yml up -d
docker-compose -f docker-compose.monorepo.yml logs -f api

# Testing multi-tenant
# 1. Configurar /etc/hosts
# 2. npm run start:public-form
# 3. Acceder a http://tenant.reclamofacil.local:4201
```

---

## 📝 Próximos Pasos

1. ✅ Estructura monorepo creada
2. ✅ Multi-tenant core implementado
3. ⏳ Migrar código de `reclamofacil-client` a `apps/`
4. ⏳ Actualizar imports a path mapping `@shared/*`
5. ⏳ Implementar formulario completo en public-form
6. ⏳ Implementar CRUD en dashboard
7. ⏳ CI/CD pipeline
8. ⏳ Deploy a producción

---

## 📄 License

Proprietary - All rights reserved © 2026 ReclamoFacil
