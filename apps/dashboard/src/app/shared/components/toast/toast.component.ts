import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div class="toast toast-enter" [class]="'toast--' + toast.type">
          <!-- Ícono -->
          <span class="toast__icon">
            @switch (toast.type) {
              @case ('success') {
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              }
              @case ('error') {
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              }
              @default {
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              }
            }
          </span>

          <!-- Contenido -->
          <div class="toast__content">
            @if (toast.title) {
              <p class="toast__title">{{ toast.title }}</p>
            }
            <p class="toast__message">{{ toast.message }}</p>
          </div>

          <!-- Botón cerrar -->
          <button
            (click)="toastService.dismiss(toast.id)"
            class="toast__close"
            aria-label="Cerrar notificación"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .toast:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    .toast--success {
      border-left: 4px solid #10b981;
      background: #f0fdf4;
    }

    .toast--success .toast__icon {
      color: #10b981;
    }

    .toast--error {
      border-left: 4px solid #ef4444;
      background: #fef2f2;
    }

    .toast--error .toast__icon {
      color: #ef4444;
    }

    .toast--warning {
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
    }

    .toast--warning .toast__icon {
      color: #f59e0b;
    }

    .toast--info {
      border-left: 4px solid #3b82f6;
      background: #eff6ff;
    }

    .toast--info .toast__icon {
      color: #3b82f6;
    }

    .toast__icon {
      font-size: 18px;
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast__icon svg {
      width: 100%;
      height: 100%;
    }

    .toast__content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .toast__title {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
      color: #1f2937;
      margin: 0;
    }

    .toast__message {
      font-size: 14px;
      line-height: 1.4;
      color: #1f2937;
      margin: 0;
    }

    .toast__close {
      flex-shrink: 0;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #9ca3af;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .toast__close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #374151;
    }

    .toast__close svg {
      width: 100%;
      height: 100%;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }

    .toast-enter {
      animation: slideInRight 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .toast-enter:has(+ :empty) {
      animation: slideOutRight 300ms ease-in forwards;
    }

    @media (max-width: 640px) {
      .toast-container {
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .toast {
        margin-bottom: 8px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
