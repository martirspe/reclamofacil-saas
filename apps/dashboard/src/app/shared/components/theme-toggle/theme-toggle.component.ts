import {
  Component,
  computed,
  inject
} from '@angular/core';
import { ThemeService, type Theme } from '../../../core/services/theme.service';

/**
 * Componente de selector de tema minimalista
 * 
 * @example
 * ```html
 * <app-theme-toggle></app-theme-toggle>
 * ```
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <div class="theme-toggle">
      @for (option of themeOptions; track option.value) {
        <button 
          class="theme-btn"
          [class.selected]="currentTheme() === option.value"
          (click)="selectTheme(option.value)"
          type="button"
          [attr.aria-label]="'Tema ' + option.label"
          [attr.aria-pressed]="currentTheme() === option.value"
        >
          @switch (option.value) {
            @case ('light') {
              <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4"></circle>
                <line x1="12" y1="2" x2="12" y2="5"></line>
                <line x1="12" y1="19" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="5" y2="12"></line>
                <line x1="19" y1="12" x2="22" y2="12"></line>
                <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"></line>
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"></line>
                <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"></line>
                <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"></line>
              </svg>
            }
            @case ('system') {
              <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="12" rx="2"></rect>
                <line x1="8" y1="20" x2="16" y2="20"></line>
                <line x1="12" y1="16" x2="12" y2="20"></line>
              </svg>
            }
            @case ('dark') {
              <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            }
          }
        </button>
      }
    </div>
  `,
  styles: [`
    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      border: 1px solid var(--color-border-secondary);
      border-radius: var(--radius-full);
      padding: 2px;
      background: var(--color-surface-base);
      box-shadow: var(--shadow-xs);
      transition: all var(--transition-fast);
    }

    .theme-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-tertiary);
      cursor: pointer;
      transition: all var(--transition-fast);
      padding: 0;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      -moz-osx-font-smoothing: grayscale;
    }

    .theme-btn:hover {
      color: var(--color-primary);
      background: var(--color-primary-alpha-10);
    }

    .theme-btn:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      box-shadow: var(--shadow-focus);
    }

    .theme-btn.selected {
      color: var(--color-primary);
      background: var(--color-primary-alpha-20);
    }

    .theme-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      transition: transform var(--transition-fast);
    }
  `]
})
export class ThemeToggleComponent {
  // Inyecciones
  private readonly themeService = inject(ThemeService);

  // Definición de opciones de tema
  readonly themeOptions = [
    { value: 'light' as const, label: 'Claro' },
    { value: 'system' as const, label: 'Sistema' },
    { value: 'dark' as const, label: 'Oscuro' }
  ];

  // ================== Computed ==================

  /** Tema actual seleccionado por el usuario */
  currentTheme = computed(() => this.themeService.getCurrentUserTheme());

  // ================== Public Methods ==================

  /**
   * Selecciona un tema
   */
  selectTheme(theme: Theme): void {
    document.body.classList.add('theme-transitioning');
    this.themeService.setTheme(theme);

    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);
  }
}
