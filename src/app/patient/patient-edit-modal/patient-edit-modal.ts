import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { LucideUserPen, LucideUserPlus } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { Patient, PatientGender } from '../patient.model';
import { PatientStore } from '../patient.store';

interface PatientEditModel {
  name: string;
  gender: PatientGender;
  dob: string;
}

@Component({
  selector: 'app-patient-edit-modal',
  imports: [Modal, FormField, LucideUserPen, LucideUserPlus],
  template: `
    <app-modal [open]="open()" [title]="patient() ? 'Patiënt bewerken' : 'Patiënt toevoegen'" (close)="handleClose()">
      @if (patient()) {
        <svg modalIcon lucideUserPen [size]="20"></svg>
      } @else {
        <svg modalIcon lucideUserPlus [size]="20"></svg>
      }

      <form class="flex flex-col gap-3" (submit)="onSubmit($event)">
        <label>
          Naam
          <input
            type="text"
            autofocus
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [formField]="editForm.name"
          />
          @if (editForm.name().touched() && editForm.name().invalid()) {
            @for (error of editForm.name().errors(); track error) {
              <span class="mt-1 block text-xs text-red-600">{{ error.message }}</span>
            }
          }
        </label>

        <label>
          Geslacht
          <select
            class="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [formField]="editForm.gender"
          >
            <option value="F">Vrouw</option>
            <option value="M">Man</option>
          </select>
        </label>

        <label>
          Geboortedatum
          <input
            type="date"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [formField]="editForm.dob"
          />
          @if (editForm.dob().touched() && editForm.dob().invalid()) {
            @for (error of editForm.dob().errors(); track error) {
              <span class="mt-1 block text-xs text-red-600">{{ error.message }}</span>
            }
          }
        </label>

        @if (submitError(); as error) {
          <p class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {{ error }}
          </p>
        }

        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            (click)="handleClose()"
          >
            Annuleren
          </button>
          <button
            type="submit"
            class="primary px-3 py-2 text-sm"
            [disabled]="editForm().invalid() || submitting()"
          >
            {{ submitting() ? 'Opslaan…' : 'Opslaan' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class PatientEditModal {
  private readonly patientStore = inject(PatientStore);

  open = input.required<boolean>();
  patient = input<Patient | null>(null);
  close = output<void>();

  protected readonly editModel = signal<PatientEditModel>({ name: '', gender: 'F', dob: '' });
  protected readonly editForm = form(this.editModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Naam is verplicht' });
    required(schemaPath.dob, { message: 'Geboortedatum is verplicht' });
  });
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      const patient = this.patient();
      this.editModel.set(
        patient
          ? { name: patient.name, gender: patient.gender, dob: patient.dob }
          : { name: '', gender: 'F', dob: '' },
      );
      this.submitError.set(null);
    });
  }

  protected async onSubmit(event: Event) {
    event.preventDefault();

    if (this.editForm().invalid()) {
      return;
    }

    const values = this.editModel();
    const patient = this.patient();

    this.submitting.set(true);
    this.submitError.set(null);

    try {
      if (patient) {
        await this.patientStore.updatePatient(patient.id, values);
      } else {
        await this.patientStore.createPatient(values);
      }
      this.close.emit();
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Patiënt opslaan mislukt.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected handleClose() {
    this.close.emit();
  }
}
