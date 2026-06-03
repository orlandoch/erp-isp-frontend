import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import ClientsListPage from '@/pages/clients/ClientsListPage.vue'
import ClientDetailPage from '@/pages/clients/ClientDetailPage.vue'
import ClientFormPage from '@/pages/clients/ClientFormPage.vue'
import ProductsListPage from '@/pages/products/ProductsListPage.vue'
import ProductFormPage from '@/pages/products/ProductFormPage.vue'
import CategoriesPage from '@/pages/products/CategoriesPage.vue'
import InvoicesListPage from '@/pages/invoices/InvoicesListPage.vue'
import InvoiceDetailPage from '@/pages/invoices/InvoiceDetailPage.vue'
import InvoiceFormPage from '@/pages/invoices/InvoiceFormPage.vue'
import PaymentsListPage from '@/pages/payments/PaymentsListPage.vue'
import ReceivablesListPage from '@/pages/receivables/ReceivablesListPage.vue'
import ElectronicDocumentsListPage from '@/pages/electronic/ElectronicDocumentsListPage.vue'
import AccountsPage from '@/pages/accounts/AccountsPage.vue'
import InternetPlansListPage from '@/pages/contracts/InternetPlansListPage.vue'
import InternetPlanFormPage from '@/pages/contracts/InternetPlanFormPage.vue'
import InternetPlanDetailPage from '@/pages/contracts/InternetPlanDetailPage.vue'
import ContractsListPage from '@/pages/contracts/ContractsListPage.vue'
import ContractFormPage from '@/pages/contracts/ContractFormPage.vue'
import ContractDetailPage from '@/pages/contracts/ContractDetailPage.vue'
import ContractChangePlanPage from '@/pages/contracts/ContractChangePlanPage.vue'
import ContractTemplatesListPage from '@/pages/contracts/ContractTemplatesListPage.vue'
import ContractTemplateFormPage from '@/pages/contracts/ContractTemplateFormPage.vue'
import ContractTemplateVariablesPage from '@/pages/contracts/ContractTemplateVariablesPage.vue'
import ContractWebPage from '@/pages/contracts/ContractWebPage.vue'
import SettingsPage from '@/pages/settings/SettingsPage.vue'
import UsersListPage from '@/pages/users/UsersListPage.vue'
import UserFormPage from '@/pages/users/UserFormPage.vue'
import RolesListPage from '@/pages/roles/RolesListPage.vue'
import RoleFormPage from '@/pages/roles/RoleFormPage.vue'
import RolePermissionsPage from '@/pages/roles/RolePermissionsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { guest: true } },
    { path: '/contracts/:id/view', name: 'contracts.web-view', component: ContractWebPage, meta: { requiresAuth: true } },
    { path: '/contracts/:id/versions/:versionId/view', name: 'contracts.web-view-version', component: ContractWebPage, meta: { requiresAuth: true } },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: DashboardPage },
        // Clientes
        { path: 'clientes', name: 'clients', component: ClientsListPage },
        { path: 'clientes/nuevo', name: 'clients.create', component: ClientFormPage },
        { path: 'clientes/:id', name: 'clients.show', component: ClientDetailPage },
        { path: 'clientes/:id/editar', name: 'clients.edit', component: ClientFormPage, props: true },
        // Productos
        { path: 'productos', name: 'products', component: ProductsListPage },
        { path: 'productos/nuevo', name: 'products.create', component: ProductFormPage },
        { path: 'productos/:id/editar', name: 'products.edit', component: ProductFormPage, props: true },
        { path: 'productos/categorias', name: 'products.categories', component: CategoriesPage },
        // Facturas
        { path: 'facturas', name: 'invoices', component: InvoicesListPage },
        { path: 'facturas/nueva', name: 'invoices.create', component: InvoiceFormPage },
        { path: 'facturas/:id', name: 'invoices.show', component: InvoiceDetailPage },
        // Pagos
        { path: 'pagos', name: 'payments', component: PaymentsListPage },
        // CxC
        { path: 'cuentas-por-cobrar', name: 'receivables', component: ReceivablesListPage },
        // Documentos Electronicos
        { path: 'documentos-electronicos', name: 'electronic-documents', component: ElectronicDocumentsListPage },
        // Contabilidad
        { path: 'contabilidad/cuentas', name: 'accounts', component: AccountsPage },
        // ===== MODULO CONTRACTS =====
        // Planes de Internet
        { path: 'contracts/internet-plans', name: 'internet-plans', component: InternetPlansListPage },
        { path: 'contracts/internet-plans/new', name: 'internet-plans.create', component: InternetPlanFormPage },
        { path: 'contracts/internet-plans/:id', name: 'internet-plans.show', component: InternetPlanDetailPage },
        { path: 'contracts/internet-plans/:id/edit', name: 'internet-plans.edit', component: InternetPlanFormPage },
        // Contratos
        { path: 'contracts/contracts', name: 'contracts', component: ContractsListPage },
        { path: 'contracts/contracts/new', name: 'contracts.create', component: ContractFormPage },
        { path: 'contracts/contracts/:id', name: 'contracts.show', component: ContractDetailPage },
        { path: 'contracts/contracts/:id/edit', name: 'contracts.edit', component: ContractFormPage },
        { path: 'contracts/contracts/:id/change-plan', name: 'contracts.change-plan', component: ContractChangePlanPage },
        // Plantillas de Contrato
        { path: 'contracts/templates', name: 'contract-templates', component: ContractTemplatesListPage },
        { path: 'contracts/templates/new', name: 'contract-templates.create', component: ContractTemplateFormPage },
        { path: 'contracts/templates/:id/edit', name: 'contract-templates.edit', component: ContractTemplateFormPage },
        { path: 'contracts/templates/:id/variables', name: 'contract-templates.variables', component: ContractTemplateVariablesPage },
        // Configuracion
        // Usuarios
        { path: 'usuarios', name: 'users', component: UsersListPage },
        { path: 'usuarios/nuevo', name: 'users.create', component: UserFormPage },
        { path: 'usuarios/:id/editar', name: 'users.edit', component: UserFormPage },
        // Roles
        { path: 'roles', name: 'roles', component: RolesListPage },
        { path: 'roles/nuevo', name: 'roles.create', component: RoleFormPage },
        { path: 'roles/:id/editar', name: 'roles.edit', component: RoleFormPage },
        { path: 'roles/:id/permisos', name: 'roles.permissions', component: RolePermissionsPage },
        // Configuracion
        { path: 'configuracion', name: 'settings', component: SettingsPage },
      ],
    },
  ],
})

router.beforeEach((to, _from) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated()) {
    return { name: 'login' }
  } else if (to.meta.guest && auth.isAuthenticated()) {
    return { name: 'dashboard' }
  }
})

export default router
