import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiDateRange } from '../../../../core/services/dashboard.service';

type CalendarDay = {
  key: string;
  date: Date;
  label: number;
  inMonth: boolean;
  isToday: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  isFuture: boolean;
};

type CalendarMonth = {
  key: string;
  label: string;
  days: CalendarDay[];
};

type RangePreset = {
  key: string;
  label: string;
  type: 'days' | 'month';
  days?: number;
};

@Component({
  selector: 'app-custom-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-date-range-picker.html',
  styleUrl: './custom-date-range-picker.css'
})
export class CustomDateRangePicker {
  readonly maxDays = input(365);
  readonly range = input<KpiDateRange | null>(null);
  readonly rangeApplied = output<KpiDateRange>();

  private readonly weekdayLabels = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

  readonly errorMessage = signal<string | null>(null);
  readonly calendarBase = signal(this.getStartOfMonth(new Date()));
  readonly pickingEnd = signal(false);
  readonly internalStart = signal<Date | null>(null);
  readonly internalEnd = signal<Date | null>(null);
  readonly activePresetKey = signal<string | null>(null);

  readonly selectedStart = computed(() => this.internalStart());
  readonly selectedEnd = computed(() => this.internalEnd());
  readonly calendarMonths = computed(() => {
    const base = this.calendarBase();
    return [this.buildCalendarMonth(base), this.buildCalendarMonth(this.addMonths(base, 1))];
  });

  readonly calendarLabel = computed(() => {
    const base = this.calendarBase();
    const next = this.addMonths(base, 1);
    return `${this.formatMonthYear(base)} - ${this.formatMonthYear(next)}`;
  });

  readonly rangeLabel = computed(() => {
    const start = this.internalStart();
    const end = this.internalEnd();
    if (!start || !end) {
      return 'Selecciona un rango.';
    }
    return `${this.formatShortDate(start)} - ${this.formatShortDate(end)}`;
  });

  readonly rangeDaysLabel = computed(() => {
    const start = this.internalStart();
    const end = this.internalEnd();
    if (!start || !end) {
      return '';
    }
    const days = this.getRangeLengthDays(start, end);
    return `${days} dias`;
  });

  readonly helperLabel = computed(() => {
    if (this.pickingEnd()) {
      return 'Selecciona la fecha de fin.';
    }
    return 'Selecciona inicio y fin.';
  });

  readonly presets: RangePreset[] = [
    { key: '7d', label: 'Ultimos 7 dias', type: 'days', days: 7 },
    { key: '30d', label: 'Ultimos 30 dias', type: 'days', days: 30 },
    { key: '90d', label: 'Ultimos 90 dias', type: 'days', days: 90 },
    { key: 'month', label: 'Este mes', type: 'month' }
  ];

  constructor() {
    effect(() => {
      const incoming = this.range();
      if (incoming) {
        this.internalStart.set(incoming.start);
        this.internalEnd.set(incoming.end);
        this.calendarBase.set(this.getStartOfMonth(incoming.start));
        this.errorMessage.set(null);
        this.pickingEnd.set(false);
        this.activePresetKey.set(null);
      }
    });
  }

  calendarWeekdays(): string[] {
    return this.weekdayLabels;
  }

  selectCalendarDay(date: Date): void {
    if (this.isFutureDate(date)) {
      return;
    }
    this.activePresetKey.set(null);
    const start = this.internalStart();
    const end = this.internalEnd();

    if (!start || !end || this.pickingEnd()) {
      if (!start || !this.pickingEnd()) {
        this.internalStart.set(date);
        this.internalEnd.set(date);
        this.errorMessage.set(null);
        this.pickingEnd.set(true);
        return;
      }

      let nextStart = start;
      let nextEnd = date;
      if (date < start) {
        nextStart = date;
        nextEnd = start;
      }

      const rangeDays = this.getRangeLengthDays(nextStart, nextEnd);
      if (rangeDays > this.maxDays()) {
        this.errorMessage.set(`El rango no puede superar ${this.maxDays()} dias.`);
        this.pickingEnd.set(true);
        return;
      }

      this.errorMessage.set(null);
      this.internalStart.set(nextStart);
      this.internalEnd.set(nextEnd);
      this.pickingEnd.set(false);
      this.rangeApplied.emit({ start: nextStart, end: nextEnd });
      return;
    }

    this.internalStart.set(date);
    this.internalEnd.set(date);
    this.errorMessage.set(null);
    this.pickingEnd.set(true);
  }

