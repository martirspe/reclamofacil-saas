import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { UserDropdownComponent } from '../user-dropdown/user-dropdown.component';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, UserDropdownComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly isOpen = input(false);
  readonly closeSidebar = output<void>();
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Dropdown state
  readonly isDropdownOpen = signal(false);

  readonly userEmail = computed(() => this.auth.user()?.email ?? 'usuario@ejemplo.com');

  navigateAndClose(route: string) {
    this.router.navigate([route]);
    this.closeSidebar.emit();
  }
  readonly userName = computed(() => {
    const user = this.auth.user();
    if (user?.first_name) {
      return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }
    return 'Usuario';
  });

  readonly userInitials = computed(() => {
    const name = this.userName();
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
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

  toggleDropdown(): void {
    this.isDropdownOpen.update((value: boolean) => !value);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  logout(): void {
    this.auth.clearSession();
    this.router.navigateByUrl('/auth/login');
  }
}
