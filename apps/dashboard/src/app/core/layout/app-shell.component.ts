import { ChangeDetectionStrategy, Component, effect, Injector, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, FooterComponent, ToastComponent],
  template: `
    <div class="shell" [class.shell--sidebar-open]="sidebarOpen()">
      <app-sidebar [isOpen]="sidebarOpen()" (closeSidebar)="closeSidebar()" />
      <div class="shell-overlay" (click)="closeSidebar()" aria-hidden="true"></div>
      <div class="shell-main">
        <app-header (sidebarToggle)="toggleSidebar()" />
        <main class="shell-content">
          <router-outlet />
        </main>
        <app-footer />
      </div>
      <app-toast-container />
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
      min-height: 100vh;
      background: var(--color-bg-base);
      color: var(--color-text-primary);
    }

    .shell {
      display: grid;
      grid-template-columns: var(--sidebar-width) 1fr;
      min-height: 100vh;
      background: var(--color-bg-base);
    }

    .shell-main {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100vh;
      background: var(--color-bg-base);
    }

    .shell-content {
      background: var(--color-bg-base);
    }

    .shell-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 350ms cubic-bezier(0.4, 0, 0.2, 1),
                  visibility 350ms cubic-bezier(0.4, 0, 0.2, 1),
                  backdrop-filter 350ms cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 40;
      pointer-events: none;
    }

    .shell--sidebar-open .shell-overlay {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    @media (max-width: 1024px) {
      .shell {
        grid-template-columns: 1fr;
      }

      app-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        width: var(--sidebar-width);
        height: 100vh;
        transform: translateX(-100%);
        transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 50;
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
      }

      .shell--sidebar-open app-sidebar {
        transform: translateX(0);
        box-shadow: 8px 0 24px 0 rgba(0, 0, 0, 0.12);
      }
    }

    @media (min-width: 1025px) {
      .shell-overlay {
        display: none;
      }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent {
  sidebarOpen = signal(false);

  constructor(private injector: Injector) {
    effect(() => {
      const isOpen = this.sidebarOpen();
      if (typeof document !== 'undefined') {
        if (isOpen) {
          document.body.style.overflow = 'hidden';
          document.body.style.paddingRight = '0px';
        } else {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      }
    }, { injector: this.injector });
  }

  toggleSidebar() {
    this.sidebarOpen.update(state => !state);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
