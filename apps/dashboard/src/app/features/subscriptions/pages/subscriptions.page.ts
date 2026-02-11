import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SubscriptionsService } from '../../../core/services/subscriptions.service';

@Component({
  selector: 'app-subscriptions-page',
  standalone: true,
  templateUrl: './subscriptions.page.html',
  styleUrl: './subscriptions.page.css'
})
export class SubscriptionsPage implements OnInit {
  private readonly subscriptionsService = inject(SubscriptionsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dateFormatter = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  subscription = this.subscriptionsService.createDefaultSubscription();
  plan_details = this.subscriptionsService.createDefaultPlanDetails();
  usage = this.subscriptionsService.createDefaultUsage();
  warnings = this.subscriptionsService.createDefaultWarnings();

  ngOnInit(): void {
    this.subscriptionsService
      .loadOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ subscription, plan_details, usage, warnings }) => {
        this.subscription = subscription;
        this.plan_details = plan_details;
        this.usage = usage;
        this.warnings = warnings;
      });
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }
    return this.dateFormatter.format(parsed);
  }

  formatDateRange(start?: string | null, end?: string | null): string {
    const startLabel = this.formatDate(start);
    const endLabel = this.formatDate(end);
    if (startLabel === '—' && endLabel === '—') {
      return '—';
    }
    if (startLabel === '—') {
      return `Hasta ${endLabel}`;
    }
    if (endLabel === '—') {
      return `Desde ${startLabel}`;
    }
    return `Del ${startLabel} al ${endLabel}`;
  }
}
