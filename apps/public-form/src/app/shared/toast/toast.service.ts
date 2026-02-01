import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts = signal<Toast[]>([]);
  private counter = 0;

  readonly toasts$ = this.toasts.asReadonly();

  private show(message: string, type: ToastType = 'info', title?: string, duration = 4000): void {
    const id = ++this.counter;
    const toast: Toast = { id, type, title, message, duration };
    this.toasts.update(toasts => [...toasts, toast]);
    setTimeout(() => this.dismiss(id), duration);
  }

  showSuccess(message: string, title = 'Éxito', duration = 3500): void {
    this.show(message, 'success', title, duration);
  }

  showError(message: string, title = 'Error', duration = 5000): void {
    this.show(message, 'error', title, duration);
  }

  showInfo(message: string, title = 'Información', duration = 4000): void {
    this.show(message, 'info', title, duration);
  }

  showWarning(message: string, title = 'Aviso', duration = 4000): void {
    this.show(message, 'warning', title, duration);
  }

  dismiss(id: number): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
