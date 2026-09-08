import { Component, inject, signal } from '@angular/core';
import { LucidePencil, LucidePlus, LucideX } from '@lucide/angular';
import { formatAmount } from '../../shared/format-amount';
import { LabCodeSearchService } from '../lab-code-search.service';
import { LabDataModal } from '../lab-data-modal/lab-data-modal';
import { LabDataStore } from '../lab-data.store';
import { LabDatum } from '../lab-datum.model';

@Component({
  selector: 'app-lab-data-field',
  imports: [LucidePencil, LucidePlus, LucideX, LabDataModal],
  template: `
    @if (store.loadError(); as error) {
      <div
        class="mb-1.5 flex items-center justify-between rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800"
        role="alert"
      >
        <span>{{ error }}</span>
        <button
          type="button"
          class="rounded border border-red-300 px-2 py-0.5 text-xs font-medium hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          (click)="store.reload()"
        >
          Opnieuw proberen
        </button>
      </div>
    }
    @if (store.actionError(); as error) {
      <div class="mb-1.5 rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800" role="alert">
        {{ error }}
      </div>
    }
    <div class="overflow-hidden rounded border border-gray-300">
      @if (store.loading()) {
        <p class="px-3 py-2.5 text-left text-xs text-gray-500">laboratoriumgegevens laden…</p>
      } @else if (!labData().length) {
        <button
          type="button"
          class="flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-xs !font-normal text-gray-500 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          (click)="modalOpen.set(true)"
        >
          <svg lucidePlus [size]="14"></svg>
          Labwaarde toevoegen
        </button>
      } @else {
        <ul class="divide-y divide-gray-100 text-xs">
          @for (item of labData(); track item.id) {
            <li
              class="group flex items-center gap-1.5 py-1.5 pr-1.5 pl-3 hover:bg-gray-50 min-h-9"
              (click)="modalOpen.set(true)"
            >
              <span class="min-w-0 flex-1 truncate font-medium text-gray-900">
                {{ describe(item.labCodeId) }}
                <span class="text-gray-500 font-normal">
                  @ {{ formatAmount(item.value) }}
                  @if (unitFor(item.labCodeId); as unit) {
                    {{ unit }}
                  }
                </span>
              </span>
              <span class="shrink-0 whitespace-nowrap text-gray-500 tabular-nums">
                {{ item.daysAgo }}d
              </span>
              <button
                type="button"
                class="flex w-0 shrink-0 items-center justify-center overflow-hidden rounded text-gray-400 transition-[width] duration-150 group-hover:w-6 group-hover:p-1 group-focus-within:w-6 group-focus-within:p-1 hover:bg-gray-100 hover:text-gray-700 focus-visible:w-6 focus-visible:p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                [attr.aria-label]="describe(item.labCodeId) + ' bewerken'"
                (click)="editItem(item, $event)"
              >
                <svg lucidePencil [size]="16" class="shrink-0"></svg>
              </button>
              <button
                type="button"
                class="flex w-0 shrink-0 items-center justify-center overflow-hidden rounded text-gray-400 transition-[width] duration-150 group-hover:w-6 group-hover:p-1 group-focus-within:w-6 group-focus-within:p-1 hover:bg-red-50 hover:text-red-600 focus-visible:w-6 focus-visible:p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                [attr.aria-label]="describe(item.labCodeId) + ' verwijderen'"
                (click)="removeItem(item.id, $event)"
              >
                <svg lucideX [size]="16" class="shrink-0"></svg>
              </button>
            </li>
          }
        </ul>
      }
    </div>

    <app-lab-data-modal
      [open]="modalOpen()"
      [editing]="editingItem()"
      (close)="closeModal()"
    />
  `,
})
export class LabDataField {
  protected readonly store = inject(LabDataStore);
  private readonly labCodeSearch = inject(LabCodeSearchService);

  protected readonly labData = this.store.labData;
  protected readonly modalOpen = signal(false);
  protected readonly editingItem = signal<LabDatum | null>(null);
  protected readonly formatAmount = formatAmount;

  protected describe(labCodeId: string): string {
    return this.labCodeSearch.describe(labCodeId);
  }

  protected unitFor(labCodeId: string): string {
    return this.labCodeSearch.unitFor(labCodeId);
  }

  protected editItem(item: LabDatum, event: Event) {
    event.stopPropagation();
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  protected removeItem(id: string, event: Event) {
    event.stopPropagation();
    this.store.remove(id);
  }

  protected closeModal() {
    this.modalOpen.set(false);
    this.editingItem.set(null);
  }
}
