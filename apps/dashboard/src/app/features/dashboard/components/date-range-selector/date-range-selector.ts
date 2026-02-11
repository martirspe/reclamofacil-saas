import { Component, computed, effect, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomDateRangePicker } from '../custom-date-range-picker/custom-date-range-picker';

type KpiDateRange = {
  start: Date;
  end: Date;
};

export type DateRangeSelection = {
  mode: 'today' | 'week' | 'month' | 'custom';
  label: string;
  query: { periodDays?: number; range?: KpiDateRange };
};

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [CommonModule, CustomDateRangePicker],
  templateUrl: './date-range-selector.html',
  styleUrl: './date-range-selector.css'
})
export class DateRangeSelector {
  readonly maxDays = input(365);
  readonly selectionChange = output<DateRangeSelection>();
  private readonly elementRef = inject(ElementRef);

  readonly selectedRange = signal<'today' | 'week' | 'month' | 'custom'>('month');
  readonly customRange = signal<KpiDateRange | null>(null);
  readonly customOpen = signal(false);

  readonly customRangeMeta = computed(() => {
    const range = this.customRange();
    return range ? this.formatRangeLabel(range) : '';
  });

  readonly periodDays = computed(() => {
    switch (this.selectedRange()) {
      case 'today':
        return 1;
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'custom':
      default:
        return 30;
    }
  });

  constructor() {
    effect(() => {
      if (this.selectedRange() === 'custom' && !this.customRange()) {
        this.customRange.set(this.buildDefaultCustomRange());
        return;
      }

      const selection = this.buildSelection();
      if (selection) {
        this.selectionChange.emit(selection);
      }
    });
  }

  setRange(range: 'today' | 'week' | 'month' | 'custom'): void {
    if (range === 'custom') {
      this.selectedRange.set('custom');
      this.customOpen.set(!this.customOpen());
      return;
    }

    this.selectedRange.set(range);
    this.customOpen.set(false);
  }

  onCustomRangeApplied(range: KpiDateRange): void {
    this.customRange.set(range);
    this.selectedRange.set('custom');
    this.customOpen.set(false);
  }

  showCustomPicker(): boolean {
    return this.selectedRange() === 'custom' && this.customOpen();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.customOpen()) {
      return;
    }
    const target = event.target as Node | null;
    if (target && this.elementRef.nativeElement.contains(target)) {
      return;
    }
    this.customOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.customOpen()) {
      return;
    }
    if (event.key === 'Escape') {
      this.customOpen.set(false);
    }
  }

  private buildSelection(): DateRangeSelection | null {
    const mode = this.selectedRange();
    if (mode === 'custom') {
      const range = this.customRange();
      if (!range) {
        return null;
      }
      return {
        mode,
        label: this.formatRangeLabel(range),
        query: { range }
      };
    }

    const label = mode === 'today'
      ? 'Hoy'
      : mode === 'week'
        ? 'Esta semana'
        : 'Este mes';

    return {
      mode,
      label,
      query: { periodDays: this.periodDays() }
    };
  }

  private buildDefaultCustomRange(): KpiDateRange {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return { start, end };
  }

  private formatRangeLabel(range: KpiDateRange): string {
    return `${this.formatShortDate(range.start)} - ${this.formatShortDate(range.end)}`;
  }

  private formatShortDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
