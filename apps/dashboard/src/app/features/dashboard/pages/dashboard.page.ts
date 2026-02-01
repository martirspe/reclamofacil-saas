import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DashboardService, DashboardStats, ClaimStatusData, ClaimPriorityData, RecentClaim } from '../../../core/services/dashboard.service';
import { GreetingService } from '../../../shared/services/greeting.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { StatCardComponent, type StatCard } from '../components/stat-card.component';
import { ChartCardComponent } from '../components/chart-card.component';
import { TableCardComponent, type TableColumn } from '../components/table-card.component';
import { BarChartComponent, type BarChartData } from '../components/bar-chart.component';
import { DoughnutChartComponent, type PieChartData } from '../components/doughnut-chart.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    StatCardComponent,
    ChartCardComponent,
    TableCardComponent,
    BarChartComponent,
    DoughnutChartComponent
  ],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <div class="dashboard__header">
        <div class="dashboard__header-content">
          <h1 class="dashboard__title">{{ greeting.greeting() }}, {{ greeting.userName() }}</h1>
        </div>
        <div class="dashboard__date-selector">
          <button class="date-btn" [class.active]="!selectedDateRange()" (click)="selectDateRange(null)">
            Hoy
          </button>
          <button class="date-btn" [class.active]="selectedDateRange() === 'week'" (click)="selectDateRange('week')">
            Esta semana
          </button>
          <button class="date-btn" [class.active]="selectedDateRange() === 'month'" (click)="selectDateRange('month')">
            Este mes
          </button>
          <span class="date-range">01 01. 2025 - 01 Feb. 2025</span>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="dashboard__stats">
        @for (stat of statsCards(); track stat.title) {
          <app-stat-card [stat]="stat" />
        }
      </div>

      <!-- Charts Section -->
      <div class="dashboard__charts">
        <!-- Claim Status Chart -->
        <app-chart-card title="Estado de reclamos" class="dashboard__chart">
          <app-bar-chart [data]="barChartData()" />
        </app-chart-card>

        <!-- Claim Priority Chart -->
        <app-chart-card title="Prioridad de reclamos" class="dashboard__chart">
          <app-doughnut-chart 
            [data]="priorityChartData()" 
            [centerValue]="priorityTotal()"
            centerLabel="prioridades"
          />
        </app-chart-card>
      </div>

      <!-- Recent Claims Table -->
      <div class="dashboard__table">
        <app-table-card 
          title="Reclamos recientes"
          [columns]="tableColumns"
          [rows]="recentClaims()"
        />
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 40px;
      background: radial-gradient(ellipse at top left, rgba(25, 25, 40, 0.5) 0%, transparent 50%),
                  radial-gradient(ellipse at bottom right, rgba(30, 20, 40, 0.4) 0%, transparent 50%),
                  linear-gradient(135deg, #0f0f18 0%, #0a0a0f 100%);
      min-height: 100vh;
      position: relative;
    }

    .dashboard::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.3), transparent);
      pointer-events: none;
    }

    .dashboard__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
      gap: 32px;
      flex-wrap: wrap;
    }

    .dashboard__header-content {
      flex: 1;
      min-width: 240px;
    }

    .dashboard__title {
      font-size: 36px;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 12px 0;
      letter-spacing: -0.8px;
      line-height: 1.1;
    }

    .dashboard__date-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      padding: 6px;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(20px);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 
                  inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .date-btn {
      padding: 10px 18px;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.5);
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.2px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.8);
      }

      &.active {
        background: rgba(249, 115, 22, 0.15);
        color: #fb923c;
        box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.3),
                    inset 0 1px 0 rgba(249, 115, 22, 0.2);
      }
    }

    .date-range {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.4px;
      padding: 10px 14px;
      font-variant-numeric: tabular-nums;
      font-weight: 500;
    }

    .dashboard__stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .dashboard__charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .dashboard__chart {
      width: 100%;
    }

    .dashboard__table {
      width: 100%;
    }

    @media (max-width: 1200px) {
      .dashboard__charts {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 1024px) {
      .dashboard {
        padding: 32px;
      }

      .dashboard__header {
        flex-direction: column;
        align-items: stretch;
        margin-bottom: 32px;
        gap: 24px;
      }

      .dashboard__date-selector {
        width: 100%;
        justify-content: flex-start;
      }

      .dashboard__stats {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }

      .dashboard__charts {
        gap: 16px;
        margin-bottom: 32px;
      }
    }

    @media (max-width: 768px) {
      .dashboard {
        padding: 24px;
      }

      .dashboard__title {
        font-size: 28px;
      }

      .dashboard__stats {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 24px;
      }

      .dashboard__charts {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 24px;
      }

      .dashboard__date-selector {
        padding: 6px;
        gap: 4px;
      }

      .date-btn {
        padding: 8px 14px;
        font-size: 12px;
      }

      .date-range {
        font-size: 12px;
        padding: 8px 10px;
      }
    }
  `],
  providers: [DashboardService]
})
export class DashboardPage implements OnInit {
  // Services
  private readonly dashboardService = inject(DashboardService);
  private readonly toastService = inject(ToastService);
  readonly greeting = inject(GreetingService);

  // Signals
  private stats = signal<DashboardStats | null>(null);
  private claimStatusData = signal<ClaimStatusData[]>([]);
  private claimPriorityData = signal<ClaimPriorityData | null>(null);
  private recentClaimsData = signal<RecentClaim[]>([]);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  selectedDateRange = signal<string | null>(null);

  // Computed signals
  userName = computed(() => this.greeting.userName());

  statsCards = computed(() => {
    const stat = this.stats();
    if (!stat) return [];

    return [
      {
        title: 'RUCs registrados',
        value: stat.rucsRegistered,
        icon: 'assignment',
        change: stat.rucsGrowth,
        isPositive: stat.rucsGrowth > 0
      },
      {
        title: 'Libros creados',
        value: stat.booksCreated,
        icon: 'menu_book',
        change: stat.booksGrowth,
        isPositive: stat.booksGrowth > 0
      },
      {
        title: 'Total de reclamos',
        value: stat.totalClaims,
        icon: 'description',
        change: stat.claimsGrowth,
        isPositive: stat.claimsGrowth > 0
      },
      {
        title: 'Reclamos resueltos',
        value: stat.solvedClaims,
        icon: 'check_circle',
        change: stat.solvedClaimsGrowth,
        isPositive: stat.solvedClaimsGrowth > 0
      }
    ] as StatCard[];
  });

  barChartData = computed(() => {
    return this.claimStatusData().map(item => ({
      label: item.dateRange,
      resolved: item.resolved,
      pending: item.pending
    })) as BarChartData[];
  });

  priorityChartData = computed(() => {
    const data = this.claimPriorityData();
    if (!data) return [];

    return [
      { label: 'Crítica', value: data.critical, color: '#ef4444' },
      { label: 'Alta', value: data.high, color: '#f59e0b' },
      { label: 'Normal', value: data.normal, color: '#3b82f6' }
    ] as PieChartData[];
  });

  priorityTotal = computed(() => {
    const data = this.claimPriorityData();
    if (!data) return 0;
    return data.critical + data.high + data.normal;
  });

  recentClaims = computed(() => this.recentClaimsData());

  tableColumns: TableColumn[] = [
    { key: 'code', label: 'Código' },
    { key: 'client', label: 'Cliente' },
    { key: 'book', label: 'Libro' },
    { key: 'date', label: 'Fecha' },
    { key: 'status', label: 'Estado' },
    { key: 'actions', label: 'Acciones' }
  ];

  constructor() {
    // Effect para monitorear cambios en loading
    effect(() => {
      if (this.loading()) {
        console.log('Cargando datos del dashboard...');
      }
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Carga todos los datos del dashboard
   */
  private loadDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.claimStatusData.set(data.claimStatusData);
        this.claimPriorityData.set(data.claimPriorityData);
        this.recentClaimsData.set(data.recentClaims);
        this.loading.set(false);
        this.toastService.showSuccess('Dashboard cargado exitosamente');
      },
      error: (error) => {
        console.error('Error al cargar dashboard:', error);
        this.error.set('Error al cargar los datos del dashboard');
        this.loading.set(false);
        this.toastService.showError('Error al cargar el dashboard. Mostrando datos de demostración.');
      }
    });
  }

  /**
   * Selecciona el rango de fecha y recarga los datos
   */
  selectDateRange(range: string | null): void {
    this.selectedDateRange.set(range);
    // Aquí se podría implementar la lógica para filtrar datos por fecha
    // Por ahora solo actualizamos la selección visual
  }
}
