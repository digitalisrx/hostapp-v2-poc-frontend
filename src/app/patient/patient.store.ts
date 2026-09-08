import { Service, computed, inject, signal } from '@angular/core';
import { PatientApiService } from './patient-api.service';
import { Patient } from './patient.model';

@Service()
export class PatientStore {
  private readonly api = inject(PatientApiService);

  private readonly patientsState = signal<Patient[]>([]);
  private readonly selectedPatientId = signal<string | null>(null);
  private readonly loadingState = signal(true);
  private readonly loadErrorState = signal<string | null>(null);
  private readonly actionErrorState = signal<string | null>(null);

  readonly patients = this.patientsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadError = this.loadErrorState.asReadonly();
  readonly actionError = this.actionErrorState.asReadonly();
  readonly selectedPatient = computed(
    () => this.patientsState().find((patient) => patient.id === this.selectedPatientId()) ?? null,
  );

  constructor() {
    this.loadPatients();
  }

  async loadPatients() {
    this.loadingState.set(true);
    this.loadErrorState.set(null);

    try {
      const patients = await this.api.getPatients();
      this.patientsState.set(patients);

      if (this.selectedPatientId() === null) {
        this.selectedPatientId.set(patients[0]?.id ?? null);
      }
    } catch (error) {
      this.loadErrorState.set(error instanceof Error ? error.message : 'Patiënten laden mislukt.');
    } finally {
      this.loadingState.set(false);
    }
  }

  selectPatient(id: string) {
    this.selectedPatientId.set(id);
  }

  async createPatient(data: Omit<Patient, 'id'>): Promise<Patient> {
    const isFirstPatient = this.patientsState().length === 0;
    const patient = await this.api.createPatient(data, this.patientsState().length);
    this.patientsState.update((patients) => [...patients, patient]);
    if (isFirstPatient) {
      this.selectedPatientId.set(patient.id);
    }
    return patient;
  }

  async updatePatient(id: string, updates: Partial<Omit<Patient, 'id'>>) {
    const patient = await this.api.updatePatient(id, updates);
    this.patientsState.update((patients) => patients.map((p) => (p.id === id ? patient : p)));
  }

  async deletePatient(id: string) {
    await this.deletePatients([id]);
  }

  async deletePatients(ids: readonly string[]) {
    this.actionErrorState.set(null);

    try {
      await Promise.all(ids.map((id) => this.api.deletePatient(id)));
    } catch (error) {
      this.actionErrorState.set(error instanceof Error ? error.message : 'Patiënt verwijderen mislukt.');
      return;
    }

    const idsToDelete = new Set(ids);
    this.patientsState.update((patients) => patients.filter((patient) => !idsToDelete.has(patient.id)));

    const selectedId = this.selectedPatientId();
    if (selectedId !== null && idsToDelete.has(selectedId)) {
      this.selectedPatientId.set(this.patientsState()[0]?.id ?? null);
    }
  }

  async movePatient(id: string, direction: 'up' | 'down') {
    const patients = this.patientsState();
    const index = patients.findIndex((patient) => patient.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (index === -1 || targetIndex < 0 || targetIndex >= patients.length) {
      return;
    }

    const next = [...patients];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    await this.persistOrder(next);
  }

  async reorderPatient(previousIndex: number, currentIndex: number) {
    const next = [...this.patientsState()];
    const [moved] = next.splice(previousIndex, 1);
    next.splice(currentIndex, 0, moved);
    await this.persistOrder(next);
  }

  private async persistOrder(orderedPatients: readonly Patient[]) {
    this.actionErrorState.set(null);
    this.patientsState.set(orderedPatients as Patient[]);

    try {
      await this.api.updateSortOrder(orderedPatients.map((patient, index) => ({ id: patient.id, sortOrder: index })));
    } catch (error) {
      this.actionErrorState.set(error instanceof Error ? error.message : 'Volgorde van patiënten opslaan mislukt.');
      await this.loadPatients();
    }
  }
}
