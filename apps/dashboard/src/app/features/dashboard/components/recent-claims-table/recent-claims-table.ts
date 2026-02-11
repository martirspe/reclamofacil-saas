import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentClaimRow } from '../../../../core/services/dashboard.service';

type ClaimsPagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

@Component({
  selector: 'app-recent-claims-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-claims-table.html',
  styleUrl: './recent-claims-table.css'
})
export class RecentClaimsTable {
  readonly subtitle = input<string>('');
  readonly metaText = input<string>('');
  readonly searchTerm = input<string>('');
  readonly recentClaims = input<RecentClaimRow[]>([]);
  readonly pagination = input<ClaimsPagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  readonly paginationPages = input<number[]>([]);
  readonly showStartEllipsis = input(false);
  readonly showEndEllipsis = input(false);

  readonly searchChange = output<string>();
  readonly statusChange = output<string>();
  readonly pageSizeChange = output<string>();
  readonly pageChange = output<number>();

  private readonly dateFormatter = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  onSearchInput(value: string): void {
    this.searchChange.emit(value);
  }

  onStatusChange(value: string): void {
    this.statusChange.emit(value);
  }

  onPageSizeSelected(value: string): void {
    this.pageSizeChange.emit(value);
  }

  goToPage(page: number): void {
    this.pageChange.emit(page);
  }

  formatClaimCode(code: string): string {
    if (!code) {
      return '—';
    }
    return code.startsWith('#') ? code : `#${code}`;
  }

  formatShortDate(value: Date): string {
    return this.dateFormatter.format(value);
  }

  getStatusLabel(status: RecentClaimRow['status']): string {
    switch (status) {
      case 'resolved':
        return 'Resuelto';
      case 'in-progress':
        return 'En proceso';
      case 'pending':
        return 'Pendiente';
      case 'escalated':
        return 'Escalado';
      default:
        return '—';
    }
  }

  getStatusBadgeClass(status: RecentClaimRow['status']): string {
    return `dashboard-table-badge--${status}`;
  }

  getSlaLabel(state: RecentClaimRow['slaState']): string {
    return state === 'late' ? 'Vencido' : 'A tiempo';
  }

  getSlaBadgeClass(state: RecentClaimRow['slaState']): string {
    return state === 'late' ? 'dashboard-table-badge--sla-late' : 'dashboard-table-badge--sla-ok';
  }
}
