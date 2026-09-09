import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import {
  LucideGripVertical,
  LucidePencil,
  LucidePlus,
  LucideSearch,
  LucideTarget,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { TargetEditModal } from '../target-edit-modal/target-edit-modal';
import { Target } from '../target.model';
import { TargetStore } from '../target.store';

@Component({
  selector: 'app-targets-modal',
  imports: [
    Modal,
    DragDropModule,
    LucideGripVertical,
    LucidePencil,
    LucidePlus,
    LucideSearch,
    LucideTarget,
    LucideTrash2,
    LucideX,
    TargetEditModal,
  ],
  template: `
    <app-modal [open]="open()" title="Targets" maxWidth="max-w-4xl" (close)="close.emit()">
      <svg modalIcon lucideTarget [size]="20"></svg>

      @if (targetStore.actionError(); as error) {
        <div class="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {{ error }}
        </div>
      }

      <div class="mb-3 flex justify-between gap-3">
        <div class="flex-1">
          <span class="sr-only">Targets zoeken</span>
          <div class="relative">
            <svg
              lucideSearch
              [size]="16"
              class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400"
            ></svg>
            <input
              #searchInput
              type="search"
              autofocus
              placeholder="Targets zoeken"
              class="w-full rounded-lg border border-gray-300 py-2 pr-8 pl-8 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              [value]="searchTerm()"
              (input)="onSearchInput($event)"
            />
            @if (searchTerm()) {
              <button
                type="button"
                class="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                aria-label="Zoekopdracht wissen"
                (click)="clearSearch()"
              >
                <svg lucideX [size]="14"></svg>
              </button>
            }
          </div>
        </div>

        <button type="button" class="primary flex items-center gap-1.5 px-3 py-2 text-sm" (click)="creatingTarget.set(true)">
          <svg lucidePlus [size]="16"></svg>
          Target toevoegen
        </button>
      </div>

      @if (targetStore.loadError(); as error) {
        <div
          class="mb-3 flex items-center justify-between rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          <span>{{ error }}</span>
          <button
            type="button"
            class="rounded-lg border border-red-300 px-2 py-1 text-xs font-medium hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            (click)="targetStore.loadTargets()"
          >
            Opnieuw proberen
          </button>
        </div>
      }

      <div class="overflow-hidden rounded-lg border border-gray-200">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 tracking-wide text-gray-500">
            <tr>
              <th class="w-8 px-3 py-2"><span class="sr-only">Herordenen</span></th>
              <th class="w-6 py-2"><span class="sr-only">Actief</span></th>
              <th class="w-35 pl-1.5 pr-3 py-2">Label</th>
              <th class="px-3 py-2">URL</th>
              <th class="w-16 px-3 py-2"><span class="sr-only">Acties</span></th>
            </tr>
          </thead>
          <tbody
            cdkDropList
            cdkDropListLockAxis="y"
            [cdkDropListDisabled]="isSearching()"
            (cdkDropListDropped)="onDrop($event)"
          >
            @if (targetStore.loading()) {
              <tr>
                <td colspan="5" class="px-3 py-6 text-center text-gray-500">Targets laden…</td>
              </tr>
            } @else {
            @for (target of filteredTargets(); track target.id) {
              <tr
                cdkDrag
                cdkDragLockAxis="y"
                [cdkDragDisabled]="isSearching()"
                class="border-t border-gray-100 first:border-t-0 hover:bg-gray-50"
              >
                <td
                  class="px-3 py-2"
                  cdkDragHandle
                  [class]="
                    isSearching() ? 'cursor-not-allowed text-gray-200' : 'cursor-grab text-gray-400 active:cursor-grabbing'
                  "
                >
                  <svg lucideGripVertical [size]="16" [attr.aria-label]="target.label + ' herordenen'"></svg>
                </td>
                <td class="py-2">
                  <div class="flex items-center justify-center">
                    <input
                      type="checkbox"
                      class="size-4 rounded-lg border-gray-300 text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      [checked]="target.active"
                      [attr.aria-label]="target.label + ' actief'"
                      (click)="onActiveClick($event, target.id)"
                    />
                  </div>
                </td>
                <td class="pl-1.5 pr-3 py-2 text-gray-900">{{ target.label }}</td>
                <td class="max-w-0 truncate px-3 py-2 text-gray-00">{{ target.url }}</td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      [attr.aria-label]="target.label + ' bewerken'"
                      (click)="editingTarget.set(target)"
                    >
                      <svg lucidePencil [size]="16"></svg>
                    </button>
                    <button
                      type="button"
                      class="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                      [attr.aria-label]="target.label + ' verwijderen'"
                      (click)="targetStore.delete(target.id)"
                    >
                      <svg lucideTrash2 [size]="16"></svg>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-3 py-6 text-center text-gray-500">
                  {{ isSearching() ? 'Geen targets gevonden voor uw zoekopdracht.' : 'Nog geen targets.' }}
                </td>
              </tr>
            }
            }
          </tbody>
        </table>
      </div>
    </app-modal>

    <app-target-edit-modal
      [open]="editingTarget() !== null || creatingTarget()"
      [target]="editingTarget()"
      (close)="closeEditModal()"
    />
  `,
})
export class TargetsModal {
  protected readonly targetStore = inject(TargetStore);

  open = input.required<boolean>();
  close = output<void>();

  protected readonly editingTarget = signal<Target | null>(null);
  protected readonly creatingTarget = signal(false);

  protected readonly searchTerm = signal('');
  protected readonly isSearching = computed(() => this.searchTerm().trim().length > 0);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly filteredTargets = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.targetStore.targets();
    }
    return this.targetStore
      .targets()
      .filter((target) => target.label.toLowerCase().includes(term) || target.url.toLowerCase().includes(term));
  });

  protected onSearchInput(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch() {
    this.searchTerm.set('');
    this.searchInput()?.nativeElement.focus();
  }

  protected closeEditModal() {
    this.editingTarget.set(null);
    this.creatingTarget.set(false);
  }

  protected onDrop(event: CdkDragDrop<unknown>) {
    this.targetStore.reorder(event.previousIndex, event.currentIndex);
  }

  // Prevent the native checkbox toggle so an already-active target's box can't be
  // unchecked by the browser before Angular gets a chance to re-assert `checked`.
  protected onActiveClick(event: Event, id: string) {
    event.preventDefault();
    this.targetStore.setActive(id);
  }
}
