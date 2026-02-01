import { 
  Injectable, 
  signal, 
  computed, 
  effect,
  DOCUMENT
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

/**
 * Servicio centralizado de gestión de temas con Signals
 * 
 * Características:
 * - Estado reactivo con Signals (systemPrefersDark, themeSignal)
 * - Computed properties (isDark) para valores derivados
 * - Effect para sincronización automática con el DOM
 * - Persistencia en localStorage
 * - Detección de cambios del sistema operativo
 * - SSR-safe (sin acceso directo a window/document)
 * 
 * @example
 * ```typescript
 * constructor(private themeService: ThemeService) {}
 * 
 * ngOnInit() {
 *   // Reactive binding
 *   this.isDark = this.themeService.isDark;
 *   
 *   // Observable
 *   this.themeService.theme$.subscribe(theme => {...});
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme-preference';
  private readonly VALID_THEMES: Theme[] = ['light', 'dark', 'system'];
  
  // Inyecciones
  private readonly document = inject(DOCUMENT);

  // ================== Signals ==================
  
  /** Preferencia de tema del usuario */
  private readonly userThemeSignal = signal<Theme>('light');
  
  /** Preferencia de tema del sistema operativo */
  private readonly systemPrefersDarkSignal = signal<boolean>(
    this.getSystemPreference()
  );

  // ================== Computed ==================
  
  /** Determina si debe aplicarse el tema oscuro */
  readonly isDark = computed(() => this.computeIsDark());
  
  /** Determina el tema efectivo (resuelve 'system' a 'dark' o 'light') */
  readonly effectiveTheme = computed<Exclude<Theme, 'system'>>(() => 
    this.isDark() ? 'dark' : 'light'
  );

  // ================== Observables ==================
  
  /** Observable de cambios del tema para compatibilidad con RxJS */
  readonly theme$ = toObservable(this.userThemeSignal);
  
  /** Observable del tema efectivo */
  readonly effectiveTheme$ = toObservable(this.effectiveTheme);

  // ================== Public Methods ==================

  /**
   * Establece el tema de la aplicación
   * @param newTheme - 'light', 'dark' o 'system'
   */
  setTheme(newTheme: Theme): void {
    if (!this.isValidTheme(newTheme)) {
      console.warn(`[ThemeService] Invalid theme: ${newTheme}`);
      return;
    }

    this.userThemeSignal.set(newTheme);
    this.saveThemePreference(newTheme);
  }

  /**
   * Alterna entre tema claro y oscuro
   * Si el tema actual es 'system', alterna según la preferencia del SO
   */
  toggleTheme(): void {
    const current = this.userThemeSignal();
    
    if (current === 'system') {
      this.setTheme(this.isDark() ? 'light' : 'dark');
    } else {
      this.setTheme(current === 'dark' ? 'light' : 'dark');
    }
  }

  /**
   * Obtiene el tema preferido por el usuario
   */
  getCurrentUserTheme(): Theme {
    return this.userThemeSignal();
  }

  /**
   * Obtiene el tema efectivo (resuelve 'system')
   */
  getEffectiveTheme(): Exclude<Theme, 'system'> {
    return this.effectiveTheme();
  }

  /**
   * Verifica si el modo oscuro está activo
   */
  isDarkMode(): boolean {
    return this.isDark();
  }

  /**
   * Restaura la preferencia del tema del sistema
   */
  useSystemPreference(): void {
    this.setTheme('system');
  }

  // ================== Constructor & Effects ==================

  constructor() {
    this.initializeTheme();
    this.setupSystemPreferenceListener();
    this.setupDOMSync();
  }

  // ================== Private Methods ==================

  /**
   * Inicializa el estado del tema desde localStorage o preferencia del sistema
   */
  private initializeTheme(): void {
    const saved = this.loadThemePreference();
    if (saved && this.isValidTheme(saved)) {
      this.userThemeSignal.set(saved);
    }
  }

  /**
   * Configura sincronización automática del DOM cuando cambia el tema
   * Utiliza effect para reactividad automática
   */
  private setupDOMSync(): void {
    effect(() => {
      // Rastrear cambios en userTheme e isDark
      const userTheme = this.userThemeSignal();
      const isDark = this.isDark();
      
      // Aplicar al DOM
      this.applyThemeToDOM(userTheme, isDark);
    });
  }

  /**
   * Configura listener para cambios en la preferencia del SO
   */
  private setupSystemPreferenceListener(): void {
    if (typeof window === 'undefined') return;

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (event: MediaQueryListEvent) => {
        this.systemPrefersDarkSignal.set(event.matches);
      };

      // Soporte para navegadores antiguos y modernos
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Fallback para navegadores más antiguos
        mediaQuery.addListener(handleChange);
      }
    } catch (error) {
      console.error('[ThemeService] Error setting up system preference listener:', error);
    }
  }

  /**
   * Carga la preferencia del tema desde localStorage
   */
  private loadThemePreference(): Theme | null {
    if (typeof localStorage === 'undefined') return null;

    try {
      return localStorage.getItem(this.THEME_KEY) as Theme | null;
    } catch (error) {
      console.warn('[ThemeService] Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Guarda la preferencia del tema en localStorage
   */
  private saveThemePreference(theme: Theme): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
      console.warn('[ThemeService] Error writing to localStorage:', error);
    }
  }

  /**
   * Determina si debe aplicarse el modo oscuro
   */
  private computeIsDark(): boolean {
    const userTheme = this.userThemeSignal();
    
    if (userTheme === 'system') {
      return this.systemPrefersDarkSignal();
    }
    
    return userTheme === 'dark';
  }

  /**
   * Obtiene la preferencia del tema del sistema operativo
   */
  private getSystemPreference(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.warn('[ThemeService] Error checking system preference:', error);
      return false;
    }
  }

  /**
   * Aplica el tema al DOM
   */
  private applyThemeToDOM(userTheme: Theme, isDark: boolean): void {
    if (typeof document === 'undefined') return;

    try {
      const html = this.document.documentElement;
      
      // Establecer atributo data-theme
      if (userTheme === 'system') {
        html.removeAttribute('data-theme');
      } else {
        html.setAttribute('data-theme', userTheme);
      }
      
      // Establecer clase dark para compatibilidad
      html.classList.toggle('dark', isDark);
    } catch (error) {
      console.error('[ThemeService] Error applying theme to DOM:', error);
    }
  }

  /**
   * Valida si un tema es válido
   */
  private isValidTheme(theme: unknown): theme is Theme {
    return typeof theme === 'string' && this.VALID_THEMES.includes(theme as Theme);
  }
}
