import { Service, effect, inject, signal } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { TargetApiService } from './target-api.service';
import { Target } from './target.model';

@Service()
export class TargetStore {
  private readonly api = inject(TargetApiService);
  private readonly authStore = inject(AuthStore);

  private readonly targetsState = signal<Target[]>([]);
  private readonly loadingState = signal(false);
  private readonly loadErrorState = signal<string | null>(null);
  private readonly actionErrorState = signal<string | null>(null);

  readonly targets = this.targetsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadError = this.loadErrorState.asReadonly();
  readonly actionError = this.actionErrorState.asReadonly();

  constructor() {
    effect(() => {
      if (this.authStore.user()) {
        this.loadTargets();
      } else {
        this.targetsState.set([]);
      }
    });
  }

  async loadTargets() {
    this.loadingState.set(true);
    this.loadErrorState.set(null);

    try {
      this.targetsState.set(await this.api.getTargets());
    } catch (error) {
      this.loadErrorState.set(error instanceof Error ? error.message : 'Targets laden mislukt.');
    } finally {
      this.loadingState.set(false);
    }
  }

  /** Lets validation errors (e.g. a disallowed URL) propagate — the edit modal shows them inline. */
  async create(data: { label: string; url: string }): Promise<Target> {
    const target = await this.api.create(data);
    this.targetsState.update((targets) => [...targets, target]);
    return target;
  }

  async update(id: string, updates: { label?: string; url?: string }): Promise<Target> {
    const target = await this.api.update(id, updates);
    this.targetsState.update((targets) => targets.map((t) => (t.id === id ? target : t)));
    return target;
  }

  async delete(id: string) {
    this.actionErrorState.set(null);
    const previous = this.targetsState();
    this.targetsState.update((targets) => targets.filter((target) => target.id !== id));

    try {
      await this.api.delete(id);
    } catch (error) {
      this.targetsState.set(previous);
      this.actionErrorState.set(error instanceof Error ? error.message : 'Target verwijderen mislukt.');
    }
  }

  /** Only one target can be active. The active one can't be deselected directly — only replaced by another. */
  async setActive(id: string) {
    this.actionErrorState.set(null);
    const previous = this.targetsState();
    this.targetsState.update((targets) => targets.map((target) => ({ ...target, active: target.id === id })));

    try {
      await this.api.activate(id);
    } catch (error) {
      this.targetsState.set(previous);
      this.actionErrorState.set(error instanceof Error ? error.message : 'Target activeren mislukt.');
    }
  }

  async reorder(previousIndex: number, currentIndex: number) {
    const previous = this.targetsState();
    const next = [...previous];
    const [moved] = next.splice(previousIndex, 1);
    next.splice(currentIndex, 0, moved);

    this.actionErrorState.set(null);
    this.targetsState.set(next);

    try {
      await this.api.reorder(next.map((target) => target.id));
    } catch (error) {
      this.targetsState.set(previous);
      this.actionErrorState.set(error instanceof Error ? error.message : 'Volgorde van targets opslaan mislukt.');
    }
  }
}
