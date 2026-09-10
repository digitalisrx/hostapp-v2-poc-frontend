import { Component, ElementRef, inject, input, output, resource, signal, viewChild } from '@angular/core';
import { LucideCircleAlert, LucideSearch, LucideX } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { AllergyCodeChip } from '../allergy-code-chip/allergy-code-chip';
import { Allergy } from '../allergy.model';
import { AllergyStore } from '../allergy.store';
import { AllergySearchService } from '../allergy-search.service';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

@Component({
  selector: 'app-allergy-modal',
  imports: [Modal, AllergyCodeChip, LucideCircleAlert, LucideSearch, LucideX],
  template: `
    <app-modal [open]="open()" title="Allergieën toevoegen" (close)="close.emit()">
      <svg modalIcon lucideCircleAlert [size]="20"></svg>

      <label class="mb-3 block">
        <span class="sr-only">Allergieën zoeken</span>
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
            placeholder="Zoeken op code of omschrijving"
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
      </label>

      <ul class="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
        @switch (searchResource.status()) {
          @case ('loading') {
            <li class="px-3 py-4 text-center text-sm text-gray-500">Zoeken...</li>
          }
          @case ('error') {
            <li class="px-3 py-4 text-center text-sm text-red-600">Resultaten konden niet worden geladen</li>
          }
          @case ('idle') {
            <li class="px-3 py-4 text-center text-sm text-gray-500">Typ minimaal 2 tekens om te zoeken</li>
          }
          @default {
            @if (searchResource.value(); as results) {
              @if (results.length === 0) {
                <li class="px-3 py-4 text-center text-sm text-gray-500">Geen resultaten gevonden.</li>
              } @else {
                @for (result of results; track result.id) {
                  <li>
                    <div class="flex cursor-pointer items-center gap-2 p-2 text-sm hover:bg-gray-50" (click)="toggle(result)">
                      <input
                        type="checkbox"
                        class="size-4 shrink-0 rounded-lg border-gray-300 text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                        [checked]="isAdded(result.id)"
                      />
                      <app-allergy-code-chip [type]="result.type" />
                      <span class="min-w-0 flex-1 truncate font-medium text-gray-900">{{ result.description }}</span>
                      <span class="w-16 shrink-0 truncate font-normal text-left text-gray-500 tabular-nums">{{ result.id }}</span>
                    </div>
                  </li>
                }
              }
            }
          }
        }
      </ul>
    </app-modal>
  `,
})
export class AllergyModal {
  private readonly allergySearch = inject(AllergySearchService);
  private readonly store = inject(AllergyStore);

  open = input.required<boolean>();
  close = output<void>();

  protected readonly searchTerm = signal('');
  protected readonly debouncedSearchTerm = signal('');
  protected readonly added = this.store.allergies;

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly searchResource = resource({
    params: () => {
      const term = this.debouncedSearchTerm().trim();
      return term.length >= MIN_SEARCH_LENGTH ? term : undefined;
    },
    loader: ({ params: term }) => this.allergySearch.search(term),
  });

  protected onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.debouncedSearchTerm.set(value), SEARCH_DEBOUNCE_MS);
  }

  protected clearSearch() {
    clearTimeout(this.debounceTimer);
    this.searchTerm.set('');
    this.debouncedSearchTerm.set('');
    this.searchInput()?.nativeElement.focus();
  }

  protected isAdded(id: string): boolean {
    return this.added().some((item) => item.id === id);
  }

  protected toggle(item: Allergy) {
    if (this.isAdded(item.id)) {
      this.store.remove(item.id);
    } else {
      this.store.add(item);
    }
  }
}
