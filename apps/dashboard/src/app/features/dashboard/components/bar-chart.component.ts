import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartData {
  label: string;
  resolved: number;
  pending: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bar-chart">
      @for (item of data; track item.label) {
        <div class="bar-chart__item">
          <div class="bar-chart__label">{{ item.label }}</div>
          <div class="bar-chart__bars">
            <div class="bar-chart__bar">
              <div 
                class="bar-chart__fill bar-chart__fill--resolved"
                [style.height.%]="getPercentage(item.resolved, maxValue)"
                [title]="'Resueltos: ' + item.resolved"
              ></div>
            </div>
            @if (item.pending > 0) {
              <div class="bar-chart__bar">
                <div 
                  class="bar-chart__fill bar-chart__fill--pending"
                  [style.height.%]="getPercentage(item.pending, maxValue)"
                  [title]="'Pendientes: ' + item.pending"
                ></div>
              </div>
            }
          </div>
          <div class="bar-chart__value">
            @if (item.pending > 0) {
              <span class="bar-chart__resolved">{{ item.resolved }}</span>
              <span class="bar-chart__pending">{{ item.pending }}</span>
            } @else {
              <span class="bar-chart__resolved">{{ item.resolved }}</span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      gap: 12px;
      height: 280px;
      padding: 16px 0;
    }

    .bar-chart__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      gap: 8px;
      min-width: 0;
    }

    .bar-chart__label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      order: 3;
      margin-top: 8px;
      min-height: 30px;
      display: flex;
      align-items: center;
      word-break: break-word;
    }

    .bar-chart__bars {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 180px;
      order: 2;
    }

    .bar-chart__bar {
      flex: 1;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px 4px 0 0;
      min-height: 8px;
      position: relative;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    }

    .bar-chart__fill {
      width: 100%;
      border-radius: 4px 4px 0 0;
      transition: all 0.3s ease;
      display: flex;
      align-items: flex-end;
      justify-content: center;

      &--resolved {
        background: linear-gradient(180deg, #10b981 0%, #059669 100%);

        &:hover {
          background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
      }

      &--pending {
        background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);

        &:hover {
          background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
      }
    }

    .bar-chart__value {
      font-size: 11px;
      font-weight: 600;
      order: 1;
      display: flex;
      gap: 4px;
      color: rgba(255, 255, 255, 0.7);
    }

    .bar-chart__resolved {
      color: #10b981;
    }

    .bar-chart__pending {
      color: #f59e0b;
    }

    @media (max-width: 768px) {
      .bar-chart {
        height: 220px;
      }

      .bar-chart__bars {
        height: 140px;
      }

      .bar-chart__label {
        font-size: 10px;
      }

      .bar-chart__value {
        font-size: 10px;
      }
    }
  `]
})
export class BarChartComponent {
  @Input() data: BarChartData[] = [];

  get maxValue(): number {
    if (!this.data || this.data.length === 0) return 0;
    return Math.max(
      ...this.data.map(item => Math.max(item.resolved, item.pending || 0))
    );
  }

  getPercentage(value: number, max: number): number {
    if (max === 0) return 0;
    return (value / max) * 100;
  }
}
