import { Component, inject, signal } from '@angular/core';
import { DeleteButton } from '../../shared/delete-button/delete-button';
import { IcpcContraindicationModal } from '../icpc-contraindication-modal/icpc-contraindication-modal';
import { IcpcContraindicationStore } from '../icpc-contraindication.store';

@Component({
  selector: 'app-icpc-contraindication-field',
  imports: [DeleteButton, IcpcContraindicationModal],
  template: `
    @if (store.loadError(); as error) {
      <div
        class="mb-1.5 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800"
        role="alert"
      >
        <span>{{ error }}</span>
        <button
          type="button"
          class="rounded-lg border border-red-300 px-2 py-0.5 text-xs font-medium hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          (click)="store.reload()"
        >
          Opnieuw proberen
        </button>
      </div>
    }
    @if (store.actionError(); as error) {
      <div class="mb-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800" role="alert">
        {{ error }}
      </div>
    }
    <div class="overflow-hidden rounded-lg border border-gray-300">
      @if (store.loading()) {
        <p class="px-3 py-2.5 text-left text-xs text-gray-500">contraindicaties laden…</p>
      } @else if (!contraindications().length) {
        <p class="px-3 py-2.5 text-left text-xs text-gray-500">Nog geen contraindicaties</p>
      } @else {
        <table class="w-full table-fixed border-collapse text-xs">
          <tbody>
            @for (item of contraindications(); track item.id) {
              <tr class="group border-t border-gray-100 first:border-t-0 hover:bg-gray-50">
                <td class="w-full max-w-0 truncate py-1.5 pr-1.5 pl-3 font-medium text-gray-900">{{ item.description }}</td>
                <td class="w-16 truncate py-1.5 pr-1.5 whitespace-nowrap text-gray-500 tabular-nums">{{ item.id }}</td>
                <td class="w-8 py-1.5">
                  <app-delete-button
                    [ariaLabel]="item.description + ' verwijderen'"
                    (delete)="store.remove(item.id)"
                  />
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <app-icpc-contraindication-modal [open]="modalOpen()" (close)="modalOpen.set(false)" />
  `,
})
export class IcpcContraindicationField {
  protected readonly store = inject(IcpcContraindicationStore);

  protected readonly contraindications = this.store.contraindications;
  protected readonly modalOpen = signal(false);

  /** Called from the sidebar's title-bar add button. */
  openAdd() {
    this.modalOpen.set(true);
  }
}
