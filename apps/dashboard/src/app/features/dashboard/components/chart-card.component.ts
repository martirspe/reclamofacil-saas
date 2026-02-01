import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartData {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <h3 class="chart-card__title">{{ title }}</h3>
      <div class="chart-card__content">
        <div class="chart-card__chart">
          <ng-content></ng-content>
        </div>
      </div>
      @if (legend && legend.length > 0) {
        <div class="chart-card__legend">
          @for (item of legend; track item.label) {
            <div class="legend-item">
              <span class="legend-item__color" [style.background-color]="item.color"></span>
              <span class="legend-item__label">{{ item.label }}</span>
              <span class="legend-item__value">{{ item.value }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-card {
      background: rgba(20, 20, 28, 0.7);
      backdrop-filter: blur(20px);
      border-radius: 18px;
      padding: 32px;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 
                  inset 0 1px 0 rgba(255, 255, 255, 0.03);

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.3), transparent);
      }

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 18px;
        padding: 1px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent);
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }

      &:hover {
        border-color: rgba(255, 255, 255, 0.12);
        background: rgba(25, 25, 35, 0.8);
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), 
                    0 0 0 1px rgba(249, 115, 22, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }
    }

    .chart-card__title {
      font-size: 15px;
      font-weight: 500;
      margin: 0 0 28px 0;
      letter-spacing: 0.2px;
      color: rgba(255, 255, 255, 0.65);
    }

    .chart-card__content {
      margin-bottom: 24px;
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-card__chart {
      width: 100%;
      height: 100%;
    }

    .chart-card__legend {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }

    .legend-item__color {
      width: 12px;
      height: 12px;
      border-radius: 4px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px currentColor;
    }

    .legend-item__label {
      flex: 1;
      color: rgba(255, 255, 255, 0.5);
    }

    .legend-item__value {
      font-weight: 500;
      color: white;
      min-width: 30px;
      text-align: right;
    }

    @media (max-width: 768px) {
      .chart-card {
        padding: 16px;
      }

      .chart-card__content {
        min-height: 200px;
      }
    }
  `]
})
export class ChartCardComponent {
  @Input() title: string = '';
  @Input() legend?: ChartData[];
}
