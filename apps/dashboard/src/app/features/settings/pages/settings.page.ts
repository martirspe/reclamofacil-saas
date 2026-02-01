import { Component } from '@angular/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Ajustes</h1>
      <p>Configuración del tenant y usuarios.</p>
    </section>
  `,
  styles: [
    `
    .page { display: grid; gap: 0.5rem; }
    h1 { margin: 0; }
    `
  ]
})
export class SettingsPage {}
