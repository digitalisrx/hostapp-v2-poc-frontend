import { Component, inject, input, output } from '@angular/core';
import { LucideSettings } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { SettingsStore } from '../settings.store';

@Component({
  selector: 'app-settings-modal',
  imports: [Modal, LucideSettings],
  template: `
    <app-modal [open]="open()" title="Instellingen" (close)="close.emit()">
      <svg modalIcon lucideSettings [size]="20"></svg>

      <label class="flex items-start align gap-3 text-sm">
        <input
          type="checkbox"
          class="mt-3 size-4 shrink-0 rounded-lg border-gray-300 text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          [checked]="settingsStore.demoMode()"
          (change)="onDemoModeChange($event)"
        />
        <span>
          <span class="block font-medium text-gray-900">Demomodus</span>
          <span class="block font-normal text-gray-500">
            Toont een opvallende rand rond de Prescriptor-iframe, zodat direct duidelijk is welke applicatie
            wordt getoond.
          </span>
        </span>
      </label>
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
}