  shiftCalendar(offset: number): void {
    this.calendarBase.set(this.addMonths(this.calendarBase(), offset));
  }

  applyPreset(preset: RangePreset): void {
    const end = new Date();
    let start = new Date(end);

    if (preset.type === 'month') {
      start = this.getStartOfMonth(end);
    } else if (preset.days) {
      start.setDate(end.getDate() - (preset.days - 1));
    }

    this.activePresetKey.set(preset.key);
    this.applyRange(start, end);
  }

  isPresetActive(preset: RangePreset): boolean {
    return this.activePresetKey() === preset.key;
  }

  resetRange(): void {
    this.activePresetKey.set(null);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    this.applyRange(start, end);
  }

  private applyRange(start: Date, end: Date): void {
    const rangeDays = this.getRangeLengthDays(start, end);
    if (rangeDays > this.maxDays()) {
      this.errorMessage.set(`El rango no puede superar ${this.maxDays()} dias.`);
      return;
    }
    this.internalStart.set(start);
    this.internalEnd.set(end);
    this.errorMessage.set(null);
    this.pickingEnd.set(false);
    this.calendarBase.set(this.getStartOfMonth(start));
    this.rangeApplied.emit({ start, end });
  }

  private buildCalendarMonth(base: Date): CalendarMonth {
    const monthStart = this.getStartOfMonth(base);
    const monthEnd = this.getEndOfMonth(base);
    const label = monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const startWeekDay = this.getWeekdayIndex(monthStart);
    const days: CalendarDay[] = [];

    const firstGridDay = this.addDays(monthStart, -startWeekDay);
    const totalCells = 42;
    const today = this.getStartOfDay(new Date());
    const selectedStart = this.internalStart();
    const selectedEnd = this.internalEnd();

    for (let i = 0; i < totalCells; i += 1) {
      const date = this.addDays(firstGridDay, i);
      const inMonth = date >= monthStart && date <= monthEnd;
      const isToday = this.isSameDay(date, today);
      const isStart = selectedStart ? this.isSameDay(date, selectedStart) : false;
      const isEnd = selectedEnd ? this.isSameDay(date, selectedEnd) : false;
      const isInRange = this.isDateInRange(date, selectedStart, selectedEnd);
      const isFuture = this.isFutureDate(date);
      days.push({
        key: `${date.toISOString()}-${inMonth ? 'in' : 'out'}`,
        date,
        label: date.getDate(),
        inMonth,
        isToday,
        isStart,
        isEnd,
        isInRange,
        isFuture
      });
    }

    return {
      key: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`,
      label,
      days
    };
  }

  private isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
    if (!start || !end) {
      return false;
    }
    const day = this.getStartOfDay(date).getTime();
    const startDay = this.getStartOfDay(start).getTime();
    const endDay = this.getStartOfDay(end).getTime();
    return day >= startDay && day <= endDay;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private getRangeLengthDays(start: Date, end: Date): number {
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  private addMonths(date: Date, amount: number): Date {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + amount, 1);
    return this.getStartOfMonth(copy);
  }

  private addDays(date: Date, amount: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + amount);
    return copy;
  }

  private getStartOfMonth(date: Date): Date {
    const copy = new Date(date);
    copy.setDate(1);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private getEndOfMonth(date: Date): Date {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + 1, 0);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private getWeekdayIndex(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  private getStartOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private formatShortDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private formatMonthYear(date: Date): string {
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  }

  private isFutureDate(date: Date): boolean {
    const today = this.getStartOfDay(new Date()).getTime();
    return this.getStartOfDay(date).getTime() > today;
  }
}
