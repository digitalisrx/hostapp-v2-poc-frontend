import { Service, effect, inject, signal } from '@angular/core';
import { PatientStore } from '../patient/patient.store';
import { MedicationApiService } from './medication-api.service';
import { Medication } from './medication.model';

@Service()
export class MedicationStore {
  private readonly api = inject(MedicationApiService);
  private readonly patientStore = inject(PatientStore);

  private readonly medicationsState = signal<Medication[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadErrorState = signal<string | null>(null);
  private readonly actionErrorState = signal<string | null>(null);

  readonly medications = this.medicationsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadError = this.loadErrorState.asReadonly();
  readonly actionError = this.actionErrorState.asReadonly();

  constructor() {
    effect(() => {
      const patientId = this.patientStore.selectedPatient()?.id ?? null;
      this.loadFor(patientId);
    });
  }

  reload() {
    this.loadFor(this.patientStore.selectedPatient()?.id ?? null);
  }

  async loadFor(patientId: string | null) {
    if (!patientId) {
      this.medicationsState.set([]);
      this.loadingState.set(false);
      this.loadErrorState.set(null);
      return;
    }

    this.loadingState.set(true);
    this.loadErrorState.set(null);

    try {
      const medications = await this.api.getForPatient(patientId);
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.medicationsState.set(medications);
    } catch (error) {
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.loadErrorState.set(error instanceof Error ? error.message : 'Medicatie laden mislukt.');
    } finally {
      if (this.patientStore.selectedPatient()?.id === patientId) {
        this.loadingState.set(false);
      }
    }
  }

  async addMany(patientId: string, items: readonly Omit<Medication, 'id'>[], sessionId: string | null) {
    if (!items.length) {
      return;
    }

    this.actionErrorState.set(null);

    try {
      const created = await Promise.all(items.map((item) => this.api.add(patientId, item, sessionId)));
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.medicationsState.update((medications) => [...medications, ...created]);
    } catch (error) {
      this.actionErrorState.set(error instanceof Error ? error.message : 'Medicatie opslaan mislukt.');
    }
  }

  async remove(id: string) {
    const patientId = this.patientStore.selectedPatient()?.id;
    if (!patientId) {
      return;
    }

    this.actionErrorState.set(null);
    const previous = this.medicationsState();
    this.medicationsState.update((medications) => medications.filter((medication) => medication.id !== id));

    try {
      await this.api.remove(patientId, id);
    } catch (error) {
      this.medicationsState.set(previous);
      this.actionErrorState.set(error instanceof Error ? error.message : 'Medicatie verwijderen mislukt.');
    }
  }
}
