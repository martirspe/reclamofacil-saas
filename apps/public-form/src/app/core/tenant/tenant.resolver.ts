import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tenant } from '@shared/models';

/**
 * Resuelve el tenant desde el backend basado en el slug.
 */
export class TenantResolver {
  private http = inject(HttpClient);

  /**
   * Detecta el tenant desde el subdominio del navegador.
   * tenant.reclamofacil.com → "tenant"
   * localhost → "default"
   */
  detectTenantSlug(): string {
    if (typeof window === 'undefined') return 'default';

    const hostname = window.location.hostname;
    
    // Localhost → default
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'default';
    }

    // Subdomain pattern: tenant.reclamofacil.com or tenant.reclamofacil.local
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0].toLowerCase();
    }

    return 'default';
  }

  /**
   * Carga la configuración del tenant desde la API.
   */
  async loadTenantConfig(slug: string): Promise<Tenant> {
    try {
      const url = `${environment.API_URL}/api/tenants/${slug}`;
      const tenant = await firstValueFrom(
        this.http.get<Tenant>(url)
      );
      
      if (!tenant || !tenant.active) {
        throw new Error('Tenant no encontrado o inactivo');
      }

      return tenant;
    } catch (error) {
      throw new Error('No se pudo cargar la configuración del tenant');
    }
  }
}
