import { Component, inject } from '@angular/core';
import { DeleteButton } from '../../shared/delete-button/delete-button';
import { AdviceStore } from '../advice.store';

@Component({
  selector: 'app-advice-field',
  imports: [DeleteButton],
  template: `
    @if (store.loadError(); as error) {
      <div
        class="mb-1.5 flex items-center justify-between rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800"
        role="alert"
      >
        <span>{{ error }}</span>
        <button
          type="button"
          class="rounded border border-red-300 px-2 py-0.5 text-xs font-medium hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          (click)="store.reload()"
        >
          Opnieuw proberen
        </button>
      </div>
    }
    @if (store.actionError(); as error) {
      <div class="mb-1.5 rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800" role="alert">
        {{ error }}
      </div>
    }
    <div class="overflow-hidden rounded border border-gray-300">
      @if (store.loading()) {
        <p class="px-3 py-2.5 text-xs text-gray-500">adviezen laden…</p>
      } @else if (advices().length) {
        <div class="divide-y divide-gray-100 text-xs">
          @for (advice of advices(); track advice.id) {
            <div class="group flex items-center gap-2 py-1.5 pl-3">
              <div class="min-w-0 flex-1 text-gray-700 text-ellipsis overflow-hidden whitespace-nowrap">
                @if (advice.contentType !== 'text/plain') {
                  <a [href]="advice.text" target="_blank" rel="noopener" class="text-blue-600 hover:underline">
                    {{ advice.text }}
                  </a>
                } @else {
                  {{ advice.text }}
                }
              </div>
              <app-delete-button class="pr-1.5" ariaLabel="Advies verwijderen" (delete)="store.remove(advice.id)" />
            </div>
          }
        </div>
      } @else {
        <p class="px-3 py-2.5 text-xs text-gray-500">Nog geen adviezen</p>
      }
    </div>
  `,
})
export class AdviceField {
  protected readonly store = inject(AdviceStore);

  protected readonly advices = this.store.advices;
}
