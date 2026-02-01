import { Component } from '@angular/core';

@Component({
  selector: 'app-subscriptions-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Suscripciones</h1>
      <p>Gestión de planes y facturación.</p>
    </section>
  `,
  styles: [
    `
    .page { display: grid; gap: 0.5rem; }
    h1 { margin: 0; }
    `
  ]
})
export class SubscriptionsPage {}
