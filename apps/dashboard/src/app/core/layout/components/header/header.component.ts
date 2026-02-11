import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { NotificationItem, NotificationsService } from '../../../services/notifications.service';
import { UserDropdownComponent } from '../user-dropdown/user-dropdown.component';

type NotificationView = NotificationItem & { time: string };

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
  readonly notificationsService = inject(NotificationsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly timeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  @ViewChild('notificationsButton', { read: ElementRef })
  private readonly notificationsButton?: ElementRef<HTMLElement>;

  @ViewChild('notificationsPanel', { read: ElementRef })
  private readonly notificationsPanel?: ElementRef<HTMLElement>;

  readonly isNotificationsOpen = signal(false);
  readonly isUserMenuOpen = signal(false);

  readonly notifications = computed<NotificationView[]>(() =>
    this.notificationsService.notifications().map((item) => ({
      ...item,
      time: this.formatRelativeTime(item.createdAt)
    }))
  );

  readonly unreadCount = computed(() => this.notificationsService.unreadCount());
  readonly notificationsPagination = computed(() => this.notificationsService.pagination());

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

  constructor() {
    effect(() => {
      if (this.isNotificationsOpen()) {
        this.refreshNotifications();
        this.notificationsService.markAllAsRead().subscribe();
      }
    });

    this.refreshNotifications();
    this.notificationsService.connectStream();
    this.destroyRef.onDestroy(() => this.notificationsService.disconnectStream());
  }

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
    this.notificationsService.markAllAsRead().subscribe();
  }

  markAsRead(notificationId: string): void {
    this.notificationsService.markAsRead(notificationId).subscribe();
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

  private refreshNotifications(): void {
    this.notificationsService.loadNotificationsPage(1, 10, false).subscribe();
  }

  loadMoreNotifications(): void {
    const pagination = this.notificationsPagination();
    if (pagination.page >= pagination.pages) {
      return;
    }
    this.notificationsService.loadNotificationsPage(pagination.page + 1, pagination.limit, true).subscribe();
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (Math.abs(diffSeconds) < 60) {
      return this.timeFormatter.format(diffSeconds, 'second');
    }
    if (Math.abs(diffMinutes) < 60) {
      return this.timeFormatter.format(diffMinutes, 'minute');
    }
    if (Math.abs(diffHours) < 24) {
      return this.timeFormatter.format(diffHours, 'hour');
    }
    return this.timeFormatter.format(diffDays, 'day');
  }
}
