import { Component, inject, signal } from '@angular/core';
import { LucidePlus, LucideX } from '@lucide/angular';
import { AllergyModal } from '../allergy-modal/allergy-modal';
import { AllergyStore } from '../allergy.store';

@Component({
  selector: 'app-allergy-field',
  imports: [LucidePlus, LucideX, AllergyModal],
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
        <p class="px-3 py-2.5 text-left text-xs text-gray-500">allergieën laden…</p>
      } @else if (!allergies().length) {
        <button
          type="button"
          class="flex w-full items-center gap-1.5 px-3 py-2.5 text-left text-xs !font-normal text-gray-500 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          (click)="modalOpen.set(true)"
        >
          <svg lucidePlus [size]="14"></svg>
          Allergieën toevoegen
        </button>
      } @else {
        <table class="w-full table-fixed border-collapse text-xs" (click)="modalOpen.set(true)">
          <tbody>
            @for (item of allergies(); track item.id) {
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

    <app-allergy-modal [open]="modalOpen()" (close)="modalOpen.set(false)" />
  `,
})
export class AllergyField {
  protected readonly store = inject(AllergyStore);

  protected readonly allergies = this.store.allergies;
  protected readonly modalOpen = signal(false);

  protected removeItem(id: string, event: Event) {
    event.stopPropagation();
    this.store.remove(id);
  }
}
