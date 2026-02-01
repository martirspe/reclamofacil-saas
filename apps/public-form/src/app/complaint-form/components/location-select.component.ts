import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '../../interfaces/location.interface';

@Component({
  selector: 'app-location-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-dropdown="location">
      <label class="block text-sm font-semibold text-gray-700 mb-2" for="district">Distrito / Provincia /
        Departamento</label>
      <div class="relative">
        <input id="district" name="district" readonly [value]="displayValue"
          placeholder="Ej: MIRAFLORES / LIMA / LIMA" (focus)="open.emit()"
          (click)="open.emit()" [class.border-red-500]="isInvalid"
          [class.ring-red-500/20]="isInvalid" [attr.aria-invalid]="isInvalid"
          class="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-700 transition-all placeholder:text-gray-400 hover:border-gray-300 appearance-none bg-no-repeat bg-size-[20px] bg-position-[right_0.75rem_center]"
          style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%239CA3AF%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E'); background-position: right 0.75rem center; background-repeat: no-repeat; background-size: 1.25rem;"
          type="text" />

        @if (isOpen) {
        <div
          class="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div class="px-3 py-2 bg-white border-b border-gray-200 flex items-center gap-2">
            <span class="material-icons-outlined text-xl text-gray-500">search</span>
            <input id="locationSearch" name="locationSearch" type="text" [value]="searchTerm"
              (input)="search.emit($any($event.target).value)" placeholder="Buscar distrito..."
              class="flex-1 border-0 bg-transparent px-2 py-2 text-sm text-gray-800 placeholder:text-gray-400" />
            @if (searchTerm) {
            <button type="button" (click)="clearSearch.emit()"
              class="text-gray-400 hover:text-gray-600 shrink-0">
              <span class="material-icons-outlined text-lg">close</span>
            </button>
            }
          </div>

          <div class="max-h-72 overflow-y-auto">
            @if (loading) {
            <div class="px-4 py-2 text-sm text-gray-500">Buscando ubicaciones...</div>
            }
            @if (!loading && results.length === 0 && searchTerm.length > 0) {
            <div class="px-4 py-2 text-sm text-gray-500">Sin resultados</div>
            }
            @if (results.length > 0) {
            @for (item of results; track item.id) {
            <button type="button" (click)="select.emit(item)"
              class="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              [class.bg-blue-50]="selectedDisplay === (item.district + ' / ' + item.province + ' / ' + item.department)">
              <div>
                <div class="text-sm font-semibold text-gray-900 uppercase tracking-tight"
                  [class.text-blue-600]="selectedDisplay === (item.district + ' / ' + item.province + ' / ' + item.department)">
                  {{item.district}}</div>
                <div class="text-xs text-gray-500 uppercase"
                  [class.text-blue-500]="selectedDisplay === (item.district + ' / ' + item.province + ' / ' + item.department)">
                  {{item.province}} / {{item.department}}</div>
              </div>
              @if (selectedDisplay === (item.district + ' / ' + item.province + ' / ' + item.department)) {
              <span class="material-icons-outlined text-xl text-blue-600 shrink-0">check</span>
              }
            </button>
            }
            }
            @if (results.length === 0 && !loading && searchTerm.length === 0) {
            <div class="px-4 py-2 text-sm text-gray-500 text-center">Empieza a escribir para buscar</div>
            }
          </div>
        </div>
        }
      </div>
    </div>
  `
})
export class LocationSelectComponent {
  @Input() displayValue = '';
  @Input() selectedDisplay = '';
  @Input() isOpen = false;
  @Input() searchTerm = '';
  @Input() loading = false;
  @Input() results: Location[] = [];
  @Input() isInvalid = false;

  @Output() open = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<void>();
  @Output() select = new EventEmitter<Location>();
}
