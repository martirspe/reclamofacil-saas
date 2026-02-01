import { ChangeDetectionStrategy, Component } from '@angular/core';
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
    <div class="shell">
      <app-sidebar />
      <div class="shell__main">
        <app-header />
        <main class="shell__content">
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
      background: #0a0a0f;
      color: #e5e7eb; 
    }
    .shell { 
      display: grid; 
      grid-template-columns: 260px 1fr; 
      min-height: 100vh;
      background: radial-gradient(ellipse at top, #10101a 0%, #0a0a0f 100%);
    }
    .shell__main { 
      display: grid; 
      grid-template-rows: auto 1fr auto; 
      min-height: 100vh;
      background: linear-gradient(135deg, rgba(20, 20, 30, 0.3) 0%, rgba(10, 10, 15, 0.5) 100%);
    }
    .shell__content { 
      padding: 2rem;
    }
    @media (max-width: 1024px) {
      .shell { grid-template-columns: 1fr; }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent {}
