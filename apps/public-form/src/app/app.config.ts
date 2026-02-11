import { ApplicationConfig, APP_INITIALIZER, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { TenantResolver } from './core/tenant/tenant.resolver';
import { tenantInitializerFactory } from './core/tenant/tenant.initializer';
import { setupThemeEffect } from './core/config/theme.effect';
import { apiResponseInterceptor } from './core/http/api-response.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 🚀 ZONELESS para máximo rendimiento
    provideZonelessChangeDetection(),
    
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiResponseInterceptor])),

    // 🔐 Resolver de tenant (servicio)
    TenantResolver,

    // ⚡ APP_INITIALIZER - BLOQUEA bootstrap hasta cargar tenant
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [TenantResolver],
      useFactory: tenantInitializerFactory
    },

    // 🎨 Inicializar efecto de tema
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        return () => {
          setupThemeEffect();
        };
      }
    }
  ]
};
