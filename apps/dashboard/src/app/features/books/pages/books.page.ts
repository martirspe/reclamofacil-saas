import { Component } from '@angular/core';

@Component({
  selector: 'app-books-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Libros</h1>
      <p>Administración de libros de reclamaciones.</p>
    </section>
  `,
  styles: [
    `
    .page { display: grid; gap: 0.5rem; }
    h1 { margin: 0; }
    `
  ]
})
export class BooksPage {}
