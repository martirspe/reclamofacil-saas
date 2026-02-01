import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhoneCountry } from '../../interfaces/phone-country.interface';

@Component({
  selector: 'app-phone-country-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" data-dropdown="phoneCountry">
      <div class="flex gap-3">
        <button type="button" (click)="toggle.emit()"
          [class.border-red-500]="isInvalid"
          [class.ring-red-500/20]="isInvalid"
          class="w-24 px-4 py-3 pr-10 border border-gray-300 rounded-lg text-gray-700 text-sm hover:border-gray-300 transition-all appearance-none bg-white bg-no-repeat bg-size-[20px] bg-position-[right_0.75rem_center] text-left"
          style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%239CA3AF%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E'); background-position: right 0.75rem center; background-repeat: no-repeat; background-size: 1.25rem;"
          [attr.aria-invalid]="isInvalid">
          {{ selectedCode }}
        </button>
        <ng-content select="input"></ng-content>
      </div>

      @if (isOpen) {
      <div class="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
        <div class="px-3 py-2 bg-white border-b border-gray-200">
          <div class="flex items-center gap-2">
            <span class="material-icons-outlined text-xl text-gray-500">search</span>
            <input id="phoneCountrySearch" name="phoneCountrySearch" type="text"
              [value]="searchTerm" (input)="search.emit($any($event.target).value)"
              placeholder="Buscar país..."
              class="flex-1 border-0 bg-transparent px-0 py-2 text-sm text-gray-700 placeholder:text-gray-400" />
            @if (searchTerm) {
            <button type="button" (click)="clearSearch.emit()"
              class="text-gray-400 hover:text-gray-600 shrink-0">
              <span class="material-icons-outlined text-lg">close</span>
            </button>
            }
          </div>
        </div>

        <div class="max-h-72 overflow-y-auto">
          @for (country of countries; track country.iso + country.code) {
          <button type="button" (click)="select.emit(country.code)"
            class="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            [class.bg-blue-50]="selectedCode === country.code">
            <div class="flex items-center gap-2 text-sm text-gray-900 uppercase tracking-tight"
              [class.text-blue-600]="selectedCode === country.code">
              <span class="w-8">{{country.iso}}</span>
              <span class="w-14">{{country.code}}</span>
              <span>{{country.name}}</span>
            </div>
            @if (selectedCode === country.code) {
            <span class="material-icons-outlined text-xl text-blue-600 shrink-0">check</span>
            }
          </button>
          } @empty {
          <div class="px-4 py-3 text-sm text-gray-500 text-center">No se encontraron países</div>
          }
        </div>
      </div>
      }
    </div>
  `
})
export class PhoneCountrySelectComponent {
  @Input() selectedCode = '';
  @Input() isOpen = false;
  @Input() searchTerm = '';
  @Input() countries: PhoneCountry[] = [];
  @Input() isInvalid = false;

  @Output() toggle = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() select = new EventEmitter<string>();
}
