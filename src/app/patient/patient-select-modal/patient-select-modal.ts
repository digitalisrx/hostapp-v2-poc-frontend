import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import {
  LucideCopy,
  LucideGripVertical,
  LucidePencil,
  LucideSearch,
  LucideTrash2,
  LucideUser,
  LucideUserPlus,
  LucideX,
} from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { PatientEditModal } from '../patient-edit-modal/patient-edit-modal';
import { Patient } from '../patient.model';
import { PatientStore } from '../patient.store';

@Component({
  selector: 'app-patient-select-modal',
  imports: [
    Modal,
    DragDropModule,
    LucideCopy,
    LucideGripVertical,
    LucidePencil,
    LucideSearch,
    LucideTrash2,
    LucideUser,
    LucideUserPlus,
    LucideX,
    PatientEditModal,
  ],
  template: `
    <app-modal [open]="open()" title="Patiënt selecteren" (close)="close.emit()">
      <svg modalIcon lucideUser [size]="20"></svg>

      @if (patientStore.actionError(); as error) {
        <div class="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {{ error }}
        </div>
      }

      <div class="flex justify-between gap-3 mb-3">
        <div class="flex-1">
          <span class="sr-only">Patiënten zoeken</span>
          <div class="relative">
            <svg
              lucideSearch
              [size]="16"
              class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400"
            ></svg>
            <input
              #searchInput
              type="search"
              autofocus
              placeholder="Patiënten zoeken"
              class="w-full rounded-lg border border-gray-300 py-2 pr-8 pl-8 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              [value]="searchTerm()"
              (input)="onSearchInput($event)"
            />
            @if (searchTerm()) {
              <button
                type="button"
                class="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                aria-label="Zoekopdracht wissen"
                (click)="clearSearch()"
              >
                <svg lucideX [size]="14"></svg>
              </button>
            }
          </div>
        </div>

        <button
          type="button"
          class="primary flex items-center gap-1.5 px-3 py-2 text-sm"
          (click)="creatingPatient.set(true)"
        >
          <svg lucideUserPlus [size]="16"></svg>
          Patiënt aanmaken
        </button>
      </div>

      @if (patientStore.loadError(); as error) {
        <div class="mb-3 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          <span>{{ error }}</span>
          <button
            type="button"
            class="rounded-lg border border-red-300 px-2 py-1 text-xs font-medium hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            (click)="patientStore.loadPatients()"
          >
            Opnieuw proberen
          </button>
        </div>
      }

      <div class="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
        <table class="w-full text-left text-sm">
          <thead class="tracking-wide border-b border-gray-200 text-gray-500">
            <tr>
              <th class="w-8 px-3 py-2"><span class="sr-only">Herordenen</span></th>
              <th class="px-3 py-2">Naam</th>
              <th class="px-3 py-2">Geslacht</th>
              <th class="px-3 py-2">Geboortedatum</th>
              <th class="w-24 px-3 py-2"><span class="sr-only">Acties</span></th>
            </tr>
          </thead>
          <tbody
            cdkDropList
            cdkDropListLockAxis="y"
            [cdkDropListDisabled]="isSearching()"
            (cdkDropListDropped)="onDrop($event)"
          >
            @if (patientStore.loading()) {
              <tr>
                <td colspan="5" class="px-3 py-6 text-center text-gray-500">Patiënten laden…</td>
              </tr>
            } @else {
            @for (patient of filteredPatients(); track patient.id) {
              <tr
                cdkDrag
                cdkDragLockAxis="y"
                [cdkDragDisabled]="isSearching()"
                class="cursor-pointer border-t border-gray-100 first:border-t-0 hover:bg-gray-50"
                (click)="choosePatient(patient.id)"
              >
                <td
                  class="px-3 py-2" 
                  cdkDragHandle
                  [class]="
                    isSearching() ? 'cursor-not-allowed text-gray-200' : 'cursor-grab text-gray-400 active:cursor-grabbing'
                  "
                >
                  <svg
                    lucideGripVertical
                    [size]="16"
                    [attr.aria-label]="patient.name + ' herordenen'"
                  ></svg>
                </td>
                <td class="px-3 py-2 font-medium text-gray-900">{{ patient.name }}</td>
                <td class="px-3 py-2">{{ patient.gender }}</td>
                <td class="px-3 py-2 tabular-nums">{{ patient.dob }}</td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      [attr.aria-label]="patient.name + ' bewerken'"
                      (click)="editOne(patient, $event)"
                    >
                      <svg lucidePencil [size]="16"></svg>
                    </button>
                    <button
                      type="button"
                      class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      [attr.aria-label]="patient.name + ' dupliceren'"
                      (click)="duplicateOne(patient.id, $event)"
                    >
                      <svg lucideCopy [size]="16"></svg>
                    </button>
                    <button
                      type="button"
                      class="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      [attr.aria-label]="patient.name + ' verwijderen'"
                      (click)="deleteOne(patient.id, $event)"
                    >
                      <svg lucideTrash2 [size]="16"></svg>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-3 py-6 text-center text-gray-500">
                  {{ isSearching() ? 'Geen patiënten gevonden voor uw zoekopdracht.' : 'Geen patiënten beschikbaar.' }}
                </td>
              </tr>
            }
            }
          </tbody>
        </table>
      </div>
    </app-modal>

    <app-patient-edit-modal
      [open]="editingPatient() !== null || creatingPatient()"
      [patient]="editingPatient()"
      (close)="closeEditModal()"
    />
  `,
})
export class PatientSelectModal {
  protected readonly patientStore = inject(PatientStore);

  open = input.required<boolean>();
  close = output<void>();

  protected readonly patients = this.patientStore.patients;
  protected readonly editingPatient = signal<Patient | null>(null);
  protected readonly creatingPatient = signal(false);

  protected readonly searchTerm = signal('');
  protected readonly isSearching = computed(() => this.searchTerm().trim().length > 0);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly filteredPatients = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.patients();
    }
    return this.patients().filter((patient) => patient.name.toLowerCase().includes(term));
  });

  protected onSearchInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch() {
    this.searchTerm.set('');
    this.searchInput()?.nativeElement.focus();
  }

  protected editOne(patient: Patient, event: Event) {
    event.stopPropagation();
    this.editingPatient.set(patient);
  }

  protected closeEditModal() {
    this.editingPatient.set(null);
    this.creatingPatient.set(false);
  }

  protected choosePatient(id: string) {
    this.patientStore.selectPatient(id);
    this.close.emit();
  }

  protected deleteOne(id: string, event: Event) {
    event.stopPropagation();
    this.patientStore.deletePatient(id);
  }

  protected duplicateOne(id: string, event: Event) {
    event.stopPropagation();
    this.patientStore.duplicatePatient(id);
  }

  protected onDrop(event: CdkDragDrop<unknown>) {
    this.patientStore.reorderPatient(event.previousIndex, event.currentIndex);
  }
}
