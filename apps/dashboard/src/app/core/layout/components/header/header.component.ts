import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { UserDropdownComponent } from '../user-dropdown/user-dropdown.component';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: NotificationType;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-001',
    title: 'Nuevo reclamo asignado',
    description: 'RC-2024-041 asignado a tu bandeja.',
    time: 'Hace 5 min',
    unread: true,
    type: 'info'
  },
  {
    id: 'notif-002',
    title: 'SLA en riesgo',
    description: '2 reclamos críticos cerca del vencimiento.',
    time: 'Hace 1 h',
    unread: true,
    type: 'warning'
  },
  {
    id: 'notif-003',
    title: 'Reclamo resuelto',
    description: 'RC-2024-018 fue marcado como resuelto.',
    time: 'Ayer',
    unread: false,
    type: 'success'
  }
];

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, UserDropdownComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  readonly isSidebarCollapsed = input(false);
  readonly toggleSidebarCollapse = output<void>();
  readonly sidebarToggle = output<void>();

  private readonly auth = inject(AuthService);

  @ViewChild('notificationsButton', { read: ElementRef })
  private readonly notificationsButton?: ElementRef<HTMLElement>;

  @ViewChild('notificationsPanel', { read: ElementRef })
  private readonly notificationsPanel?: ElementRef<HTMLElement>;

  readonly isNotificationsOpen = signal(false);
  readonly isUserMenuOpen = signal(false);

  readonly notifications = signal<NotificationItem[]>([...INITIAL_NOTIFICATIONS]);

  readonly unreadCount = computed(() =>
    this.notifications().filter((item) => item.unread).length
  );

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
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  toggleNotifications(): void {
    this.isNotificationsOpen.update((value) => !value);
  }

  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((value) => !value);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  markAllAsRead(): void {
    this.notifications.update((items) =>
      items.map((item) => ({ ...item, unread: false }))
    );
  }

  markAsRead(notificationId: string): void {
    this.notifications.update((items) =>
      items.map((item) =>
        item.id === notificationId ? { ...item, unread: false } : item
      )
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isNotificationsOpen()) return;

    const target = event.target as Node | null;
    const button = this.notificationsButton?.nativeElement;
    const panel = this.notificationsPanel?.nativeElement;

    if (button?.contains(target) || panel?.contains(target)) return;

    this.closeNotifications();
  }
}
