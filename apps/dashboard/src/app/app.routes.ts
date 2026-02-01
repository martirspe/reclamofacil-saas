import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShellComponent } from './core/layout/app-shell.component';

export const routes: Routes = [
	{
		path: 'auth',
		loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes)
	},
	{
		path: '',
		component: AppShellComponent,
		canActivate: [authGuard],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
			{
				path: 'dashboard',
				loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes)
			},
			{
				path: 'subscriptions',
				loadChildren: () => import('./features/subscriptions/subscriptions.routes').then((m) => m.subscriptionsRoutes)
			},
			{
				path: 'claims',
				loadChildren: () => import('./features/claims/claims.routes').then((m) => m.claimsRoutes)
			},
			{
				path: 'tenants',
				loadChildren: () => import('./features/tenants/tenants.routes').then((m) => m.tenantsRoutes)
			},
			{
				path: 'books',
				loadChildren: () => import('./features/books/books.routes').then((m) => m.booksRoutes)
			},
			{
				path: 'users',
				loadChildren: () => import('./features/users/users.routes').then((m) => m.usersRoutes)
			},
			{
				path: 'settings',
				loadChildren: () => import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
				canActivate: [roleGuard],
				data: { roles: ['admin'] }
			},
			{
				path: 'support',
				loadChildren: () => import('./features/support/support.routes').then((m) => m.supportRoutes)
			},
			{
				path: 'feedback',
				loadChildren: () => import('./features/feedback/feedback.routes').then((m) => m.feedbackRoutes)
			}
		]
	},
	{ path: '**', redirectTo: '' }
];
