import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
  output,
  effect,
  HostListener,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeToggleComponent],
  templateUrl: './user-dropdown.component.html',
  styleUrl: './user-dropdown.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDropdownComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly elementRef = inject(ElementRef);

  // Outputs
  readonly closeDropdown = output<void>();

  // User data computed from AuthService
  readonly userEmail = computed(() => this.auth.user()?.email ?? 'usuario@ejemplo.com');
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
      .map((word: string) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  readonly userRole = computed(() => this.auth.user()?.role ?? 'Rol no definido');



  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeDropdown.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeDropdown.emit();
  }

  logout(): void {
    this.auth.clearSession();
    this.toast.showSuccess('Sesión cerrada exitosamente', 'Hasta pronto');
    this.closeDropdown.emit();
    this.router.navigate(['/auth/login']);
  }

  navigateAndClose(route: string): void {
    this.router.navigate([route]);
    this.closeDropdown.emit();
  }
}
