import { DOCUMENT } from '@angular/common';
import { Service, computed, inject, signal } from '@angular/core';

const STORAGE_KEY = 'app-settings';

export const MIN_SPLIT_SCREEN_PERCENT = 20;
export const MAX_SPLIT_SCREEN_PERCENT = 80;

export type SplitScreenOrientation = 'horizontal' | 'vertical';

export interface AppSettings {
  demoMode: boolean;
  splitScreenMode: boolean;
  splitScreenOrientation: SplitScreenOrientation;
  /** Percentage of the container's main axis taken up by the first pane. */
  splitScreenPositionHorizontal: number;
  splitScreenPositionVertical: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  demoMode: false,
  splitScreenMode: false,
  splitScreenOrientation: 'horizontal',
  splitScreenPositionHorizontal: 50,
  splitScreenPositionVertical: 50,
};

@Service()
export class SettingsStore {
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly settingsState = signal<AppSettings>(this.loadSettings());

  readonly settings = this.settingsState.asReadonly();
  readonly demoMode = computed(() => this.settingsState().demoMode);
  readonly splitScreenMode = computed(() => this.settingsState().splitScreenMode);
  readonly splitScreenOrientation = computed(() => this.settingsState().splitScreenOrientation);
  readonly splitScreenPositionHorizontal = computed(() => this.settingsState().splitScreenPositionHorizontal);
  readonly splitScreenPositionVertical = computed(() => this.settingsState().splitScreenPositionVertical);

  setDemoMode(enabled: boolean) {
    this.update({ demoMode: enabled });
  }

  setSplitScreenMode(enabled: boolean) {
    this.update({ splitScreenMode: enabled });
  }

  setSplitScreenOrientation(orientation: SplitScreenOrientation) {
    this.update({ splitScreenOrientation: orientation });
  }

  setSplitScreenPosition(orientation: SplitScreenOrientation, percent: number) {
    const clamped = Math.min(MAX_SPLIT_SCREEN_PERCENT, Math.max(MIN_SPLIT_SCREEN_PERCENT, percent));
    if (orientation === 'horizontal') {
      this.update({ splitScreenPositionHorizontal: clamped });
    } else {
      this.update({ splitScreenPositionVertical: clamped });
    }
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
