import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { LucideGripHorizontal, LucideGripVertical } from '@lucide/angular';
import { MAX_SPLIT_SCREEN_PERCENT, MIN_SPLIT_SCREEN_PERCENT, SettingsStore } from '../settings/settings.store';
import { Target } from '../targets/target.model';

export interface SplitScreenPane {
  target: Target;
  iframeUrl: SafeResourceUrl | null;
  errorMessage: string | null;
}

const DEFAULT_SPLIT_PERCENT = 50;

@Component({
  selector: 'app-split-screen-view',
  imports: [LucideGripHorizontal, LucideGripVertical],
  host: { class: 'flex h-full min-w-0 flex-1' },
  template: `
    <div
      #container
      class="flex h-full w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-200"
      [class]="containerOrientationClass()"
    >
      @if (panes().length < 2) {
        <div class="flex h-full w-full items-center justify-center text-sm text-muted">
          Voeg minstens twee targets toe om deze weergave te gebruiken.
        </div>
      } @else {
        <div class="flex min-h-0 min-w-0 flex-col overflow-hidden" [style.flex]="firstPaneFlex()">
          <p class="truncate border-b border-gray-200 bg-white px-3 py-1 text-xs text-muted">
            {{ panes()[0].target.label }}
          </p>
          @if (panes()[0].errorMessage; as error) {
            <div class="flex h-full w-full items-center justify-center p-3 text-center text-sm text-red-800">
              {{ error }}
            </div>
          } @else if (panes()[0].iframeUrl; as url) {
            <iframe [src]="url" class="h-full w-full" [title]="panes()[0].target.label"></iframe>
          } @else {
            <div class="flex h-full w-full items-center justify-center text-sm text-muted">
              Start Prescriptor/CreateRx om hier de resultaten te bekijken.
            </div>
          }
        </div>

        <div
          class="flex shrink-0 touch-none select-none items-center justify-center"
          [class]="dividerWrapperClass()"
          role="separator"
          [attr.aria-orientation]="orientation() === 'horizontal' ? 'vertical' : 'horizontal'"
          [attr.aria-label]="'Verdeling tussen ' + panes()[0].target.label + ' en ' + panes()[1].target.label"
          (pointerdown)="onDividerPointerDown($event)"
          (pointermove)="onDividerPointerMove($event)"
          (pointerup)="onDividerPointerUp($event)"
          (dblclick)="onDividerDoubleClick()"
        >
          @if (orientation() === 'horizontal') {
            <svg lucideGripVertical [size]="16" class="shrink-0 text-muted"></svg>
          } @else {
            <svg lucideGripHorizontal [size]="16" class="shrink-0 text-muted"></svg>
          }
        </div>

        <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <p class="truncate border-b border-gray-200 bg-white px-3 py-1 text-xs text-muted">
            {{ panes()[1].target.label }}
          </p>
          @if (panes()[1].errorMessage; as error) {
            <div class="flex h-full w-full items-center justify-center p-3 text-center text-sm text-red-800">
              {{ error }}
            </div>
          } @else if (panes()[1].iframeUrl; as url) {
            <iframe [src]="url" class="h-full w-full" [title]="panes()[1].target.label"></iframe>
          } @else {
            <div class="flex h-full w-full items-center justify-center text-sm text-muted">
              Start Prescriptor/CreateRx om hier de resultaten te bekijken.
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SplitScreenView {
  private readonly settingsStore = inject(SettingsStore);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  panes = input.required<SplitScreenPane[]>();

  private readonly dragging = signal(false);
  private readonly dragPercent = signal<number | null>(null);

  protected readonly orientation = computed(() => this.settingsStore.splitScreenOrientation());
  protected readonly containerOrientationClass = computed(() =>
    this.orientation() === 'horizontal' ? 'flex-row' : 'flex-col',
  );
  protected readonly dividerWrapperClass = computed(() =>
    this.orientation() === 'horizontal'
      ? 'h-full w-[11px] cursor-col-resize bg-gradient-tl from-gray-50 to-gray-200'
      : 'w-full h-[11px] cursor-row-resize',
  );

  private readonly storedPercent = computed(() =>
    this.orientation() === 'horizontal'
      ? this.settingsStore.splitScreenPositionHorizontal()
      : this.settingsStore.splitScreenPositionVertical(),
  );
  private readonly currentPercent = computed(() => this.dragPercent() ?? this.storedPercent());
  protected readonly firstPaneFlex = computed(() => `0 0 ${this.currentPercent()}%`);

  protected onDividerPointerDown(event: PointerEvent) {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging.set(true);
    this.updateDragPercent(event);
  }

  protected onDividerPointerMove(event: PointerEvent) {
    if (!this.dragging()) {
      return;
    }
    this.updateDragPercent(event);
  }

  protected onDividerPointerUp(event: PointerEvent) {
    if (!this.dragging()) {
      return;
    }
    this.dragging.set(false);
    const percent = this.dragPercent();
    if (percent !== null) {
      this.settingsStore.setSplitScreenPosition(this.orientation(), percent);
    }
    this.dragPercent.set(null);
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  }

  protected onDividerDoubleClick() {
    this.dragPercent.set(null);
    this.settingsStore.setSplitScreenPosition(this.orientation(), DEFAULT_SPLIT_PERCENT);
  }

  private updateDragPercent(event: PointerEvent) {
    const rect = this.container().nativeElement.getBoundingClientRect();
    const raw =
      this.orientation() === 'horizontal'
        ? ((event.clientX - rect.left) / rect.width) * 100
        : ((event.clientY - rect.top) / rect.height) * 100;
    this.dragPercent.set(Math.min(MAX_SPLIT_SCREEN_PERCENT, Math.max(MIN_SPLIT_SCREEN_PERCENT, raw)));
  }
}
