import { Component, inject, signal } from '@angular/core';
import { DeleteButton } from '../../shared/delete-button/delete-button';
import { formatAmount } from '../../shared/format-amount';
import { LabCodeSearchService } from '../lab-code-search.service';
import { LabDataModal } from '../lab-data-modal/lab-data-modal';
import { LabDataStore } from '../lab-data.store';
import { LabDatum } from '../lab-datum.model';

@Component({
  selector: 'app-lab-data-field',
  imports: [DeleteButton, LabDataModal],
  template: `
    @if (store.loadError(); as error) {
      <div
        class="mb-1.5 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800"
        role="alert"
      >
        <span>{{ error }}</span>
        <button
          type="button"
          class="rounded-lg border border-red-300 px-2 py-0.5 text-xs font-medium hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          (click)="store.reload()"
        >
          Opnieuw proberen
        </button>
      </div>
    }
    @if (store.actionError(); as error) {
      <div class="mb-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800" role="alert">
        {{ error }}
      </div>
    }
    <div class="overflow-hidden rounded-lg border border-gray-300">
      @if (store.loading()) {
        <p class="px-3 py-2.5 text-left text-xs text-muted">laboratoriumgegevens laden…</p>
      } @else if (!labData().length) {
        <p class="px-3 py-2.5 text-left text-xs text-muted">Nog geen laboratoriumgegevens</p>
      } @else {
        <ul class="divide-y divide-gray-100 text-xs">
          @for (item of labData(); track item.id) {
            <li
              class="group flex min-h-9 cursor-pointer items-center gap-1.5 py-1.5 pl-3 hover:bg-gray-50"
              (click)="editItem(item)"
            >
              <span class="min-w-0 flex-1 truncate font-medium text-foreground">
                {{ describe(item.labCodeId) }}
                <span class="text-muted font-normal">
                  @ {{ formatAmount(item.value) }}
                  @if (unitFor(item.labCodeId); as unit) {
                    {{ unit }}
                  }
                </span>
              </span>
              <span class="w-16 shrink-0 truncate pl-1.5 whitespace-nowrap text-muted tabular-nums">
                {{ item.daysAgo }}d
              </span>
              <app-delete-button
                class="pr-1.5"
                [ariaLabel]="describe(item.labCodeId) + ' verwijderen'"
                (delete)="store.remove(item.id)"
              />
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

  /** Called from the sidebar's title-bar add button. */
  openAdd() {
    this.editingItem.set(null);
    this.modalOpen.set(true);
  }

  protected describe(labCodeId: string): string {
    return this.labCodeSearch.describe(labCodeId);
  }

  protected unitFor(labCodeId: string): string {
    return this.labCodeSearch.unitFor(labCodeId);
  }

  protected editItem(item: LabDatum) {
    this.editingItem.set(item);
    this.modalOpen.set(true);
  }

  protected closeModal() {
    this.modalOpen.set(false);
    this.editingItem.set(null);
  }
}
