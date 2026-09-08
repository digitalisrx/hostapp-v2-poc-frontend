import { Component, inject, signal } from '@angular/core';
import { LucidePlus, LucideX } from '@lucide/angular';
import { GstandaardContraindicationModal } from '../gstandaard-contraindication-modal/gstandaard-contraindication-modal';
import { GstandaardContraindicationStore } from '../gstandaard-contraindication.store';

@Component({
  selector: 'app-gstandaard-contraindication-field',
  imports: [LucidePlus, LucideX, GstandaardContraindicationModal],
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
        <p class="px-3 py-2.5 text-left text-xs text-gray-500">contraindicaties laden…</p>
      } @else if (!contraindications().length) {
        <button
          type="button"
          class="flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-xs !font-normal text-gray-500 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          (click)="modalOpen.set(true)"
        >
          <svg lucidePlus [size]="14"></svg>
          Contraindicaties toevoegen
        </button>
      } @else {
        <table class="w-full table-fixed border-collapse text-xs" (click)="modalOpen.set(true)">
          <tbody>
            @for (item of contraindications(); track item.id) {
              <tr class="border-t border-gray-100 first:border-t-0 hover:bg-gray-50">
                <td class="w-full max-w-0 truncate py-1.5 pr-1.5 pl-3 font-medium text-gray-900">{{ item.description }}</td>
                <td class="w-16 truncate py-1.5 pr-1.5 whitespace-nowrap text-gray-500 tabular-nums">{{ item.id }}</td>
                <td class="w-8 py-1.5 pr-1.5">
                  <button
                    type="button"
                    class="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                    [attr.aria-label]="item.description + ' verwijderen'"
                    (click)="removeItem(item.id, $event)"
                  >
                    <svg lucideX [size]="16"></svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <app-gstandaard-contraindication-modal [open]="modalOpen()" (close)="modalOpen.set(false)" />
  `,
})
export class GstandaardContraindicationField {
  protected readonly store = inject(GstandaardContraindicationStore);

  protected readonly contraindications = this.store.contraindications;
  protected readonly modalOpen = signal(false);

  protected removeItem(id: string, event: Event) {
    event.stopPropagation();
    this.store.remove(id);
  }
}
