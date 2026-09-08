import { Component, inject, signal } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { MedicationDetailModal } from '../medication-detail-modal/medication-detail-modal';
import { Medication } from '../medication.model';
import { MedicationStore } from '../medication.store';

@Component({
  selector: 'app-medication-field',
  imports: [LucideX, MedicationDetailModal],
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
        <p class="px-3 py-2.5 text-xs text-gray-500">medicatie laden…</p>
      } @else if (medications().length) {
        <div class="divide-y divide-gray-100 text-xs">
          @for (drug of medications(); track drug.id) {
            <div
              class="flex cursor-pointer items-start gap-2 p-2 pl-3 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:-outline-offset-2"
              role="button"
              tabindex="0"
              [attr.aria-label]="drug.description + ' details bekijken'"
              (click)="openDetail(drug.id)"
              (keydown.enter)="openDetail(drug.id)"
              (keydown.space)="openDetail(drug.id, $event)"
            >
              <div class="min-w-0 flex-1 flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <span class="min-w-0 truncate font-medium text-gray-900">{{ drug.description }}</span>
                  @if (drug.opium) {
                    <span class="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600">
                      Opium
                    </span>
                  }
                </div>
                <p class="text-xs text-gray-500">
                  @if (quantityFor(drug); as quantity) {
                    {{ quantity.value }} {{ quantity.unit }} &middot;
                  }
                  {{ drug.duration }} dagen
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                [attr.aria-label]="drug.description + ' verwijderen'"
                (click)="removeOne(drug.id, $event)"
              >
                <svg lucideX [size]="16"></svg>
              </button>
            </div>
          }
        </div>
      } @else {
        <p class="px-3 py-2.5 text-xs text-gray-500">Nog geen medicatie</p>
      }
    </div>

    <app-medication-detail-modal
      [open]="detailModalOpen()"
      [medications]="medications()"
      [focusId]="focusedMedicationId()"
      (close)="detailModalOpen.set(false)"
    />
  `,
})
export class MedicationField {
  protected readonly store = inject(MedicationStore);

  protected readonly medications = this.store.medications;
  protected readonly detailModalOpen = signal(false);
  protected readonly focusedMedicationId = signal<string | null>(null);

  protected openDetail(id: string, event?: Event) {
    event?.preventDefault();
    this.focusedMedicationId.set(id);
    this.detailModalOpen.set(true);
  }

  protected removeOne(id: string, event: Event) {
    event.stopPropagation();
    this.store.remove(id);
  }

  protected quantityFor(drug: Medication) {
    return drug.codes[0]?.quantity ?? null;
  }

  protected directionsFor(drug: Medication): string | null {
    const directions = drug.codes[0]?.directions;
    if (!directions) {
      return null;
    }
    return typeof directions === 'string' ? directions : directions.user;
  }
}
