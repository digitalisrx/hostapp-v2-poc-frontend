import { Service, effect, inject, signal } from '@angular/core';
import { PatientStore } from '../patient/patient.store';
import { GstandaardContraindicationApiService } from './gstandaard-contraindication-api.service';
import { GstandaardContraindication } from './gstandaard.model';

@Service()
export class GstandaardContraindicationStore {
  private readonly api = inject(GstandaardContraindicationApiService);
  private readonly patientStore = inject(PatientStore);

  private readonly contraindicationsState = signal<GstandaardContraindication[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadErrorState = signal<string | null>(null);
  private readonly actionErrorState = signal<string | null>(null);
  private readonly recordIds = new Map<string, string>();

  readonly contraindications = this.contraindicationsState.asReadonly();
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
      this.contraindicationsState.set([]);
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
      this.contraindicationsState.set(records.map((record) => record.item));
    } catch (error) {
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.loadErrorState.set(error instanceof Error ? error.message : 'Contraindicaties laden mislukt.');
    } finally {
      if (this.patientStore.selectedPatient()?.id === patientId) {
        this.loadingState.set(false);
      }
    }
  }

  async add(item: GstandaardContraindication) {
    if (this.contraindicationsState().some((existing) => existing.id === item.id)) {
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
      this.contraindicationsState.update((items) =>
        items.some((existing) => existing.id === item.id) ? items : [...items, item],
      );
    } catch (error) {
      this.actionErrorState.set(error instanceof Error ? error.message : 'Contraindicatie toevoegen mislukt.');
    }
  }

  async remove(id: string) {
    const patientId = this.patientStore.selectedPatient()?.id;
    const recordId = this.recordIds.get(id);

    if (!patientId || !recordId) {
      this.contraindicationsState.update((items) => items.filter((item) => item.id !== id));
      this.recordIds.delete(id);
      return;
    }

    this.actionErrorState.set(null);
    const previous = this.contraindicationsState();
    this.contraindicationsState.update((items) => items.filter((item) => item.id !== id));

    try {
      await this.api.remove(patientId, recordId);
      this.recordIds.delete(id);
    } catch (error) {
      this.contraindicationsState.set(previous);
      this.actionErrorState.set(error instanceof Error ? error.message : 'Contraindicatie verwijderen mislukt.');
    }
  }
}
