import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, EMPTY } from 'rxjs';
import { catchError, delay, expand, map, reduce } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface DashboardStats {
  rucsRegistered: number;
  rucsGrowth: number;
  booksCreated: number;
  booksGrowth: number;
  totalClaims: number;
  claimsGrowth: number;
  solvedClaims: number;
  solvedClaimsGrowth: number;
}

export interface ClaimStatusData {
  dateRange: string;
  resolved: number;
  inProgress: number;
  pending: number;
  escalated: number;
}

export interface ClaimPriorityData {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RecentClaimRow {
  id: number;
  code: string;
  client: string;
  channel: string;
  createdAt: Date;
  status: 'resolved' | 'pending' | 'in-progress' | 'escalated';
  slaState: 'ok' | 'late';
  owner: string;
}

export interface ClaimsPageResult {
  rows: RecentClaimRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  claimStatusData: ClaimStatusData[];
  claimPriorityData: ClaimPriorityData;
  recentClaims: RecentClaimRow[];
}

export interface DashboardKpiMetrics {
  totalClaims: number;
  pendingClaims: number;
  avgResolutionDays: number | null;
  resolutionRate: number;
  totalChangePct: number | null;
  pendingChangePct: number | null;
  avgResolutionChangeDays: number | null;
  resolutionRateChangePct: number | null;
}

export interface KpiDateRange {
  start: Date;
  end: Date;
}

type ClaimRecord = {
  id: number;
  code?: string;
  creation_date: string;
  update_date?: string;
  resolved?: boolean;
  assigned_user?: number | null;
  status?: number | string | null;
  Customer?: {
    first_name?: string;
    last_name?: string;
    document_number?: string;
  };
  ConsumptionType?: {
    name?: string;
  };
  ClaimType?: {
    name?: string;
  };
};

type ClaimsResponse = {
  data: ClaimRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = '/api/dashboard';
  private readonly useMockData = false;
  private readonly auth = inject(AuthService);
  private readonly slaDays = 15;
  private readonly slaWarningDays = 2;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los datos del dashboard
   */
  getDashboardData(): Observable<DashboardData> {
    if (this.useMockData) {
      return of(this.getMockData()).pipe(delay(500)); // Simula latencia de red
    }
    return this.http.get<DashboardData>(`${this.apiUrl}/data`).pipe(
      catchError(error => {
        console.error('Error al obtener datos del dashboard:', error);
        return of(this.getMockData());
      })
    );
  }

  /**
   * Obtiene las estadísticas del dashboard
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return of(this.getMockStats());
      })
    );
  }

  /**
   * Obtiene los datos de estado de reclamos
   */
  getClaimStatusData(): Observable<ClaimStatusData[]> {
    const claimsUrl = this.getClaimsUrl();
    if (!claimsUrl) {
      return this.useMockData ? of(this.getMockClaimStatusData()) : of([]);
    }

    return this.fetchAllClaims(claimsUrl).pipe(
      map((claims) => this.buildClaimStatusData(claims)),
      catchError(error => {
        console.error('Error al obtener estado de reclamos:', error);
        return this.useMockData ? of(this.getMockClaimStatusData()) : of([]);
      })
    );
  }

  /**
   * Obtiene los datos de prioridad de reclamos
   */
  getClaimPriorityData(): Observable<ClaimPriorityData> {
    const claimsUrl = this.getClaimsUrl();
    if (!claimsUrl) {
      return this.useMockData ? of(this.getMockClaimPriorityData()) : of({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      });
    }

    return this.fetchAllClaims(claimsUrl).pipe(
      map((claims) => this.buildClaimPriorityData(claims)),
      catchError(error => {
        console.error('Error al obtener prioridad de reclamos:', error);
        return this.useMockData ? of(this.getMockClaimPriorityData()) : of({
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        });
      })
    );
  }

  /**
   * Obtiene métricas principales del dashboard basadas en reclamos
   */
  getKpiMetrics(options?: { periodDays?: number; range?: KpiDateRange }): Observable<DashboardKpiMetrics> {
    const claimsUrl = this.getClaimsUrl();
    if (!claimsUrl) {
      return of(this.getEmptyKpiMetrics());
    }

    const periodDays = options?.periodDays ?? 7;
    const range = options?.range;

    return this.fetchAllClaims(claimsUrl).pipe(
      map((claims) => this.buildKpiMetrics(claims, periodDays, range)),
      catchError(error => {
        console.error('Error al obtener KPIs del dashboard:', error);
        return of(this.getEmptyKpiMetrics());
      })
    );
  }

  /**
   * Obtiene los reclamos recientes
   */
  getRecentClaims(limit: number = 10): Observable<RecentClaimRow[]> {
    const claimsUrl = this.getClaimsUrl();
    if (!claimsUrl) {
      return this.useMockData ? of(this.getMockRecentClaims()) : of([]);
    }

    return this.http.get<ClaimsResponse>(claimsUrl, { params: { page: '1', limit: String(limit) } }).pipe(
      map((response) => (response.data ?? []).map((claim) => this.mapRecentClaimRow(claim))),
      catchError(error => {
        console.error('Error al obtener reclamos recientes:', error);
        return this.useMockData ? of(this.getMockRecentClaims()) : of([]);
      })
    );
  }

  getClaimsPage(options: { page: number; limit: number; status?: string; search?: string }): Observable<ClaimsPageResult> {
    const claimsUrl = this.getClaimsUrl();
    if (!claimsUrl) {
      return of({ rows: [], pagination: { total: 0, page: 1, limit: options.limit, pages: 1 } });
    }

    const params: Record<string, string> = {
      page: String(options.page),
      limit: String(options.limit)
    };

    if (options.status && options.status !== 'all') {
      params['status'] = options.status;
    }

    if (options.search) {
      const trimmed = options.search.trim();
      if (trimmed) {
        params['q'] = trimmed;
      }
    }

    return this.http.get<ClaimsResponse>(claimsUrl, {
      params
    }).pipe(
      map((response) => ({
        rows: (response.data ?? []).map((claim) => this.mapRecentClaimRow(claim)),
        pagination: response.pagination
      })),
      catchError(error => {
        console.error('Error al obtener reclamos paginados:', error);
        return of({ rows: [], pagination: { total: 0, page: 1, limit: options.limit, pages: 1 } });
      })
    );
  }

  // Mock data methods for development
  private getMockStats(): DashboardStats {
    return {
      rucsRegistered: 39,
      rucsGrowth: 34.5,
      booksCreated: 66,
      booksGrowth: 112.0,
      totalClaims: 30,
      claimsGrowth: 71.0,
      solvedClaims: 25,
      solvedClaimsGrowth: -18.9
    };
  }

  private getMockClaimStatusData(): ClaimStatusData[] {
    return [
      { dateRange: 'Nov', resolved: 6, inProgress: 2, pending: 1, escalated: 1 },
      { dateRange: 'Dic', resolved: 12, inProgress: 4, pending: 3, escalated: 1 },
      { dateRange: 'Ene', resolved: 9, inProgress: 4, pending: 2, escalated: 1 },
      { dateRange: 'Feb', resolved: 7, inProgress: 3, pending: 2, escalated: 0 }
    ];
  }

  private getMockClaimPriorityData(): ClaimPriorityData {
    return {
      critical: 1,
      high: 2,
      medium: 3,
      low: 5
    };
  }

  private getMockRecentClaims(): RecentClaimRow[] {
    return [
      {
        id: 1,
        code: 'REC-001',
        client: 'LUCERO SARABIA',
        channel: 'Web',
        createdAt: new Date('2025-01-27T10:00:00.000Z'),
        status: 'resolved',
        slaState: 'ok',
        owner: 'Marina L.'
      },
      {
        id: 2,
        code: 'REC-002',
        client: 'Cliente 2',
        channel: 'Correo',
        createdAt: new Date('2025-01-26T10:00:00.000Z'),
        status: 'pending',
        slaState: 'ok',
        owner: 'Sin asignar'
      },
      {
        id: 3,
        code: 'REC-003',
        client: 'Cliente 3',
        channel: 'Presencial',
        createdAt: new Date('2025-01-25T10:00:00.000Z'),
        status: 'in-progress',
        slaState: 'late',
        owner: 'Luis P.'
      }
    ];
  }

  private getMockData(): DashboardData {
    return {
      stats: this.getMockStats(),
      claimStatusData: this.getMockClaimStatusData(),
      claimPriorityData: this.getMockClaimPriorityData(),
      recentClaims: this.getMockRecentClaims()
    };
  }

  private getEmptyKpiMetrics(): DashboardKpiMetrics {
    return {
      totalClaims: 0,
      pendingClaims: 0,
      avgResolutionDays: null,
      resolutionRate: 0,
      totalChangePct: null,
      pendingChangePct: null,
      avgResolutionChangeDays: null,
      resolutionRateChangePct: null
    };
  }

  private getClaimsUrl(): string | null {
    const tenantSlug = this.auth.getTenantSlug();
    if (!tenantSlug) {
      return null;
    }
    return `${environment.API_URL}/api/tenants/${tenantSlug}/claims`;
  }

  private fetchAllClaims(claimsUrl: string, limit = 100, maxPages = 5): Observable<ClaimRecord[]> {
    return this.http.get<ClaimsResponse>(claimsUrl, { params: { page: '1', limit: String(limit) } }).pipe(
      expand((response) => {
        const nextPage = response.pagination.page + 1;
        if (nextPage > response.pagination.pages || nextPage > maxPages) {
          return EMPTY;
        }
        return this.http.get<ClaimsResponse>(claimsUrl, { params: { page: String(nextPage), limit: String(limit) } });
      }),
      map((response) => response.data || []),
      reduce((all, pageData) => all.concat(pageData), [] as ClaimRecord[])
    );
  }

  private buildClaimStatusData(claims: ClaimRecord[], months = 6): ClaimStatusData[] {
    const now = new Date();
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const results: ClaimStatusData[] = [];

    for (let i = 0; i < months; i += 1) {
      const rangeStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const rangeEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0, 23, 59, 59, 999);

      const bucketClaims = claims.filter((claim) => {
        const created = new Date(claim.creation_date);
        return created >= rangeStart && created <= rangeEnd;
      });

      const counts: Record<'resolved' | 'inProgress' | 'pending' | 'escalated', number> = {
        resolved: 0,
        inProgress: 0,
        pending: 0,
        escalated: 0
      };

      for (const claim of bucketClaims) {
        const status = this.classifyClaimStatus(claim, now);
        counts[status] += 1;
      }

      results.push({
        dateRange: monthLabels[rangeStart.getMonth()],
        resolved: counts.resolved,
        inProgress: counts.inProgress,
        pending: counts.pending,
        escalated: counts.escalated
      });
    }

    return results;
  }

