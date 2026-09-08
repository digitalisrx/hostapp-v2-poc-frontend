import { Service, effect, inject, signal } from '@angular/core';
import { PatientStore } from '../patient/patient.store';
import { AllergyApiService } from './allergy-api.service';
import { Allergy } from './allergy.model';

@Service()
export class AllergyStore {
  private readonly api = inject(AllergyApiService);
  private readonly patientStore = inject(PatientStore);

  private readonly allergiesState = signal<Allergy[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadErrorState = signal<string | null>(null);
  private readonly actionErrorState = signal<string | null>(null);
  private readonly recordIds = new Map<string, string>();

  readonly allergies = this.allergiesState.asReadonly();
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
      this.allergiesState.set([]);
      this.recordIds.clear();
      this.loadingState.set(false);
      this.loadErrorState.set(null);
      return;
    }

    this.loadingState.set(true);
    this.loadErrorState.set(null);

    try {
      const records = await this.api.getForPatient(patientId);
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }

      this.recordIds.clear();
      records.forEach((record) => this.recordIds.set(record.item.id, record.recordId));
      this.allergiesState.set(records.map((record) => record.item));
    } catch (error) {
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.loadErrorState.set(error instanceof Error ? error.message : 'Allergieën laden mislukt.');
    } finally {
      if (this.patientStore.selectedPatient()?.id === patientId) {
        this.loadingState.set(false);
      }
    }
  }

  async add(item: Allergy) {
    if (this.allergiesState().some((existing) => existing.id === item.id)) {
      return;
    }

    const patientId = this.patientStore.selectedPatient()?.id;
    if (!patientId) {
      return;
    }

    this.actionErrorState.set(null);

    try {
      const recordId = await this.api.add(patientId, item);
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.recordIds.set(item.id, recordId);
      this.allergiesState.update((items) =>
        items.some((existing) => existing.id === item.id) ? items : [...items, item],
      );
    } catch (error) {
      this.actionErrorState.set(error instanceof Error ? error.message : 'Allergie toevoegen mislukt.');
    }
  }

  async remove(id: string) {
    const patientId = this.patientStore.selectedPatient()?.id;
    const recordId = this.recordIds.get(id);

    if (!patientId || !recordId) {
      this.allergiesState.update((items) => items.filter((item) => item.id !== id));
      this.recordIds.delete(id);
      return;
    }

    this.actionErrorState.set(null);
    const previous = this.allergiesState();
    this.allergiesState.update((items) => items.filter((item) => item.id !== id));

    try {
      await this.api.remove(patientId, recordId);
      this.recordIds.delete(id);
    } catch (error) {
      this.allergiesState.set(previous);
      this.actionErrorState.set(error instanceof Error ? error.message : 'Allergie verwijderen mislukt.');
    }
  }
}
