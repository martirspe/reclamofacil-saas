import { signal } from '@angular/core';
import { Tenant } from '@shared/models';

/**
 * Signal global para la configuración del tenant.
 * Se carga durante el APP_INITIALIZER antes del bootstrap.
 */
export const TENANT_CONFIG = signal<Tenant | null>(null);

/**
 * Signal global para el slug del tenant detectado.
 * Se setea en el APP_INITIALIZER antes del bootstrap.
 */
export const TENANT_SLUG = signal<string>('default');
