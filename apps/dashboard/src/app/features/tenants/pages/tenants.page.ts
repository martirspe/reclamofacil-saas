import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-tenants-page',
  standalone: true,
  templateUrl: './tenants.page.html',
  styleUrl: './tenants.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantsPage {}
