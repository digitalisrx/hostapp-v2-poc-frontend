import { Component, input, output } from '@angular/core';
import { LucideX } from '@lucide/angular';

@Component({
  selector: 'app-delete-button',
  imports: [LucideX],
  template: `
    <button
      type="button"
      class="flex justify-center items-center shrink-0 rounded-md size-6 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
      [attr.aria-label]="ariaLabel()"
      (click)="onClick($event)"
    >
      <svg lucideX [size]="16"></svg>
    </button>
  `,
})
export class DeleteButton {
  ariaLabel = input.required<string>();
  delete = output<void>();

  protected onClick(event: Event) {
    event.stopPropagation();
    this.delete.emit();
  }
}
