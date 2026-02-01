import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  format?: (value: any) => string;
}

export interface TableRow {
  [key: string]: any;
}

@Component({
  selector: 'app-table-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-card">
      <div class="table-card__header">
        <h3 class="table-card__title">{{ title }}</h3>
        <button class="table-card__action" aria-label="Más opciones" *ngIf="showMoreButton">
          ⋮
        </button>
      </div>

      <div class="table-card__content">
        <table class="table">
          <thead class="table__head">
            <tr>
              @for (column of columns; track column.key) {
                <th class="table__cell table__cell--header">{{ column.label }}</th>
              }
            </tr>
          </thead>
          <tbody class="table__body">
            @for (row of rows; track row['id']; let last = $last) {
              <tr class="table__row" [class.table__row--last]="last">
                @for (column of columns; track column.key) {
                  <td class="table__cell">
                    @if (column.format) {
                      {{ column.format(row[column.key]) }}
                    } @else if (column.key === 'status') {
                      <span class="status-badge" [class]="'status-badge--' + row[column.key]">
                        {{ row[column.key] | titlecase }}
                      </span>
                    } @else {
                      {{ row[column.key] }}
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr class="table__row table__row--empty">
                <td class="table__cell" [attr.colspan]="columns.length">
                  No hay datos disponibles
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-card {
      background: rgba(20, 20, 28, 0.7);
      backdrop-filter: blur(20px);
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
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
        z-index: 1;
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

    .table-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 32px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .table-card__title {
      font-size: 15px;
      font-weight: 500;
      margin: 0;
      letter-spacing: 0.2px;
      color: rgba(255, 255, 255, 0.65);
    }

    .table-card__action {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      font-size: 18px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 10px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .table-card__content {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table__head {
      background: rgba(0, 0, 0, 0.25);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .table__cell {
      padding: 18px 32px;
      text-align: left;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.65);

      &--header {
        font-weight: 500;
        letter-spacing: 0.3px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
      }
    }

    .table__row {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      &--last {
        border-bottom: none;
      }

      &--empty .table__cell {
        padding: 32px 16px;
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.3px;

      &--resolved {
        background: rgba(52, 211, 153, 0.12);
        color: #34d399;
      }

      &--pending {
        background: rgba(251, 146, 60, 0.12);
        color: #fb923c;
      }

      &--in-progress {
        background: rgba(96, 165, 250, 0.12);
        color: #60a5fa;
      }
    }

    @media (max-width: 768px) {
      .table-card__header {
        padding: 20px;
      }

      .table__cell {
        padding: 12px 20px;
        font-size: 12px;
      }
    }
  `]
})
export class TableCardComponent {
  @Input() title: string = '';
  @Input() columns: TableColumn[] = [];
  @Input() rows: TableRow[] = [];
  @Input() showMoreButton: boolean = true;
}
