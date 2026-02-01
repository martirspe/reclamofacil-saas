import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
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

  readonly userEmail = computed(() => this.auth.user()?.email ?? 'usuario@ejemplo.com');
  readonly userName = computed(() => {
    const user = this.auth.user();
    if (user?.first_name) {
      return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }
    return 'Usuario';
  });
  
  readonly mainMenuItems = signal<MenuItem[]>([
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Reclamos', route: '/claims', icon: 'description', badge: 12 },
    { label: 'Clientes', route: '/customers', icon: 'group' },
    { label: 'Tipos de Reclamo', route: '/claim-types', icon: 'label' },
    { label: 'Sucursales', route: '/branches', icon: 'business' },
    { label: 'Usuarios', route: '/users', icon: 'person' },
  ]);

  readonly secondaryMenuItems = signal<MenuItem[]>([
    { label: 'Configuración', route: '/settings', icon: 'settings' },
    { label: 'Ayuda', route: '/help', icon: 'help' },
  ]);

  logout() {
    this.auth.clearSession();
    this.router.navigateByUrl('/auth/login');
  }
}
