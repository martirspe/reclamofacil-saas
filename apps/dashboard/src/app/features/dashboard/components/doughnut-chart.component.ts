import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PieChartData {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-doughnut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="doughnut-chart">
      <svg 
        class="doughnut-chart__svg" 
        viewBox="0 0 120 120" 
        [attr.width]="size" 
        [attr.height]="size"
      >
        @for (segment of segments; track segment.label; let i = $index) {
          <circle
            class="doughnut-chart__circle"
            cx="60"
            cy="60"
            r="45"
            [attr.stroke]="segment.color"
            [attr.stroke-dasharray]="segment.dashArray"
            [attr.stroke-dashoffset]="segment.dashOffset"
            [attr.style]="'transform: rotate(' + segment.rotation + 'deg); transform-origin: 60px 60px'"
          />
        }
        <circle
          class="doughnut-chart__center"
          cx="60"
          cy="60"
          r="30"
        />
      </svg>

      @if (centerValue !== null) {
        <div class="doughnut-chart__center-text">
          <span class="doughnut-chart__value">{{ centerValue }}</span>
          <span class="doughnut-chart__label">{{ centerLabel }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .doughnut-chart {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      height: 100%;
    }

    .doughnut-chart__svg {
      max-width: 100%;
      max-height: 100%;
      filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
    }

    .doughnut-chart__circle {
      fill: none;
      stroke-width: 12;
      stroke-linecap: round;
      transition: all 0.3s ease;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));

      &:hover {
        stroke-width: 14;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      }
    }

    .doughnut-chart__center {
      fill: #1f2937;
      transition: all 0.3s ease;
    }

    .doughnut-chart__center-text {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .doughnut-chart__value {
      font-size: 32px;
      font-weight: 700;
      color: white;
      line-height: 1;
    }

    .doughnut-chart__label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 4px;
      text-transform: lowercase;
    }

    @media (max-width: 768px) {
      .doughnut-chart__value {
        font-size: 24px;
      }

      .doughnut-chart__label {
        font-size: 10px;
      }
    }
  `]
})
export class DoughnutChartComponent {
  @Input() data: PieChartData[] = [];
  @Input() centerValue: number | null = null;
  @Input() centerLabel: string = '';
  @Input() size: number = 240;

  get segments(): Array<{
    label: string;
    color: string;
    dashArray: number;
    dashOffset: number;
    rotation: number;
  }> {
    const total = this.data.reduce((sum, item) => sum + item.value, 0);
    const circumference = 2 * Math.PI * 45; // radius = 45
    let rotation = -90;
    const segments: any[] = [];

    this.data.forEach(item => {
      const percentage = item.value / total;
      const dashArray = circumference * percentage;
      const dashOffset = -circumference * (1 - percentage) / 2;

      segments.push({
        label: item.label,
        color: item.color,
        dashArray: Math.round(dashArray * 100) / 100,
        dashOffset: Math.round(dashOffset * 100) / 100,
        rotation
      });

      rotation += (percentage * 360);
    });

    return segments;
  }
}
