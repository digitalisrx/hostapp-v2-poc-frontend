import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { LucidePillBottle } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { Medication, MedicationCode } from '../medication.model';

type ViewMode = 'list' | 'json';

@Component({
  selector: 'app-medication-detail-modal',
  imports: [Modal, LucidePillBottle],
  template: `
    <app-modal [open]="open()" title="Medicatie details" (close)="close.emit()">
      <svg modalIcon lucidePillBottle [size]="20"></svg>

      @if (medications().length) {
        <div class="mb-3 inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5 text-xs" role="tablist">
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="viewMode() === 'list'"
            class="rounded px-2.5 py-1 font-medium text-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [class.bg-white]="viewMode() === 'list'"
            [class.shadow-sm]="viewMode() === 'list'"
            [class.text-gray-900]="viewMode() === 'list'"
            (click)="viewMode.set('list')"
          >
            Lijst
          </button>
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="viewMode() === 'json'"
            class="rounded px-2.5 py-1 font-medium text-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [class.bg-white]="viewMode() === 'json'"
            [class.shadow-sm]="viewMode() === 'json'"
            [class.text-gray-900]="viewMode() === 'json'"
            (click)="viewMode.set('json')"
          >
            JSON
          </button>
        </div>

        @if (viewMode() === 'list') {
          <ul>
            @for (drug of medications(); track drug.id) {
              <li
                [id]="'medication-detail-' + drug.id"
                class="scroll-mt-2 rounded-l-sm border-l-4 border-l-gray-200 my-6 pl-3 first:mt-0 last:mb-0"
                [class.!border-l-blue-600]="drug.id === focusId()"
              >
                <div class="flex items-center gap-2">
                  <span class="min-w-0 truncate text-sm font-medium text-gray-900">{{ drug.description }}</span>
                  @if (drug.opium) {
                    <span class="shrink-0 rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">Opium</span>
                  }
                </div>

                @let code = drug.codes[0];
                <table class="mt-1.5 w-full border-collapse px-2 text-xs">
                  <tbody>
                    <tr class="border-t border-gray-100">
                      <th class="w-28 py-1 text-gray-400">ATC</th>
                      <td class="py-1 tabular-nums">{{ drug.atc || '—' }}</td>
                    </tr>
                    <tr class="border-t border-gray-100">
                      <th class="py-1 text-gray-400">Code</th>
                      <td class="py-1 tabular-nums">{{ code.type }}{{ code.value }}</td>
                    </tr>
                    <tr class="border-t border-gray-100">
                      <th class="py-1 text-gray-400">Duur</th>
                      <td class="py-1">{{ drug.duration }} dagen</td>
                    </tr>
                    <tr class="border-t border-gray-100">
                      <th class="py-1 text-gray-400">Hoeveelheid</th>
                      <td class="py-1">{{ code.quantity.value }} {{ code.quantity.unit }}</td>
                    </tr>
                    @if (directionsFor(code); as directions) {
                      <tr class="border-t border-gray-100">
                        <th class="py-1 align-top text-gray-400">Aanwijzing</th>
                        <td class="py-1">{{ directions }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </li>
            }
          </ul>
        } @else {
          <pre>{{ stringify(medications()) }}</pre>
        }
      } @else {
        <p class="px-1 py-4 text-center text-sm text-gray-500">Nog geen medicatie</p>
      }
    </app-modal>
  `,
})
export class MedicationDetailModal {
  private readonly document = inject(DOCUMENT);

  open = input.required<boolean>();
  medications = input.required<readonly Medication[]>();
  focusId = input<string | null>(null);
  close = output<void>();

  protected readonly viewMode = signal<ViewMode>('list');

  constructor() {
    effect(() => {
      const id = this.focusId();
      if (!this.open() || !id) {
        return;
      }
      queueMicrotask(() => {
        this.document.getElementById(`medication-detail-${id}`)?.scrollIntoView({ block: 'center' });
      });
    });
  }

  protected stringify(medications: readonly Medication[]): string {
    return JSON.stringify(medications, null, 2);
  }

  protected directionsFor(code: MedicationCode): string | null {
    const directions = code.directions;
    if (!directions) {
      return null;
    }
    return typeof directions === 'string' ? directions : directions.user;
  }
}
