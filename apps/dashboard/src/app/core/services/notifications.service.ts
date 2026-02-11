import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  unread: boolean;
  type: NotificationType;
};

type NotificationRecord = {
  id: number;
  title: string;
  description: string;
  type: NotificationType;
  read_at: string | null;
  created_at: string;
};

type NotificationsResponse = {
  data: NotificationRecord[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

type NotificationsPage = NotificationsResponse['pagination'];

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly notificationsSignal = signal<NotificationItem[]>([]);
  private readonly unreadCountSignal = signal(0);
  private readonly paginationSignal = signal<NotificationsPage>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  private eventSource: EventSource | null = null;

  readonly notifications = computed(() => this.notificationsSignal());
  readonly unreadCount = computed(() => this.unreadCountSignal());
  readonly pagination = computed(() => this.paginationSignal());

  loadNotificationsPage(page = 1, limit = 10, append = false): Observable<NotificationItem[]> {
    const url = this.getNotificationsUrl();
    if (!url) {
      this.notificationsSignal.set([]);
      this.unreadCountSignal.set(0);
      return of([]);
    }

    return this.http.get<NotificationsResponse>(url, { params: { page: String(page), limit: String(limit) } }).pipe(
      map((response) => ({
        items: response.data.map(this.mapNotificationRecord),
        unreadCount: response.unreadCount,
        pagination: response.pagination
      })),
      tap(({ items, unreadCount, pagination }) => {
        this.unreadCountSignal.set(unreadCount);
        this.paginationSignal.set(pagination);
        if (append) {
          this.notificationsSignal.update((current) => this.mergeNotifications(current, items));
        } else {
          this.notificationsSignal.set(items);
        }
      }),
      map(({ items }) => items)
    );
  }

  markAsRead(id: string): Observable<void> {
    const url = this.getNotificationsUrl();
    if (!url) {
      return of(void 0);
    }

    return this.http.patch<{ success: boolean }>(`${url}/${id}/read`, {}).pipe(
      tap(() => {
        this.notificationsSignal.update((items) =>
          items.map((item) => (item.id === id ? { ...item, unread: false } : item))
        );
        this.unreadCountSignal.update((count) => Math.max(count - 1, 0));
      }),
      map(() => void 0)
    );
  }

  markAllAsRead(): Observable<void> {
    const url = this.getNotificationsUrl();
    if (!url) {
      return of(void 0);
    }

    return this.http.patch<{ success: boolean }>(`${url}/read-all`, {}).pipe(
      tap(() => {
        this.notificationsSignal.update((items) =>
          items.map((item) => ({ ...item, unread: false }))
        );
        this.unreadCountSignal.set(0);
      }),
      map(() => void 0)
    );
  }

  connectStream(): void {
    if (this.eventSource) {
      return;
    }
    const url = this.getNotificationsUrl();
    const token = this.auth.getToken();
    if (!url || !token) {
      return;
    }
    this.eventSource = new EventSource(`${url}/stream?access_token=${encodeURIComponent(token)}`);
    this.eventSource.addEventListener('notifications', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { items: NotificationRecord[]; unreadCount: number };
        const items = payload.items.map(this.mapNotificationRecord);
        this.unreadCountSignal.set(payload.unreadCount);
        this.notificationsSignal.update((current) => this.mergeNotifications(items, current));
      } catch {
        // ignore malformed payload
      }
    });
  }

  disconnectStream(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  private mapNotificationRecord = (record: NotificationRecord): NotificationItem => ({
    id: String(record.id),
    title: record.title,
    description: record.description,
    createdAt: new Date(record.created_at),
    unread: !record.read_at,
    type: record.type
  });

  private mergeNotifications(a: NotificationItem[], b: NotificationItem[]): NotificationItem[] {
    const map = new Map<string, NotificationItem>();
    [...a, ...b].forEach((item) => {
      map.set(item.id, item);
    });
    return Array.from(map.values()).sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  private getNotificationsUrl(): string | null {
    const slug = this.auth.getTenantSlug();
    if (!slug) {
      return null;
    }
    return `${environment.API_URL}/api/tenants/${slug}/notifications`;
  }
}
