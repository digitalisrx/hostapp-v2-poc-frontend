import { Service, effect, inject, signal } from '@angular/core';
import { PatientStore } from '../patient/patient.store';
import { LabCodeSearchService } from './lab-code-search.service';
import { LabDataApiService } from './lab-data-api.service';
import { LabDatum } from './lab-datum.model';

@Service()
export class LabDataStore {
  private readonly api = inject(LabDataApiService);
  private readonly patientStore = inject(PatientStore);
  private readonly labCodeSearch = inject(LabCodeSearchService);

  private readonly labDataState = signal<LabDatum[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadErrorState = signal<string | null>(null);
  private readonly actionErrorState = signal<string | null>(null);

  readonly labData = this.labDataState.asReadonly();
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
      this.labDataState.set([]);
      this.loadingState.set(false);
      this.loadErrorState.set(null);
      return;
    }

    this.loadingState.set(true);
    this.loadErrorState.set(null);

    try {
      const labData = await this.api.getForPatient(patientId);
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.labDataState.set(labData);
      labData.forEach((item) => this.labCodeSearch.resolve(item.labCodeId));
    } catch (error) {
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.loadErrorState.set(error instanceof Error ? error.message : 'Laboratoriumgegevens laden mislukt.');
    } finally {
      if (this.patientStore.selectedPatient()?.id === patientId) {
        this.loadingState.set(false);
      }
    }
  }

  async add(labCodeId: string, daysAgo: number, value: number): Promise<boolean> {
    const patientId = this.patientStore.selectedPatient()?.id;
    if (!patientId) {
      return false;
    }

    this.actionErrorState.set(null);

    try {
      const created = await this.api.add(patientId, labCodeId, daysAgo, value);
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return false;
      }
      this.labDataState.update((items) => [...items, created]);
      return true;
    } catch (error) {
      this.actionErrorState.set(error instanceof Error ? error.message : 'Labwaarde toevoegen mislukt.');
      return false;
    }
  }

  async update(id: string, daysAgo: number, value: number): Promise<boolean> {
    const patientId = this.patientStore.selectedPatient()?.id;
    if (!patientId) {
      return false;
    }

    this.actionErrorState.set(null);

    try {
      const updated = await this.api.update(patientId, id, daysAgo, value);
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return false;
      }
      this.labDataState.update((items) => items.map((item) => (item.id === id ? updated : item)));
      return true;
    } catch (error) {
      this.actionErrorState.set(error instanceof Error ? error.message : 'Labwaarde opslaan mislukt.');
      return false;
    }
  }

  async remove(id: string) {
    const patientId = this.patientStore.selectedPatient()?.id;
    if (!patientId) {
      return;
    }

    this.actionErrorState.set(null);
    const previous = this.labDataState();
    this.labDataState.update((items) => items.filter((item) => item.id !== id));

    try {
      await this.api.remove(patientId, id);
    } catch (error) {
      this.labDataState.set(previous);
      this.actionErrorState.set(error instanceof Error ? error.message : 'Labwaarde verwijderen mislukt.');
    }
  }
}
