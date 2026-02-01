/**
 * Archivo índice para exportar todos los tipos, servicios y componentes del dashboard
 * Facilita las importaciones en otros módulos
 */

// Services
export * from './core/services/dashboard.service';
export { ToastService, type Toast, type ToastType } from './shared/components/toast/toast.service';

// Components
export * from './features/dashboard/components/stat-card.component';
export * from './features/dashboard/components/chart-card.component';
export * from './features/dashboard/components/bar-chart.component';
export * from './features/dashboard/components/doughnut-chart.component';
export * from './features/dashboard/components/table-card.component';
export * from './shared/components/toast/toast.component';

// Pages
export * from './features/dashboard/pages/dashboard.page';

// Routes
export * from './features/dashboard/dashboard.routes';
