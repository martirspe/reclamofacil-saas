import { effect } from '@angular/core';
import { TENANT_CONFIG } from './tenant.signal';

/**
 * Effect que aplica las variables CSS del tenant dinámicamente.
 * Se ejecuta automáticamente cuando TENANT_CONFIG cambia.
 */
export function setupThemeEffect(): void {
  effect(() => {
    const tenant = TENANT_CONFIG();
    if (!tenant) return;

    const root = document.documentElement;

    // CSS Variables
    root.style.setProperty('--brand-primary', tenant.primary_color);
    root.style.setProperty('--brand-accent', tenant.accent_color);

    // Theme color meta tag (mobile browser bar)
    let themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = tenant.primary_color;

    // Update favicon
    if (tenant.favicon_url) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = tenant.favicon_url;
    }

    // Update title
    document.title = tenant.name || 'ReclamoFacil';
  });
}