  private buildClaimPriorityData(claims: ClaimRecord[]): ClaimPriorityData {
    const now = new Date();
    const result = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const claim of claims) {
      if (claim.resolved) {
        continue;
      }

      const remainingDays = this.getRemainingResolutionDays(claim, now);
      if (remainingDays <= 2) {
        result.critical += 1;
      } else if (remainingDays <= 5) {
        result.high += 1;
      } else if (remainingDays <= 10) {
        result.medium += 1;
      } else {
        result.low += 1;
      }
    }

    return result;
  }

  private buildKpiMetrics(claims: ClaimRecord[], periodDays: number, range?: KpiDateRange): DashboardKpiMetrics {
    const now = new Date();
    const resolvedRange = this.resolvePeriodRange(now, periodDays, range);
    const currentStart = resolvedRange.currentStart;
    const currentEnd = resolvedRange.currentEnd;
    const previousStart = resolvedRange.previousStart;
    const previousEnd = resolvedRange.previousEnd;

    const currentClaims = this.filterClaimsByDate(claims, currentStart, currentEnd, 'creation_date');
    const previousClaims = this.filterClaimsByDate(claims, previousStart, previousEnd, 'creation_date');

    const totalClaims = claims.length;
    const previousTotal = previousClaims.length;
    const currentTotal = currentClaims.length;

    const pendingClaims = claims.filter((claim) => this.classifyClaimStatus(claim, now) === 'pending').length;
    const previousPending = previousClaims.filter((claim) => this.classifyClaimStatus(claim, now) === 'pending').length;
    const currentPending = currentClaims.filter((claim) => this.classifyClaimStatus(claim, now) === 'pending').length;

    const resolvedClaims = claims.filter((claim) => !!claim.resolved).length;
    const currentResolved = currentClaims.filter((claim) => !!claim.resolved).length;
    const previousResolved = previousClaims.filter((claim) => !!claim.resolved).length;

    const resolutionRate = totalClaims ? (resolvedClaims / totalClaims) * 100 : 0;
    const currentResolutionRate = currentTotal ? (currentResolved / currentTotal) * 100 : 0;
    const previousResolutionRate = previousTotal ? (previousResolved / previousTotal) * 100 : 0;

    const avgResolutionDays = this.calculateAverageResolutionDays(
      claims.filter((claim) => !!claim.resolved)
    );
    const currentAvgResolution = this.calculateAverageResolutionDays(
      this.filterClaimsByDate(claims, currentStart, currentEnd, 'update_date')
        .filter((claim) => !!claim.resolved)
    );
    const previousAvgResolution = this.calculateAverageResolutionDays(
      this.filterClaimsByDate(claims, previousStart, previousEnd, 'update_date')
        .filter((claim) => !!claim.resolved)
    );

    return {
      totalClaims,
      pendingClaims,
      avgResolutionDays,
      resolutionRate,
      totalChangePct: this.calculatePercentChange(currentTotal, previousTotal),
      pendingChangePct: this.calculatePercentChange(currentPending, previousPending),
      avgResolutionChangeDays: this.calculateDelta(currentAvgResolution, previousAvgResolution),
      resolutionRateChangePct: this.calculateDelta(currentResolutionRate, previousResolutionRate)
    };
  }

  private classifyClaimStatus(claim: ClaimRecord, now: Date): 'resolved' | 'inProgress' | 'pending' | 'escalated' {
    if (claim.resolved) {
      return 'resolved';
    }
    const remainingDays = this.getRemainingResolutionDays(claim, now, this.slaDays);
    if (remainingDays <= this.slaWarningDays) {
      return 'escalated';
    }
    return claim.assigned_user ? 'inProgress' : 'pending';
  }

  private getAgeDays(claim: ClaimRecord, now: Date): number {
    const created = new Date(claim.creation_date);
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private getRemainingResolutionDays(claim: ClaimRecord, now: Date, slaDays = 15): number {
    const ageDays = this.getAgeDays(claim, now);
    return Math.max(slaDays - ageDays, 0);
  }

  private calculateAverageResolutionDays(claims: ClaimRecord[]): number | null {
    const durations = claims
      .map((claim) => {
        const created = this.parseDate(claim.creation_date);
        const resolved = this.parseDate(claim.update_date);
        if (!created || !resolved) {
          return null;
        }
        const diffMs = resolved.getTime() - created.getTime();
        return diffMs / (1000 * 60 * 60 * 24);
      })
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

    if (!durations.length) {
      return null;
    }
    const total = durations.reduce((sum, value) => sum + value, 0);
    return total / durations.length;
  }

  private calculatePercentChange(current: number, previous: number): number | null {
    if (previous === 0) {
      return current === 0 ? 0 : null;
    }
    return ((current - previous) / previous) * 100;
  }

  private calculateDelta(current: number | null, previous: number | null): number | null {
    if (current === null || previous === null) {
      return null;
    }
    return current - previous;
  }

  private filterClaimsByDate(
    claims: ClaimRecord[],
    start: Date,
    end: Date,
    field: 'creation_date' | 'update_date'
  ): ClaimRecord[] {
    return claims.filter((claim) => {
      const date = this.parseDate(claim[field]);
      if (!date) {
        return false;
      }
      return date >= start && date <= end;
    });
  }

  private parseDate(value?: string): Date | null {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private addDays(date: Date, amount: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + amount);
    return copy;
  }

  private resolvePeriodRange(
    now: Date,
    periodDays: number,
    range?: KpiDateRange
  ): { currentStart: Date; currentEnd: Date; previousStart: Date; previousEnd: Date } {
    if (range?.start && range?.end && range.start <= range.end) {
      const currentStart = this.toStartOfDay(range.start);
      const currentEnd = this.toEndOfDay(range.end);
      const lengthDays = Math.max(this.getRangeLengthDays(currentStart, currentEnd), 1);
      const previousEnd = this.toEndOfDay(this.addDays(currentStart, -1));
      const previousStart = this.toStartOfDay(this.addDays(previousEnd, -(lengthDays - 1)));
      return { currentStart, currentEnd, previousStart, previousEnd };
    }

    const safePeriodDays = Math.max(periodDays, 1);
    const currentEnd = this.toEndOfDay(now);
    const currentStart = this.toStartOfDay(this.addDays(currentEnd, -(safePeriodDays - 1)));
    const previousEnd = this.toEndOfDay(this.addDays(currentStart, -1));
    const previousStart = this.toStartOfDay(this.addDays(previousEnd, -(safePeriodDays - 1)));
    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  private getRangeLengthDays(start: Date, end: Date): number {
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  private toStartOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private toEndOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private formatDateRange(start: Date, end: Date): string {
    const startLabel = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const endLabel = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    return `${startLabel} - ${endLabel}`;
  }

  private mapRecentClaimRow(claim: ClaimRecord): RecentClaimRow {
    const now = new Date();
    return {
      id: claim.id,
      code: claim.code ?? String(claim.id),
      client: this.resolveClientName(claim),
      channel: claim.ConsumptionType?.name ?? claim.ClaimType?.name ?? '—',
      createdAt: this.parseDate(claim.creation_date) ?? now,
      status: this.normalizeStatus(this.classifyClaimStatus(claim, now)),
      slaState: this.resolveSlaState(claim, now),
      owner: this.resolveOwnerName(claim)
    };
  }

  private resolveClientName(claim: ClaimRecord): string {
    const firstName = claim.Customer?.first_name ?? '';
    const lastName = claim.Customer?.last_name ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || claim.Customer?.document_number || 'Cliente';
  }

  private resolveOwnerName(claim: ClaimRecord): string {
    if (!claim.assigned_user) {
      return 'Sin asignar';
    }
    return `Usuario ${claim.assigned_user}`;
  }

  private resolveSlaState(claim: ClaimRecord, now: Date): 'ok' | 'late' {
    if (claim.resolved) {
      return 'ok';
    }
    const remainingDays = this.getRemainingResolutionDays(claim, now);
    return remainingDays === 0 ? 'late' : 'ok';
  }

  private normalizeStatus(status: 'resolved' | 'inProgress' | 'pending' | 'escalated'): RecentClaimRow['status'] {
    if (status === 'inProgress') {
      return 'in-progress';
    }
    return status;
  }
}
