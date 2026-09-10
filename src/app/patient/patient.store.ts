import { Service, computed, effect, inject, signal } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { PatientApiService } from './patient-api.service';
import { Patient } from './patient.model';

@Service()
export class PatientStore {
  private readonly api = inject(PatientApiService);
  private readonly authStore = inject(AuthStore);

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

  private readonly selectedOrganizationId = computed(() => this.authStore.user()?.selectedOrganizationId ?? null);

  constructor() {
    effect(() => {
      const organizationId = this.selectedOrganizationId();
      // A patient list belongs to a single organization — switching organizations invalidates
      // the current selection, since a matching patient id would refer to a different patient.
      this.selectedPatientId.set(null);
      this.loadPatients(organizationId);
    });
  }

  async loadPatients(organizationId: string | null = this.selectedOrganizationId()) {
    if (!organizationId) {
      this.patientsState.set([]);
      this.loadingState.set(false);
      this.loadErrorState.set(null);
      return;
    }

    this.loadingState.set(true);
    this.loadErrorState.set(null);

    try {
      const patients = await this.api.getPatients();
      if (this.selectedOrganizationId() !== organizationId) {
        return;
      }
      this.patientsState.set(patients);
      if (!patients.some((patient) => patient.id === this.selectedPatientId())) {
        this.selectedPatientId.set(patients[0]?.id ?? null);
      }
    } catch (error) {
      if (this.selectedOrganizationId() !== organizationId) {
        return;
      }
      this.loadErrorState.set(error instanceof Error ? error.message : 'Patiënten laden mislukt.');
    } finally {
      if (this.selectedOrganizationId() === organizationId) {
        this.loadingState.set(false);
      }
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

  async duplicatePatient(id: string): Promise<Patient | null> {
    this.actionErrorState.set(null);

    try {
      const patient = await this.api.duplicatePatient(id);
      this.patientsState.update((patients) => [...patients, patient]);
      return patient;
    } catch (error) {
      this.actionErrorState.set(error instanceof Error ? error.message : 'Patiënt dupliceren mislukt.');
      return null;
    }
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
