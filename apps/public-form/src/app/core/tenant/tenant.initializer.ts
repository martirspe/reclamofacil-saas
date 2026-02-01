import { TENANT_CONFIG, TENANT_SLUG } from '../config/tenant.signal';
import { TenantResolver } from './tenant.resolver';

/**
 * Factory para APP_INITIALIZER que bloquea el bootstrap hasta cargar tenant config.
 */
export function tenantInitializerFactory(resolver: TenantResolver) {
  return async (): Promise<void> => {
    const slug = resolver.detectTenantSlug();
    TENANT_SLUG.set(slug || 'default');

    const tenant = await resolver.loadTenantConfig(slug);
    TENANT_CONFIG.set(tenant);
  };
}
