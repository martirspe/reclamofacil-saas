import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  change: number;
  isPositive: boolean;
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <div class="stat-card__header">
        <h3 class="stat-card__title">{{ stat.title }}</h3>
        <span class="material-symbols-outlined stat-card__icon">{{ stat.icon }}</span>
      </div>
      
      <div class="stat-card__value">{{ stat.value }}</div>
      
      <div class="stat-card__footer">
        <span 
          class="stat-card__change"
          [class.stat-card__change--positive]="stat.isPositive"
          [class.stat-card__change--negative]="!stat.isPositive"
        >
          <span class="material-symbols-outlined stat-card__arrow">
            {{ stat.isPositive ? 'arrow_upward' : 'arrow_downward' }}
          </span>
          {{ stat.change | number: '1.1-1' }}%
        </span>
        <span class="stat-card__period">vs período anterior</span>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: rgba(20, 20, 28, 0.7);
      backdrop-filter: blur(20px);
      border-radius: 18px;
      padding: 28px;
      color: white;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.08);
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
        transform: translateY(-2px);
        border-color: rgba(255, 255, 255, 0.12);
        background: rgba(25, 25, 35, 0.8);
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), 
                    0 0 0 1px rgba(249, 115, 22, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }
    }

    .stat-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .stat-card__title {
      font-size: 13px;
      font-weight: 500;
      margin: 0;
      color: rgba(255, 255, 255, 0.55);
      letter-spacing: 0.3px;
      line-height: 1.5;
    }

    .stat-card__icon {
      font-size: 32px;
      opacity: 0.4;
      font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24;
      color: rgba(249, 115, 22, 0.6);
      filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.3));
    }

    .stat-card__value {
      font-size: 40px;
      font-weight: 600;
      margin-bottom: 24px;
      color: #ffffff;
      letter-spacing: -1px;
      line-height: 1;
    }

    .stat-card__footer {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }

    .stat-card__change {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 10px;

      &--positive {
        color: #34d399;
        background: rgba(52, 211, 153, 0.1);
        box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.2);
      }

      &--negative {
        color: #f87171;
        background: rgba(248, 113, 113, 0.1);
        box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.2);
      }
    }

    .stat-card__arrow {
      font-size: 16px;
      font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20;
    }

    .stat-card__period {
      color: rgba(255, 255, 255, 0.45);
      font-size: 12px;
    }

    @media (max-width: 768px) {
      .stat-card {
        padding: 24px;
      }

      .stat-card__value {
        font-size: 32px;
      }
    }
  `]
})
export class StatCardComponent {
  @Input() stat!: StatCard;
}
