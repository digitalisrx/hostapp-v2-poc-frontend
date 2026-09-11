import { Component, inject, input, output } from '@angular/core';
import { LucideSettings } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { SettingsStore, SplitScreenOrientation } from '../settings.store';

@Component({
  selector: 'app-settings-modal',
  imports: [Modal, LucideSettings],
  template: `
    <app-modal [open]="open()" title="Instellingen" (close)="close.emit()">
      <svg modalIcon lucideSettings [size]="20"></svg>

      <div class="flex flex-col gap-3">
        <label class="flex items-start align gap-3 text-sm">
          <input
            type="checkbox"
            class="mt-3 size-4 shrink-0 rounded-lg border-gray-300 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            [checked]="settingsStore.demoMode()"
            (change)="onDemoModeChange($event)"
          />
          <span>
            <span class="block font-medium text-foreground">Demomodus</span>
            <span class="block font-normal text-muted">
              Toont een opvallende rand rond de Prescriptor-iframe, zodat direct duidelijk is welke applicatie
              wordt getoond.
            </span>
          </span>
        </label>

        <div class="flex flex-col gap-1">
          <label class="flex items-start align gap-3 text-sm">
            <input
              type="checkbox"
              class="mt-3 size-4 shrink-0 rounded-lg border-gray-300 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              [checked]="settingsStore.splitScreenMode()"
              (change)="onSplitScreenModeChange($event)"
            />
            <span>
              <span class="block font-medium text-foreground">Splitscreen</span>
              <span class="block font-normal text-muted">
                Toont de eerste twee targets onder elkaar in plaats van de Prescriptor-weergave.
              </span>
            </span>
          </label>

          <div class="ml-7 flex flex-col gap-1" [class.opacity-50]="!settingsStore.splitScreenMode()">
            <label class="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="splitScreenOrientation"
                class="size-4 shrink-0 border-gray-300 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                [checked]="settingsStore.splitScreenOrientation() === 'horizontal'"
                [disabled]="!settingsStore.splitScreenMode()"
                (change)="onSplitScreenOrientationChange('horizontal')"
              />
              <span class="text-muted font-normal">Horizontaal (naast elkaar)</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="splitScreenOrientation"
                class="size-4 shrink-0 border-gray-300 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                [checked]="settingsStore.splitScreenOrientation() === 'vertical'"
                [disabled]="!settingsStore.splitScreenMode()"
                (change)="onSplitScreenOrientationChange('vertical')"
              />
              <span class="text-muted font-normal">Verticaal (onder elkaar)</span>
            </label>
          </div>
        </div>
      </div>
    </app-modal>
  `,
})
export class SettingsModal {
  protected readonly settingsStore = inject(SettingsStore);

  open = input.required<boolean>();
  close = output<void>();

  protected onDemoModeChange(event: Event) {
    this.settingsStore.setDemoMode((event.target as HTMLInputElement).checked);
  }

  protected onSplitScreenModeChange(event: Event) {
    this.settingsStore.setSplitScreenMode((event.target as HTMLInputElement).checked);
  }

  protected onSplitScreenOrientationChange(orientation: SplitScreenOrientation) {
    this.settingsStore.setSplitScreenOrientation(orientation);
  }
}
