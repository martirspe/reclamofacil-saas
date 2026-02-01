import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-tenants-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Empresas</h1>
      <p>Administración de tenants.</p>
    </section>
  `,
  styles: [
    `
    .page { display: grid; gap: 0.5rem; }
    h1 { margin: 0; }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantsPage {}
