import { Component } from '@angular/core';

@Component({
  selector: 'app-claims-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Reclamos</h1>
      <p>Listado y gestión de reclamos.</p>
    </section>
  `,
  styles: [
    `
    .page { display: grid; gap: 0.5rem; }
    h1 { margin: 0; }
    `
  ]
})
export class ClaimsPage {}
