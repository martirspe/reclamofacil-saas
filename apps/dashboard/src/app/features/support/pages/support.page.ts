import { Component } from '@angular/core';

@Component({
  selector: 'app-support-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Soporte</h1>
      <p>Centro de ayuda y tickets.</p>
    </section>
  `,
  styles: [
    `
    .page { display: grid; gap: 0.5rem; }
    h1 { margin: 0; }
    `
  ]
})
export class SupportPage {}
