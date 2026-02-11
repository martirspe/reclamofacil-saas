import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
  dot?: boolean;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

interface SidebarTab {
  id: string;
  label: string;
  icon: string;
  sections: MenuSection[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly tenantLabel = computed(() => this.auth.tenant() || 'Sin tenant');

  readonly isOpen = input(false);
  readonly isCollapsed = input(false);
  readonly closeSidebar = output<void>();
  readonly toggleCollapse = output<void>();

  readonly tabs = signal<SidebarTab[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      sections: [
        {
          label: 'General',
          items: [
            { label: 'Resumen', route: '/dashboard', icon: 'dashboard' },
            { label: 'Reclamos', route: '/claims', icon: 'description', dot: true },
            { label: 'Libros', route: '/books', icon: 'label' },
            { label: 'Clientes', route: '/tenants', icon: 'group' },
            { label: 'Usuarios', route: '/users', icon: 'person' }
          ]
        }
      ]
    },
    {
      id: 'gestion',
      label: 'Gestión',
      icon: 'settings',
      sections: [
        {
          label: 'Administración',
          items: [
            { label: 'Suscripciones', route: '/subscriptions', icon: 'business' },
            { label: 'Configuración', route: '/settings', icon: 'settings' }
          ]
        }
      ]
    },
    {
      id: 'soporte',
      label: 'Soporte',
      icon: 'help',
      sections: [
        {
          label: 'Soporte',
          items: [
            { label: 'Feedback', route: '/feedback', icon: 'help' },
            { label: 'Ayuda', route: '/support', icon: 'help' }
          ]
        }
      ]
    }
  ]);

  readonly activeTabId = signal(this.tabs()[0]?.id ?? 'general');

  setActiveTab(tabId: string): void {
    this.activeTabId.set(tabId);
  }

  logout(): void {
    this.auth.clearSession();
    this.toast.showSuccess('Sesión cerrada exitosamente', 'Hasta pronto');
    this.closeSidebar.emit();
    this.router.navigate(['/auth/login']);
  }
}
