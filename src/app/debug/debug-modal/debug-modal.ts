import { Component, WritableSignal, computed, inject, input, output, signal } from '@angular/core';
import { LucideBug, LucideCheck, LucideCopy } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { PrescriptorService } from '../../prescriptor.service';

const COPIED_FEEDBACK_MS = 1500;

@Component({
  selector: 'app-debug-modal',
  imports: [Modal, LucideBug, LucideCheck, LucideCopy],
  template: `
    <app-modal [open]="open()" title="Debug" maxWidth="max-w-6xl" (close)="close.emit()">
      <svg modalIcon lucideBug [size]="20"></svg>

      <div class="grid grid-cols-2 gap-3">
        <div class="min-w-0">
          <div class="flex items-center justify-between">
            <label>Request</label>
            @if (hasRequest()) {
              <button
                type="button"
                [class]="
                  'flex size-6 items-center justify-center rounded text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ' +
                  (requestCopied() ? 'hover:bg-green-100 hover:text-green-700' : 'hover:bg-gray-200 hover:text-gray-700')
                "
                aria-label="Request kopiëren"
                (click)="copy(requestJson(), requestCopied)"
              >
                @if (requestCopied()) {
                  <svg lucideCheck [size]="14" class="text-green-600"></svg>
                } @else {
                  <svg lucideCopy [size]="14"></svg>
                }
              </button>
            }
          </div>
          <pre>{{ requestJson() }}</pre>
        </div>
        <div class="min-w-0">
          <div class="flex items-center justify-between">
            <label>Response</label>
            @if (hasResult()) {
              <button
                type="button"
                [class]="
                  'flex size-6 items-center justify-center rounded text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ' +
                  (responseCopied() ? 'hover:bg-green-100 hover:text-green-700' : 'hover:bg-gray-200 hover:text-gray-700')
                "
                aria-label="Response kopiëren"
                (click)="copy(responseJson(), responseCopied)"
              >
                @if (responseCopied()) {
                  <svg lucideCheck [size]="14" class="text-green-600"></svg>
                } @else {
                  <svg lucideCopy [size]="14"></svg>
                }
              </button>
            }
          </div>
          <pre>{{ responseJson() }}</pre>
        </div>
      </div>
    </app-modal>
  `,
})
export class DebugModal {
  private readonly prescriptorService = inject(PrescriptorService);

  open = input.required<boolean>();
  close = output<void>();

  protected readonly hasRequest = computed(() => this.prescriptorService.lastSessionRequest() !== null);
  protected readonly hasResult = computed(() => this.prescriptorService.lastSessionResult() !== null);

  protected readonly requestJson = computed(() => {
    const request = this.prescriptorService.lastSessionRequest();
    return request !== null ? JSON.stringify(request, null, 2) : 'Nog geen sessie gestart.';
  });

  protected readonly responseJson = computed(() => {
    const result = this.prescriptorService.lastSessionResult();
    return result !== null ? JSON.stringify(result, null, 2) : 'Nog geen resultaat ontvangen';
  });

  protected readonly requestCopied = signal(false);
  protected readonly responseCopied = signal(false);

  private readonly copiedTimers = new Map<WritableSignal<boolean>, ReturnType<typeof setTimeout>>();

  protected async copy(text: string, copied: WritableSignal<boolean>) {
    await navigator.clipboard.writeText(text);
    clearTimeout(this.copiedTimers.get(copied));
    copied.set(true);
    this.copiedTimers.set(
      copied,
      setTimeout(() => copied.set(false), COPIED_FEEDBACK_MS),
    );
  }
}
