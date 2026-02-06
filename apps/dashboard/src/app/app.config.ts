import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { ThemeService } from './core/services/theme.service';

const initializeTheme = (themeService: ThemeService) => () => {
  themeService.getEffectiveTheme();
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, refreshInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initializeTheme,
      deps: [ThemeService]
    }
  ]
};
