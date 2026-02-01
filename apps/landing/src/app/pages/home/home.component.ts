import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing">
      <header>
        <nav>
          <h1>ReclamoFacil</h1>
          <ul>
            <li><a routerLink="/">Inicio</a></li>
            <li><a routerLink="/features">Features</a></li>
            <li><a routerLink="/pricing">Precios</a></li>
            <li><a routerLink="/contact">Contacto</a></li>
          </ul>
        </nav>
      </header>

      <section class="hero">
        <h1>Plataforma Multi-Tenant para Gestión de Reclamos</h1>
        <p>Automatiza la gestión de libro de reclamaciones para empresas</p>
        <button>Comenzar Prueba Gratis</button>
      </section>

      <section class="features">
        <div class="feature">
          <h3>🚀 Multi-Tenant</h3>
          <p>Cada cliente su propio subdominio y personalización</p>
        </div>
        <div class="feature">
          <h3>⚡ Alta Performance</h3>
          <p>Angular 21 Zoneless + Signals</p>
        </div>
        <div class="feature">
          <h3>🔒 Seguro</h3>
          <p>Aislamiento total de datos por tenant</p>
        </div>
      </section>

      <footer>
        <p>&copy; 2026 ReclamoFacil. All rights reserved.</p>
      </footer>
    </div>
  `,
  styles: [`
    .landing { font-family: system-ui, sans-serif; }
    header { background: #1f2937; color: white; padding: 20px; }
    nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }
    nav ul { display: flex; gap: 20px; list-style: none; }
    nav a { color: white; text-decoration: none; }
    .hero { text-align: center; padding: 100px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .hero h1 { font-size: 3rem; margin-bottom: 20px; }
    .hero button { background: white; color: #667eea; padding: 15px 30px; border: none; border-radius: 8px; font-size: 1.2rem; cursor: pointer; margin-top: 20px; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; padding: 80px 20px; max-width: 1200px; margin: 0 auto; }
    .feature { text-align: center; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; }
    footer { text-align: center; padding: 40px; background: #f9fafb; }
  `]
})
export class HomeComponent {}
