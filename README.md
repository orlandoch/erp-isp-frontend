# erp-isp-frontend — Frontend SPA para ISP ERP (Vue 3 + PrimeVue)

Interfaz de usuario para el ERP **erp-isp**. SPA construida con Vue 3, TypeScript y PrimeVue, enfocada en la gestión de proveedores de servicios de Internet (ISP).

> **Nota:** Este frontend fue desarrollado para el backend `erp-isp`. Actualmente el proyecto activo es `work-orders-frontend`.

## Stack Técnico

| Componente | Versión |
|---|---|
| Vue | ^3.5.x |
| TypeScript | ^5.x |
| PrimeVue | ^4.5.x |
| PrimeIcons | ^7.x |
| Pinia (State Management) | ^3.x |
| Vue Router | ^5.x |
| Axios (HTTP Client) | ^1.x |
| Quill Editor (vue-quill) | ^1.x |
| Vite | ^6.x |

**Testing:**
- Playwright (E2E)
- Cypress (E2E alternativo)

## Estado Actual

**Completado/En pausa.** El frontend tiene todas las pantallas implementadas. No está en producción activa; el proyecto `work-orders-frontend` es el activo.

## Requisitos

- Node.js 18+
- NPM
- Backend `erp-isp` corriendo

## Instalación y Ejecución

```bash
# 1. Clonar
git clone https://github.com/orlandoch/erp-isp-frontend.git
cd erp-isp-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env
# Editar VITE_API_BASE_URL

# 4. Iniciar dev server
npm run dev
```

## Arquitectura

```
src/
├── api/                          # Módulos de API (Axios por recurso)
│   ├── client.ts                 # Cliente Axios con interceptors
│   ├── types.ts                  # Tipos/Interfaces
│   ├── accounts.ts               # API de contabilidad
│   ├── auth.ts                   # API de autenticación
│   ├── categories.ts             # API de categorías
│   ├── clients.ts                # API de clientes
│   ├── contracts.ts              # API de contratos
│   ├── contractTemplates.ts      # API de templates de contratos
│   ├── electronicDocuments.ts    # API de documentos electrónicos SRI
│   ├── establishments.ts         # API de sucursales/puntos emisión
│   ├── invoices.ts               # API de facturación
│   ├── ivas.ts                   # API de tasas IVA
│   ├── payments.ts               # API de pagos
│   ├── products.ts               # API de productos
│   ├── receivables.ts            # API de cuentas por cobrar
│   ├── roles.ts                  # API de roles
│   ├── settings.ts               # API de configuraciones
│   └── users.ts                  # API de usuarios
├── components/
│   └── layout/
│       ├── TopBar.vue            # Barra superior
│       └── Sidebar.vue           # Barra lateral de navegación
├── pages/                        # Páginas del SPA
│   ├── LoginPage.vue             # Inicio de sesión
│   ├── DashboardPage.vue         # Dashboard principal
│   ├── accounts/
│   │   └── AccountsPage.vue      # Plan de cuentas contable
│   ├── contracts/
│   │   └── ContractWebPage.vue   # Página web de contratos (visión pública/privada)
│   ├── electronic/
│   │   └── ElectronicDocumentsListPage.vue  # Documentos electrónicos SRI
│   ├── invoices/
│   │   ├── InvoiceDetailPage.vue # Detalle de factura
│   │   ├── InvoiceFormPage.vue   # Formulario de factura
│   │   └── InvoicesListPage.vue  # Lista de facturas
│   ├── products/
│   │   ├── CategoriesPage.vue    # Categorías de productos
│   │   ├── ProductFormPage.vue   # Formulario de producto
│   │   └── ProductsListPage.vue  # Lista de productos
│   ├── receivables/
│   │   └── ReceivablesListPage.vue  # Cuentas por cobrar
│   ├── roles/
│   │   ├── RoleFormPage.vue      # Formulario de rol
│   │   ├── RolePermissionsPage.vue  # Permisos por rol
│   │   └── RolesListPage.vue     # Lista de roles
│   ├── settings/
│   │   └── SettingsPage.vue      # Configuración del sistema
│   └── users/
│       ├── UserFormPage.vue      # Formulario de usuario
│       └── UsersListPage.vue     # Lista de usuarios
├── stores/                       # Stores Pinia (state management)
│   ├── auth.ts                   # Estado de autenticación
│   ├── roles.ts                  # Estado de roles
│   └── users.ts                  # Estado de usuarios
├── router/
│   └── index.ts                  # Configuración de rutas
├── App.vue                       # Componente raíz
└── main.ts                       # Punto de entrada
```

## Rutas del Frontend

| Ruta | Página | Módulo |
|---|---|---|
| `/login` | LoginPage | Auth |
| `/` | DashboardPage | Dashboard |
| `/invoices` | InvoicesListPage | Facturación |
| `/invoices/new` | InvoiceFormPage | Facturación |
| `/invoices/:id` | InvoiceDetailPage | Facturación |
| `/invoices/:id/edit` | InvoiceFormPage | Facturación |
| `/products` | ProductsListPage | Productos |
| `/products/new` | ProductFormPage | Productos |
| `/products/:id/edit` | ProductFormPage | Productos |
| `/products/categories` | CategoriesPage | Productos |
| `/users` | UsersListPage | Usuarios |
| `/users/new` | UserFormPage | Usuarios |
| `/users/:id/edit` | UserFormPage | Usuarios |
| `/roles` | RolesListPage | Roles |
| `/roles/new` | RoleFormPage | Roles |
| `/roles/:id/permissions` | RolePermissionsPage | Roles |
| `/electronic-documents` | ElectronicDocumentsListPage | SRI |
| `/receivables` | ReceivablesListPage | Cobranzas |
| `/accounts` | AccountsPage | Contabilidad |
| `/settings` | SettingsPage | Configuración |
| `/contracts/web` | ContractWebPage | Contratos |

## Funcionalidades Implementadas

- Dashboard con resumen de métricas
- CRUD completo de facturas con selección de cliente, productos, IVA
- Emisión de facturas con generación de documento electrónico SRI
- CRUD de productos con categorías e IVA
- CRUD de clientes
- Administración de usuarios y roles con permisos granulares
- Lista de documentos electrónicos con seguimiento de estado SRI
- Cuentas por cobrar
- Plan de cuentas contable
- Configuración general del sistema
- Página web de contratos (vista pública/privada)
- Layout con sidebar y topbar navegable
- Autenticación con token y guards de ruta

## Dependencias UI Notables

- **PrimeVue 4**: Componentes UI principales
- **PrimeIcons**: Iconografía
- **Vue Quill**: Editor de texto enriquecido (para templates de contratos)
- **Pinia**: State management

## Bugs Conocidos / Reparados

*(A completar de forma incremental)*

---

## Historial de Cambios

*(A partir del próximo commit, cada cambio se documentará aquí como append con fecha, descripción y hash del commit.)*
