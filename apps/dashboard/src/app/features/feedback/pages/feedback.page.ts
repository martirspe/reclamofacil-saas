import { Component } from '@angular/core';

@Component({
  selector: 'app-feedback-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Feedback</h1>
      <p>Envío de sugerencias y mejoras.</p>
    </section>
  `,
  styles: [
    `
    .page { display: grid; gap: 0.5rem; }
    h1 { margin: 0; }
    `
  ]
})
export class FeedbackPage {}
