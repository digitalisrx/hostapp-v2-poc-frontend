import { Component, computed, inject, input } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { PrescriptorService, PrescriptorSessionType } from '../prescriptor.service';
import { SettingsStore } from '../settings/settings.store';

@Component({
  selector: 'app-prescriptor-view',
  host: { class: 'flex h-full min-w-0 flex-1' },
  template: `
    <div class="flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-200">
      @if (errorMessage(); as error) {
        <div class="m-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <p class="font-semibold">{{ sessionTypeLabel() }} kan niet worden geladen</p>
          <p class="mt-1">{{ error }}</p>
        </div>
      } @else if (resultStatus() === 'error') {
        <div class="m-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <p class="font-semibold">Ophalen van het resultaat is mislukt</p>
          <p class="mt-1">{{ resultError() }}</p>
        </div>
      } @else if (resultStatus() === 'resolved') {
        <div class="flex h-full w-full items-center justify-center p-3 text-center text-sm text-muted">
          Resultaat verwerkt, zie Medicatie en Advies in de zijbalk
        </div>
      } @else if (iframeUrl(); as url) {
        <div
          class="min-h-0 w-full flex-1"
          [class.p-1]="settingsStore.demoMode()"
          [class.bg-gradient-to-br]="settingsStore.demoMode()"
          [class.from-primary/65]="settingsStore.demoMode()"
          [class.to-primary]="settingsStore.demoMode()"
          [class.rounded-lg]="settingsStore.demoMode()"
        >
          <div class="bg-white h-full w-full" [class.rounded]="settingsStore.demoMode()">
            <iframe
              [src]="url"
              class="h-full w-full"
              [title]="sessionTypeLabel()"
              [class.rounded]="settingsStore.demoMode()"
            ></iframe>
          </div>
        </div>
        @if (resultStatus() === 'loading') {
          <div class="border-t border-gray-200 bg-white px-4 py-2 text-sm text-muted">
            Resultaat ophalen…
          </div>
        }
      } @else {
        <div class="flex h-full w-full items-center justify-center text-sm text-muted">
          Start {{ sessionTypeLabel() }} om hier de resultaten te bekijken.
        </div>
      }
    </div>
  `,
})
export class PrescriptorView {
  private readonly prescriptorService = inject(PrescriptorService);
  protected readonly settingsStore = inject(SettingsStore);

  iframeUrl = input<SafeResourceUrl | null>(null);
  errorMessage = input<string | null>(null);
  sessionType = input<PrescriptorSessionType | null>(null);

  protected readonly resultStatus = this.prescriptorService.resultStatus;
  protected readonly resultError = this.prescriptorService.resultError;
  protected readonly sessionTypeLabel = computed(() => (this.sessionType() === 'create-rx' ? 'CreateRx' : 'Prescriptor'));
}
