import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./complaint-form/complaint-form.component').then(m => m.ComplaintFormComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
