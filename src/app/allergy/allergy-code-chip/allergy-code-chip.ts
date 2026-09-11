import { Component, computed, input } from '@angular/core';

interface AllergyCodeTypeInfo {
  letter: string;
  label: string;
  colorClass: string;
}

const ALLERGY_CODE_TYPES: Record<number, AllergyCodeTypeInfo> = {
  1: { letter: 'G', label: 'Generiek', colorClass: 'bg-green-100/70 text-green-700' },
  2: { letter: 'S', label: 'Stofnaam', colorClass: 'bg-blue-100/70 text-primary-hover' },
  3: { letter: 'R', label: 'Toedieningsroute', colorClass: 'bg-fuchsia-100/70 text-fuchsia-700' },
};

@Component({
  selector: 'app-allergy-code-chip',
  template: `
    @if (info(); as info) {
      <span
        role="img"
        [attr.aria-label]="info.label"
        [title]="info.label"
        class="inline-flex size-5 shrink-0 items-center justify-center rounded text-xs"
        [class]="info.colorClass"
        >{{ info.letter }}</span
      >
    }
  `,
})
export class AllergyCodeChip {
  type = input<number | undefined>();

  protected readonly info = computed(() => {
    const type = this.type();
    return type !== undefined ? ALLERGY_CODE_TYPES[type] : undefined;
  });
}
