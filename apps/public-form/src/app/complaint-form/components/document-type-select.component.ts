import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentType } from '../../interfaces/document-type.interface';

@Component({
  selector: 'app-document-type-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" [attr.data-dropdown]="dropdownKey">
      <span class="block text-sm font-semibold text-gray-700 mb-2">{{ label }}</span>
      <button type="button" (click)="toggle.emit()"
        [class.border-red-500]="isInvalid"
        [class.ring-red-500/20]="isInvalid"
        class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-gray-700 text-sm hover:border-gray-300 transition-all appearance-none bg-white bg-no-repeat bg-size-[20px] bg-position-[right_0.75rem_center] text-left"
        style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%239CA3AF%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E'); background-position: right 0.75rem center; background-repeat: no-repeat; background-size: 1.25rem;"
        [attr.aria-invalid]="isInvalid"
        [attr.aria-describedby]="ariaDescribedby">
        {{ selectedName || placeholder }}
      </button>

      @if (isOpen) {
      <div class="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
        <div class="max-h-72 overflow-y-auto">
          @for (type of types; track type.id) {
          <button type="button" (click)="select.emit(type.id)"
            class="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm text-gray-700"
            [class.bg-blue-50]="selectedId === type.id">
            <span>{{type.name}}</span>
            @if (selectedId === type.id) {
            <span class="material-icons-outlined text-xl text-blue-600 shrink-0">check</span>
            }
          </button>
          }
        </div>
      </div>
      }
    </div>
  `
})
export class DocumentTypeSelectComponent {
  @Input() label = 'Tipo de Documento';
  @Input() placeholder = 'Seleccionar tipo de documento';
  @Input() dropdownKey = 'documentType';
  @Input() selectedId: number | string | null = null;
  @Input() selectedName = '';
  @Input() types: DocumentType[] = [];
  @Input() isOpen = false;
  @Input() isInvalid = false;
  @Input() ariaDescribedby: string | null = null;

  @Output() toggle = new EventEmitter<void>();
  @Output() select = new EventEmitter<number>();
}
