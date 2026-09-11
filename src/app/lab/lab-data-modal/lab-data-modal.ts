import { Component, ElementRef, computed, effect, inject, input, output, resource, signal, viewChild } from '@angular/core';
import { FormField, form, min, required } from '@angular/forms/signals';
import { LucideFlaskConical, LucideSearch, LucideX } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { LabCode } from '../lab-code.model';
import { LabCodeSearchService } from '../lab-code-search.service';
import { LabDataStore } from '../lab-data.store';
import { LabDatum } from '../lab-datum.model';

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 1;

interface LabEntryModel {
  daysAgo: number;
  value: number | null;
}

@Component({
  selector: 'app-lab-data-modal',
  imports: [Modal, FormField, LucideFlaskConical, LucideSearch, LucideX],
  template: `
    <app-modal
      [open]="open()"
      [title]="editing() ? 'Laboratoriumgegevens bewerken' : 'Laboratoriumgegevens toevoegen'"
      (close)="handleClose()"
    >
      <svg modalIcon lucideFlaskConical [size]="20"></svg>

      @if (showForm()) {
        <label class="mb-3 block">
          Meting
          <div class="relative">
            <input
              type="text"
              readonly
              class="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-8 pl-3 text-sm text-foreground"
              [value]="measuredLabel()"
            />
            @if (!editing()) {
              <button
                type="button"
                class="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Andere labcode kiezen"
                (click)="deselectCode()"
              >
                <svg lucideX [size]="14"></svg>
              </button>
            }
          </div>
        </label>

        <form class="flex flex-col gap-3" (submit)="onSubmit($event)">
          <label>
            Dagen geleden
            <input
              #daysAgoInput
              type="number"
              step="1"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              [formField]="entryForm.daysAgo"
            />
            @if (entryForm.daysAgo().touched() && entryForm.daysAgo().invalid()) {
              @for (error of entryForm.daysAgo().errors(); track error) {
                <span class="mt-1 block text-xs text-red-600">{{ error.message }}</span>
              }
            }
          </label>

          <label>
            Waarde
            @if (measuredUnit(); as unit) {
              <span class="font-normal text-muted">({{ unit }})</span>
            }
            <input
              type="number"
              step="any"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              [formField]="entryForm.value"
            />
            @if (entryForm.value().touched() && entryForm.value().invalid()) {
              @for (error of entryForm.value().errors(); track error) {
                <span class="mt-1 block text-xs text-red-600">{{ error.message }}</span>
              }
            }
          </label>

          @if (store.actionError(); as error) {
            <p class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {{ error }}
            </p>
          }

          <div class="mt-1 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              (click)="editing() ? handleClose() : deselectCode()"
            >
              {{ editing() ? 'Annuleren' : 'Terug' }}
            </button>
            <button type="submit" class="primary px-3 py-2 text-sm" [disabled]="entryForm().invalid() || submitting()">
              {{ submitting() ? 'Opslaan…' : 'Opslaan' }}
            </button>
          </div>
        </form>
      } @else {
        <label class="mb-3 block">
          <span class="sr-only">Labcode zoeken</span>
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

        <ul class="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
          @switch (searchResource.status()) {
            @case ('loading') {
              <li class="px-3 py-4 text-center text-sm text-muted">Zoeken...</li>
            }
            @case ('error') {
              <li class="px-3 py-4 text-center text-sm text-red-600">Resultaten konden niet worden geladen</li>
            }
            @case ('idle') {
              <li class="px-3 py-4 text-center text-sm text-muted">Typ minimaal 1 teken om te zoeken</li>
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
                        (click)="selectCode(result)"
                      >
                        <span class="min-w-0 flex-1 truncate font-medium text-foreground">
                          {{ result.omschrijving }}
                        </span>
                        <span class="w-20 shrink-0 truncate text-left text-muted tabular-nums">
                          {{ result.memo }}
                        </span>
                        @if (result.unit) {
                          <span class="w-20 shrink-0 truncate text-left text-muted tabular-nums">
                            {{ result.unit }}
                          </span>
                        }
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
export class LabDataModal {
  private readonly labCodeSearch = inject(LabCodeSearchService);
  protected readonly store = inject(LabDataStore);

  open = input.required<boolean>();
  editing = input<LabDatum | null>(null);
  close = output<void>();

  protected readonly searchTerm = signal('');
  protected readonly debouncedSearchTerm = signal('');
  protected readonly selectedCode = signal<LabCode | null>(null);
  protected readonly submitting = signal(false);

  protected readonly showForm = computed(() => this.editing() !== null || this.selectedCode() !== null);
  protected readonly measuredLabel = computed(() => {
    const editing = this.editing();
    if (editing) {
      return this.labCodeSearch.describe(editing.labCodeId);
    }
    const code = this.selectedCode();
    return code ? code.omschrijving || code.memo : '';
  });
  protected readonly measuredUnit = computed(() => {
    const editing = this.editing();
    if (editing) {
      return this.labCodeSearch.unitFor(editing.labCodeId);
    }
    return this.selectedCode()?.unit ?? '';
  });

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly daysAgoInput = viewChild<ElementRef<HTMLInputElement>>('daysAgoInput');
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly entryModel = signal<LabEntryModel>({ daysAgo: 0, value: null });
  protected readonly entryForm = form(this.entryModel, (schemaPath) => {
    min(schemaPath.daysAgo, 0, { message: 'Dagen geleden mag niet negatief zijn' });
    required(schemaPath.value, { message: 'Waarde is verplicht' });
  });

  protected readonly searchResource = resource({
    params: () => {
      const term = this.debouncedSearchTerm().trim();
      return term.length >= MIN_SEARCH_LENGTH ? term : undefined;
    },
    loader: ({ params: term }) => this.labCodeSearch.search(term),
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }
      const editing = this.editing();
      if (editing) {
        this.entryModel.set({ daysAgo: editing.daysAgo, value: editing.value });
      }
    });

    // The form step replaces the search step inside the same open modal, so Modal's own
    // on-open autofocus (which already ran for the search input) never fires again here.
    effect(() => {
      if (this.showForm()) {
        this.daysAgoInput()?.nativeElement.focus();
      }
    });
  }

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

  protected selectCode(code: LabCode) {
    this.selectedCode.set(code);
    this.entryModel.set({ daysAgo: 0, value: null });
  }

  protected deselectCode() {
    this.selectedCode.set(null);
  }

  protected async onSubmit(event: Event) {
    event.preventDefault();

    if (this.entryForm().invalid()) {
      return;
    }

    const values = this.entryModel();
    const editing = this.editing();

    this.submitting.set(true);
    const success = editing
      ? await this.store.update(editing.id, values.daysAgo, values.value as number)
      : await this.store.add(this.selectedCode()!.id, values.daysAgo, values.value as number);
    this.submitting.set(false);

    if (!success) {
      return;
    }

    if (editing) {
      this.close.emit();
    } else {
      this.selectedCode.set(null);
      this.clearSearch();
    }
  }

  protected handleClose() {
    if (!this.editing() && this.selectedCode()) {
      this.deselectCode();
      return;
    }
    this.close.emit();
  }
}
