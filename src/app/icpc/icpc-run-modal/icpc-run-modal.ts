import { Component, ElementRef, computed, inject, input, output, resource, signal, viewChild } from '@angular/core';
import { LucideSearch, LucideStethoscope, LucideX } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { IcpcContraindication } from '../icpc.model';
import { IcpcRunHistoryStore } from '../icpc-run-history.store';
import { IcpcSearchService } from '../icpc-search.service';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

@Component({
  selector: 'app-icpc-run-modal',
  imports: [Modal, LucideSearch, LucideStethoscope, LucideX],
  template: `
    <app-modal [open]="open()" title="ICPC-code selecteren" (close)="close.emit()">
      <svg modalIcon lucideStethoscope [size]="20"></svg>

      <label class="mb-3 block">
        <span class="sr-only">ICPC-code zoeken</span>
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
            class="w-full rounded-lg border border-gray-300 py-2 pr-8 pl-8 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
          />
          @if (searchTerm()) {
            <button
              type="button"
              class="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Zoekopdracht wissen"
              (click)="clearSearch()"
            >
              <svg lucideX [size]="14"></svg>
            </button>
          }
        </div>
      </label>

      @if (!isSearching()) {
        @if (history().length) {
          <label>Recent gebruikt</label>
          <ul class="divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
            @for (item of history(); track item.id) {
              <li>
                <button
                  type="button"
                  class="flex w-full items-center gap-2 p-2 text-left text-sm font-normal hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  (click)="choose(item)"
                >
                  <span class="min-w-0 flex-1 truncate font-medium text-foreground">{{ item.description }}</span>
                  <span class="w-16 shrink-0 truncate text-left text-muted tabular-nums">{{ item.id }}</span>
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="px-1 py-2 text-sm text-muted">Typ minimaal 2 tekens om te zoeken</p>
        }
      } @else {
        <ul class="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
          @switch (searchResource.status()) {
            @case ('loading') {
              <li class="px-3 py-4 text-center text-sm text-muted">Zoeken...</li>
            }
            @case ('error') {
              <li class="px-3 py-4 text-center text-sm text-red-600">Resultaten konden niet worden geladen</li>
            }
            @default {
              @if (searchResource.value(); as results) {
                @if (results.length === 0) {
                  <li class="px-3 py-4 text-center text-sm text-muted">Geen resultaten gevonden.</li>
                } @else {
                  @for (result of results; track result.id) {
                    <li>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 p-2 text-left text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        (click)="choose(result)"
                      >
                        <span class="min-w-0 flex-1 truncate font-medium text-foreground">{{ result.description }}</span>
                        <span class="w-16 shrink-0 truncate text-left text-muted tabular-nums">{{ result.id }}</span>
                      </button>
                    </li>
                  }
                }
              }
            }
          }
        </ul>
      }
    </app-modal>
  `,
})
export class IcpcRunModal {
  private readonly icpcSearch = inject(IcpcSearchService);
  private readonly historyStore = inject(IcpcRunHistoryStore);

  open = input.required<boolean>();
  close = output<void>();
  select = output<string>();

  protected readonly history = this.historyStore.history;
  protected readonly searchTerm = signal('');
  protected readonly debouncedSearchTerm = signal('');
  protected readonly isSearching = computed(() => this.debouncedSearchTerm().trim().length >= MIN_SEARCH_LENGTH);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly searchResource = resource({
    params: () => {
      const term = this.debouncedSearchTerm().trim();
      return term.length >= MIN_SEARCH_LENGTH ? term : undefined;
    },
    loader: ({ params: term }) => this.icpcSearch.search(term),
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

  protected choose(item: IcpcContraindication) {
    this.historyStore.add(item);
    this.select.emit(item.id);
  }
}
