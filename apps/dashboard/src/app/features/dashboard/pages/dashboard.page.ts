import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';
import { GreetingService } from '../../../shared/services/greeting.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
  providers: [DashboardService]
})
export class DashboardPage {
  readonly greetingService = inject(GreetingService);
}
