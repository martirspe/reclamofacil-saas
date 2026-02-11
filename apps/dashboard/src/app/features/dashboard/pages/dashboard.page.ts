import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  ClaimsPageResult,
  DashboardService,
  DashboardKpiMetrics,
  KpiDateRange,
  RecentClaimRow
} from '../../../core/services/dashboard.service';
import { GreetingService } from '../../../shared/services/greeting.service';
import { AnalyticsCard } from '../components/analytics-card/analytics-card';
import { RecentClaimsTable } from '../components/recent-claims-table/recent-claims-table';
import { DateRangeSelector, DateRangeSelection } from '../components/date-range-selector';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    AnalyticsCard,
    DateRangeSelector,
    RecentClaimsTable
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
  providers: [DashboardService]
})
export class DashboardPage {
  readonly greetingService = inject(GreetingService);
  private readonly dashboardService = inject(DashboardService);

  private readonly emptyKpi: DashboardKpiMetrics = {
    totalClaims: 0,
    pendingClaims: 0,
    avgResolutionDays: null,
    resolutionRate: 0,
    totalChangePct: null,
    pendingChangePct: null,
    avgResolutionChangeDays: null,
    resolutionRateChangePct: null
  };

  private readonly kpiQuery = signal<{ periodDays?: number; range?: KpiDateRange }>({ periodDays: 30 });
  private readonly claimsQuery = signal<{
    page: number;
    limit: number;
    status: 'all' | RecentClaimRow['status'];
    search: string;
  }>({
    page: 1,
    limit: 10,
    status: 'all',
    search: ''
  });
  private readonly tableSubtitle = signal('Este mes');
  readonly searchTerm = signal('');
  private readonly debouncedSearch = toSignal(
    toObservable(this.searchTerm).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' }
  );
  private readonly emptyClaimsPage: ClaimsPageResult = {
    rows: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1
    }
  };

  readonly kpi = toSignal(
    toObservable(this.kpiQuery).pipe(
      switchMap((query) => this.dashboardService.getKpiMetrics(query))
    ),
    { initialValue: this.emptyKpi }
  );

  readonly claimsPage = toSignal(
    toObservable(this.claimsQuery).pipe(
      switchMap((query) => this.dashboardService.getClaimsPage(query))
    ),
    { initialValue: this.emptyClaimsPage }
  );

  readonly recentClaims = computed(() => this.claimsPage().rows);
  readonly claimsPagination = computed(() => this.claimsPage().pagination);
  readonly paginationPages = computed(() => this.buildPaginationPages());
  readonly showStartEllipsis = computed(() => this.paginationPages().length > 0 && this.paginationPages()[0] > 2);
  readonly showEndEllipsis = computed(() => {
    const pages = this.paginationPages();
    const pagination = this.claimsPagination();
    if (!pages.length) {
      return pagination.pages > 2;
    }
    return pages[pages.length - 1] < pagination.pages - 1;
  });

  constructor() {
    effect(() => {
      const search = this.debouncedSearch();
      this.claimsQuery.update((current) => ({
        ...current,
        page: 1,
        search
      }));
    });
  }

  onRangeSelectionChange(selection: DateRangeSelection): void {
    this.kpiQuery.set(selection.query);
    this.tableSubtitle.set(selection.label);
  }

  onStatusFilterChange(value: string): void {
    const status = value === 'resolved' || value === 'in-progress' || value === 'pending' || value === 'escalated'
      ? value
      : 'all';
    this.claimsQuery.update((current) => ({
      ...current,
      page: 1,
      status
    }));
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onPageSizeChange(value: string): void {
    const limit = Math.max(1, Number.parseInt(value, 10) || 10);
    this.claimsQuery.update((current) => ({
      ...current,
      page: 1,
      limit
    }));
  }

  goToPage(page: number): void {
    const pagination = this.claimsPagination();
    const safePage = Math.min(Math.max(page, 1), Math.max(pagination.pages, 1));
    if (safePage === pagination.page) {
      return;
    }
    this.claimsQuery.update((current) => ({
      ...current,
      page: safePage
    }));
  }

  getTableSubtitle(): string {
    return this.tableSubtitle();
  }

  getTableMetaText(): string {
    const pagination = this.claimsPagination();
    if (!pagination.total) {
      return 'Mostrando 0 de 0';
    }
    const pageCount = this.recentClaims().length;
    const start = pageCount ? (pagination.page - 1) * pagination.limit + 1 : 0;
    const end = Math.min((pagination.page - 1) * pagination.limit + pageCount, pagination.total);
    return `Mostrando ${start}–${end} de ${pagination.total}`;
  }

  formatPercent(value: number | null): string {
    if (value === null) {
      return '—';
    }
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${Math.abs(value).toFixed(1)}%`;
  }

  formatDays(value: number | null): string {
    if (value === null) {
      return '—';
    }
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${Math.abs(value).toFixed(1)} días`;
  }

  formatRate(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatAvgResolutionValue(value: number | null): string {
    if (value === null) {
      return '—';
    }
    return `${value.toFixed(1)} días`;
  }


  private buildPaginationPages(): number[] {
    const pagination = this.claimsPagination();
    const totalPages = Math.max(pagination.pages, 1);
    if (totalPages <= 2) {
      return [];
    }

    const current = pagination.page;
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);
    const pages: number[] = [];

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }

  getChangeClass(value: number | null, invert = false): string {
    if (value === null || value === 0) {
      return 'dashboard-metric-change--neutral';
    }
    const isPositive = invert ? value < 0 : value > 0;
    return isPositive ? 'dashboard-metric-change--positive' : 'dashboard-metric-change--negative';
  }

  isPositiveChange(value: number | null, invert = false): boolean {
    if (value === null || value === 0) {
      return false;
    }
    return invert ? value < 0 : value > 0;
  }

  isNegativeChange(value: number | null, invert = false): boolean {
    if (value === null || value === 0) {
      return false;
    }
    return invert ? value > 0 : value < 0;
  }
}
