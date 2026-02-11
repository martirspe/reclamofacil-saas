import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { DashboardService, ClaimPriorityData, ClaimStatusData } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-analytics-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-card.html',
  styleUrl: './analytics-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsCard {
  private readonly dashboardService = inject(DashboardService);

  private readonly statusChartSignal = toSignal(
    this.dashboardService.getClaimStatusData().pipe(map((data) => this.buildStatusChart(data))),
    { initialValue: { buckets: [] as StatusBucket[] } }
  );

  private readonly priorityChartSignal = toSignal(
    this.dashboardService.getClaimPriorityData().pipe(map((data) => this.buildPriorityChart(data))),
    { initialValue: this.getEmptyPriorityChart() }
  );

  readonly statusChart = computed(() => this.statusChartSignal());
  readonly priorityChart = computed(() => this.priorityChartSignal());

  private buildStatusChart(data: ClaimStatusData[]) {
    const totals = data.map((item) => item.resolved + item.inProgress + item.pending + item.escalated);
    const maxTotal = Math.max(...totals, 1);

    const buckets = data.map((item) => {
      const resolvedHeight = this.toPercent(item.resolved, maxTotal);
      const inProgressHeight = this.toPercent(item.inProgress, maxTotal);
      const pendingHeight = this.toPercent(item.pending, maxTotal);
      const escalatedHeight = this.toPercent(item.escalated, maxTotal);

      return {
        label: item.dateRange,
        resolved: item.resolved,
        inProgress: item.inProgress,
        pending: item.pending,
        escalated: item.escalated,
        resolvedHeight,
        inProgressHeight,
        pendingHeight,
        escalatedHeight
      };
    });

    return { buckets };
  }

  private buildPriorityChart(data: ClaimPriorityData) {
    const total = data.critical + data.high + data.medium + data.low;
    const criticalPct = this.toPercent(data.critical, total);
    const highPct = this.toPercent(data.high, total);
    const mediumPct = this.toPercent(data.medium, total);
    const lowPct = this.toPercent(data.low, total);

    const firstStop = criticalPct;
    const secondStop = firstStop + highPct;
    const thirdStop = secondStop + mediumPct;

    const gradient = total > 0
      ? `conic-gradient(var(--color-error) 0% ${firstStop}%, var(--color-warning) ${firstStop}% ${secondStop}%, var(--color-primary) ${secondStop}% ${thirdStop}%, var(--color-text-tertiary) ${thirdStop}% 100%)`
      : 'conic-gradient(var(--color-border-secondary) 0% 100%)';

    const ariaLabel = `Prioridad de reclamos. Critica ${data.critical}, alta ${data.high}, media ${data.medium}, baja ${data.low}.`;

    return {
      total,
      critical: data.critical,
      high: data.high,
      medium: data.medium,
      low: data.low,
      gradient,
      ariaLabel
    };
  }

  private toPercent(value: number, total: number): number {
    if (total <= 0) {
      return 0;
    }
    const pct = Math.round((value / total) * 100);
    if (value > 0 && pct < 4) {
      return 4;
    }
    return pct;
  }

  private getEmptyPriorityChart(): PriorityChart {
    return {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      gradient: 'conic-gradient(var(--color-border-secondary) 0% 100%)',
      ariaLabel: 'Prioridad de reclamos sin datos.'
    };
  }
}

type StatusBucket = {
  label: string;
  resolved: number;
  inProgress: number;
  pending: number;
  escalated: number;
  resolvedHeight: number;
  inProgressHeight: number;
  pendingHeight: number;
  escalatedHeight: number;
};

type PriorityChart = {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  gradient: string;
  ariaLabel: string;
};
