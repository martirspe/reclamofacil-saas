import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attachments-uploader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-white border border-gray-200 rounded-xl p-8 shadow-sm" aria-labelledby="attachments-heading">
      <h2 id="attachments-heading" class="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
        <span class="material-icons-outlined text-2xl">attach_file</span>
        Archivos adjuntos
        <span class="text-sm font-normal text-gray-500">(opcional)</span>
      </h2>

      <div class="space-y-4">
        <label [for]="inputId"
          class="block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-10 text-center transition-colors duration-200 ease-in-out hover:border-gray-400 hover:bg-gray-50"
          (dragover)="$event.preventDefault()" (drop)="fileDropped.emit($event)">
          <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-xl bg-gray-100">
            <span class="material-icons-outlined text-5xl text-gray-400">cloud_upload</span>
          </div>
          <p class="text-base font-semibold text-gray-900 mb-1">Arrastra archivos aquí o haz clic para seleccionar</p>
          <p class="text-sm text-gray-500">PDF, DOC, DOCX - Máximo {{ maxFiles }} archivos, 150KB cada uno</p>
        </label>
        <input [id]="inputId" name="attachments" type="file" multiple accept=".pdf,.doc,.docx"
          (change)="fileSelected.emit($event)" class="hidden" aria-label="Seleccionar archivos adjuntos" />

        @if (files.length > 0) {
        <div class="space-y-3 bg-gray-50 border border-gray-300 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-gray-900">Archivos seleccionados ({{ files.length }}/{{ maxFiles }})</p>
            <button type="button" (click)="removeAll.emit()"
              class="text-sm text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
              aria-label="Eliminar todos los archivos">
              Eliminar todos
            </button>
          </div>
          <ul class="space-y-2" role="list">
            @for (file of files; track $index; let idx = $index) {
            <li class="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
              <div class="flex items-center gap-3 min-w-0">
                <span class="material-icons-outlined text-xl text-gray-700 shrink-0">insert_drive_file</span>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
                  <p class="text-xs text-gray-500">{{ (file.size / 1024).toFixed(0) }} KB</p>
                </div>
              </div>
              <button type="button" (click)="remove.emit(idx)"
                class="text-gray-400 hover:text-red-600 transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Eliminar archivo">
                <span class="material-icons-outlined text-xl">close</span>
              </button>
            </li>
            }
          </ul>
        </div>
        }
      </div>
    </section>
  `
})
export class AttachmentsUploaderComponent {
  @Input() files: File[] = [];
  @Input() maxFiles = 5;
  @Input() inputId = 'file-input';

  @Output() fileSelected = new EventEmitter<Event>();
  @Output() fileDropped = new EventEmitter<DragEvent>();
  @Output() remove = new EventEmitter<number>();
  @Output() removeAll = new EventEmitter<void>();
}
