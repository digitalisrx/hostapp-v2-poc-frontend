import { Component, inject, output, signal } from '@angular/core';
import { DeleteButton } from '../../shared/delete-button/delete-button';
import { MedicationDetailModal } from '../medication-detail-modal/medication-detail-modal';
import { Medication } from '../medication.model';
import { MedicationStore } from '../medication.store';

@Component({
  selector: 'app-medication-field',
  imports: [DeleteButton, MedicationDetailModal],
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
        <p class="px-3 py-2.5 text-xs text-muted">medicatie laden…</p>
      } @else if (medications().length) {
        <div class="divide-y divide-gray-100 text-xs">
          @for (drug of medications(); track drug.id) {
            <div
              class="group flex cursor-pointer items-start gap-2 pl-3 p-1.5 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
              role="button"
              tabindex="0"
              [attr.aria-label]="drug.description + ' bewerken in CreateRx'"
              (click)="editPrescription.emit(drug)"
              (keydown.enter)="editPrescription.emit(drug)"
              (keydown.space)="onSpace(drug, $event)"
            >
              <div class="min-w-0 flex-1 flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="min-w-0 truncate font-medium text-foreground">{{ drug.description }}</span>
                  @if (drug.opium) {
                    <span class="rounded-lg bg-red-50 px-2 py-0.5 text-xs text-red-600">
                      Opium
                    </span>
                  }
                </div>
                <p class="text-xs text-muted">
                  @if (quantityFor(drug); as quantity) {
                    {{ quantity.value }} {{ quantity.unit }} &middot;
                  }
                  {{ drug.duration }} dagen
                </p>
              </div>
              <app-delete-button
                [ariaLabel]="drug.description + ' verwijderen'"
                (delete)="store.remove(drug.id)"
              />
            </div>
          }
        </div>
      } @else {
        <p class="px-3 py-2.5 text-xs text-muted">Nog geen medicatie</p>
      }
    </div>

    <app-medication-detail-modal
      [open]="detailModalOpen()"
      [medications]="medications()"
      (close)="detailModalOpen.set(false)"
    />
  `,
})
export class MedicationField {
  protected readonly store = inject(MedicationStore);

  protected readonly medications = this.store.medications;
  protected readonly detailModalOpen = signal(false);

  editPrescription = output<Medication>();

  /** Called from the sidebar's title-bar detail-view button. */
  openDetails() {
    this.detailModalOpen.set(true);
  }

  protected onSpace(drug: Medication, event: Event) {
    event.preventDefault();
    this.editPrescription.emit(drug);
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
