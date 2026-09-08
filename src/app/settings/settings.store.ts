import { DOCUMENT } from '@angular/common';
import { Service, computed, inject, signal } from '@angular/core';

const STORAGE_KEY = 'app-settings';

export interface AppSettings {
  demoMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  demoMode: false,
};

@Service()
export class SettingsStore {
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly settingsState = signal<AppSettings>(this.loadSettings());

  readonly settings = this.settingsState.asReadonly();
  readonly demoMode = computed(() => this.settingsState().demoMode);

  setDemoMode(enabled: boolean) {
    this.update({ demoMode: enabled });
  }

  private update(partial: Partial<AppSettings>) {
    const next = { ...this.settingsState(), ...partial };
    this.settingsState.set(next);
    this.window?.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadSettings(): AppSettings {
    try {
      const raw = this.window?.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return DEFAULT_SETTINGS;
      }
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? { ...DEFAULT_SETTINGS, ...parsed } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
}
