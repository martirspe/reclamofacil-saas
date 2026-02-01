import { Component } from '@angular/core';

@Component({
  selector: 'app-users-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Usuarios</h1>
      <p>Gestión de usuarios del tenant.</p>
    </section>
  `,
  styles: [
    `
    .page { display: grid; gap: 0.5rem; }
    h1 { margin: 0; }
    `
  ]
})
export class UsersPage {}
