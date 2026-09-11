import { Component, input, output } from '@angular/core';
import { LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-section-header',
  imports: [LucidePlus],
  template: `
    <div class="flex items-center justify-between">
      <label>{{ label() }}</label>
      @if (addLabel(); as addLabel) {
        <button
          type="button"
          class="flex size-6 items-center justify-center rounded-md text-muted hover:bg-gray-100 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          [attr.aria-label]="addLabel"
          (click)="add.emit()"
        >
          <svg lucidePlus [size]="16"></svg>
        </button>
      }
    </div>
  `,
})
export class SectionHeader {
  label = input.required<string>();
  addLabel = input<string | null>(null);
  add = output<void>();
}
