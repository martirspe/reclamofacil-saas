import { Routes } from '@angular/router';

export const tenantsRoutes: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./pages/tenant-create.page').then((m) => m.TenantCreatePage)
  },
  {
    path: '',
    loadComponent: () => import('./pages/tenants.page').then((m) => m.TenantsPage)
  }
];
