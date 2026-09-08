import { Service, effect, inject, signal } from '@angular/core';
import { PatientStore } from '../patient/patient.store';
import { AdviceApiService } from './advice-api.service';
import { Advice } from './advice.model';

@Service()
export class AdviceStore {
  private readonly api = inject(AdviceApiService);
  private readonly patientStore = inject(PatientStore);

  private readonly advicesState = signal<Advice[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadErrorState = signal<string | null>(null);
  private readonly actionErrorState = signal<string | null>(null);

  readonly advices = this.advicesState.asReadonly();
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
      this.advicesState.set([]);
      this.loadingState.set(false);
      this.loadErrorState.set(null);
      return;
    }

    this.loadingState.set(true);
    this.loadErrorState.set(null);

    try {
      const advices = await this.api.getForPatient(patientId);
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.advicesState.set(advices);
    } catch (error) {
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.loadErrorState.set(error instanceof Error ? error.message : 'Advies laden mislukt.');
    } finally {
      if (this.patientStore.selectedPatient()?.id === patientId) {
        this.loadingState.set(false);
      }
    }
  }

  async addMany(patientId: string, items: readonly Omit<Advice, 'id'>[], sessionId: string | null) {
    if (!items.length) {
      return;
    }

    this.actionErrorState.set(null);

    try {
      const created = await Promise.all(items.map((item) => this.api.add(patientId, item, sessionId)));
      if (this.patientStore.selectedPatient()?.id !== patientId) {
        return;
      }
      this.advicesState.update((advices) => [...advices, ...created]);
    } catch (error) {
      this.actionErrorState.set(error instanceof Error ? error.message : 'Advies opslaan mislukt.');
    }
  }

  async remove(id: string) {
    const patientId = this.patientStore.selectedPatient()?.id;
    if (!patientId) {
      return;
    }

    this.actionErrorState.set(null);
    const previous = this.advicesState();
    this.advicesState.update((advices) => advices.filter((advice) => advice.id !== id));

    try {
      await this.api.remove(patientId, id);
    } catch (error) {
      this.advicesState.set(previous);
      this.actionErrorState.set(error instanceof Error ? error.message : 'Advies verwijderen mislukt.');
    }
  }
}
