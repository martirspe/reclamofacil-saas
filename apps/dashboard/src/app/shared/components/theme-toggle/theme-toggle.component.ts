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
          <span class="theme-icon" [attr.aria-hidden]="true">
            {{ option.icon }}
          </span>
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
      font-family: 'Material Symbols Outlined';
      font-size: 14px;
      font-weight: normal;
      font-style: normal;
      letter-spacing: normal;
      text-transform: none;
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
      width: 14px;
      height: 14px;
      transition: transform var(--transition-fast);
    }
  `]
})
export class ThemeToggleComponent {
  // Inyecciones
  private readonly themeService = inject(ThemeService);

  // Definición de opciones de tema
  readonly themeOptions = [
    { value: 'light' as const, label: 'Claro', icon: 'light_mode' },
    { value: 'system' as const, label: 'Sistema', icon: 'computer' },
    { value: 'dark' as const, label: 'Oscuro', icon: 'dark_mode' }
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
