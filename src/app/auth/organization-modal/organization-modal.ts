import { Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideBuilding2 } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { AuthStore } from '../auth.store';

@Component({
  selector: 'app-organization-modal',
  imports: [Modal, LucideBuilding2],
  template: `
    <app-modal [open]="open()" title="Organisatie" (close)="close.emit()">
      <svg modalIcon lucideBuilding2 [size]="20"></svg>

      @if (actionError(); as error) {
        <div class="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {{ error }}
        </div>
      }

      <ul class="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 text-sm">
        @for (organization of organizations(); track organization.id) {
          <li>
            <div
              class="flex w-full cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50 has-disabled:cursor-not-allowed has-disabled:opacity-40 has-disabled:hover:bg-transparent"
              (click)="onCheckboxClick($event, organization.id)"
            >
              <input
                type="checkbox"
                class="size-4 shrink-0 rounded-lg border-gray-300 text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                [checked]="organization.id === selectedOrganizationId()"
                [disabled]="!organization.enabled || selecting() === organization.id"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate font-medium text-gray-900">{{ organization.name }}</span>
                @if (organization.his) {
                  <span class="block font-normal truncate text-gray-500">{{ organization.his }}</span>
                }
                @if (!organization.enabled) {
                  <span class="block text-gray-400">Uitgeschakeld</span>
                }
              </span>
              </div>
          </li>
        } @empty {
          <li class="px-3 py-4 text-center text-gray-500">Geen organisaties beschikbaar.</li>
        }
      </ul>
    </app-modal>
  `,
})
export class OrganizationModal {
  private readonly authStore = inject(AuthStore);

  open = input.required<boolean>();
  close = output<void>();

  protected readonly organizations = computed(() => this.authStore.user()?.organizations ?? []);
  protected readonly selectedOrganizationId = computed(() => this.authStore.user()?.selectedOrganizationId ?? null);

  protected readonly selecting = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  // Prevent the native checkbox toggle so the currently-selected org's box can't be
  // unchecked by the browser before Angular gets a chance to re-assert `checked`.
  protected onCheckboxClick(event: Event, id: string) {
    event.preventDefault();
    this.select(id);
  }

  protected async select(id: string) {
    this.selecting.set(id);
    this.actionError.set(null);

    try {
      await this.authStore.selectOrganization(id);
    } catch (error) {
      this.actionError.set(error instanceof Error ? error.message : 'Organisatie selecteren mislukt.');
    } finally {
      this.selecting.set(null);
    }
  }
}
