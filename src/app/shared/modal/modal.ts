import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, effect, inject, input, output, viewChild } from '@angular/core';
import { LucideX } from '@lucide/angular';

let nextModalId = 0;

@Component({
  selector: 'app-modal',
  imports: [LucideX],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/40"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4" (click)="close.emit()">
          <div
            #panel
            [class]="'flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl ' + maxWidth()"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="titleId"
            tabindex="-1"
            (click)="$event.stopPropagation()"
            (keydown.escape)="close.emit()"
            (keydown.tab)="onTab($event)"
          >
            <div class="flex items-center gap-1.5 border-b border-gray-200 p-2 pl-3">
              <span class="flex shrink-0 items-center justify-center [&>svg]:size-5">
                <ng-content select="[modalIcon]" />
              </span>
              <span [id]="titleId" class="flex-1 header-text">{{ title() }}</span>
              <button
                type="button"
                class="flex justify-center items-center size-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                aria-label="Dialoogvenster sluiten"
                (click)="close.emit()"
              >
                <svg lucideX [size]="20"></svg>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-4">
              <ng-content />
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class Modal {
  private readonly document = inject(DOCUMENT);

  open = input.required<boolean>();
  title = input('');
  maxWidth = input('max-w-2xl');
  close = output<void>();

  protected readonly titleId = `modal-title-${nextModalId++}`;
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.previouslyFocused = this.document.activeElement as HTMLElement | null;
        queueMicrotask(() => {
          const panel = this.panel()?.nativeElement;
          if (!panel) {
            return;
          }
          const autofocusTarget = panel.querySelector<HTMLElement>('[autofocus]');
          (autofocusTarget ?? panel).focus();
        });
      } else {
        this.previouslyFocused?.focus();
        this.previouslyFocused = null;
      }
    });
  }

  protected onTab(keyboardEvent: Event) {
    const event = keyboardEvent as KeyboardEvent;
    const panel = this.panel()?.nativeElement;
    if (!panel) {
      return;
    }

    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
