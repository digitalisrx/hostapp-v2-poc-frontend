import { Component, inject, signal } from '@angular/core';
import { LucideUser } from '@lucide/angular';
import { PatientSelectModal } from '../patient-select-modal/patient-select-modal';
import { formatAge } from '../patient.model';
import { PatientStore } from '../patient.store';

@Component({
  selector: 'app-patient-selector',
  imports: [LucideUser, PatientSelectModal],
  template: `
    <div>
      <button
        type="button"
        class="flex w-full items-center gap-2 !font-normal rounded-lg border border-gray-300 px-3 py-1.5 min-h-9 text-left text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        (click)="modalOpen.set(true)"
      >
        <svg lucideUser [size]="selectedPatient() ? 18 : 14" class="shrink-0 text-gray-500"></svg>
        <span class="min-w-0 flex-1 text-xs">
          @if (selectedPatient(); as patient) {
            <span class="block truncate text-gray-900 font-medium text-sm">{{ patient.name }}</span>
            <span class="block text-gray-500">{{ patient.gender }} &middot; {{ formatAge(patient.dob) }}</span>
          } @else {
            <span class="text-gray-500">Patiënt selecteren</span>
          }
        </span>
      </button>
    </div>

    <app-patient-select-modal [open]="modalOpen()" (close)="modalOpen.set(false)" />
  `,
})
export class PatientSelector {
  private readonly patientStore = inject(PatientStore);

  protected readonly selectedPatient = this.patientStore.selectedPatient;
  protected readonly modalOpen = signal(false);
  protected readonly formatAge = formatAge;
}
