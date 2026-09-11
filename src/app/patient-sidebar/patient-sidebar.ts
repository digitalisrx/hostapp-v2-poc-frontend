import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  LucideCheck,
  LucideChevronUp,
  LucideList,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePlay,
  LucideRotateCw,
} from '@lucide/angular';
import { AdviceField } from '../advice/advice-field/advice-field';
import { AllergyField } from '../allergy/allergy-field/allergy-field';
import { GstandaardContraindicationField } from '../gstandaard/gstandaard-contraindication-field/gstandaard-contraindication-field';
import { IcpcContraindicationField } from '../icpc/icpc-contraindication-field/icpc-contraindication-field';
import { IcpcRunModal } from '../icpc/icpc-run-modal/icpc-run-modal';
import { LabDataField } from '../lab/lab-data-field/lab-data-field';
import { MedicationField } from '../medication/medication-field/medication-field';
import { Medication } from '../medication/medication.model';
import { PatientSelector } from '../patient/patient-selector/patient-selector';
import { PrescriptorPrescription, PrescriptorService, PrescriptorSessionType, toPrescriptorPrescription } from '../prescriptor.service';
import { SectionHeader } from '../shared/section-header/section-header';

const MIN_WIDTH = 240;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 400;
const COLLAPSED_WIDTH = 48;
const WIDTH_STORAGE_KEY = 'app-patient-sidebar-width';
const KEYBOARD_STEP = 16;
const KEYBOARD_STEP_LARGE = 48;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

@Component({
  selector: 'app-patient-sidebar',
  imports: [
    LucideCheck,
    LucideList,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucidePlay,
    LucideRotateCw,
    LucideChevronUp,
    AdviceField,
    AllergyField,
    GstandaardContraindicationField,
    IcpcContraindicationField,
    IcpcRunModal,
    LabDataField,
    MedicationField,
    PatientSelector,
    SectionHeader,
  ],
  host: { class: 'flex h-full', '(document:click)': 'closeModeMenu()' },
  template: `
    <aside
      class="relative flex h-full flex-col border-r border-gray-200 bg-white"
      [class.overflow-hidden]="collapsed()"
      [style.width.px]="collapsed() ? COLLAPSED_WIDTH : width()"
    >
      <div
        class="flex items-center justify-between border-b border-gray-200 px-3 py-2"
        [class.!px-2]="collapsed()"
      >
        @if (!collapsed()) {
          <span class="header-text">Patiëntinformatie</span>
        }
        <button
          type="button"
          class="flex justify-center items-center size-9 ml-auto rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          [attr.aria-expanded]="!collapsed()"
          [attr.aria-label]="collapsed() ? 'Zijbalk uitklappen' : 'Zijbalk inklappen'"
          (click)="toggleCollapsed()"
        >
          @if (collapsed()) {
            <svg lucidePanelLeftOpen [size]="18"></svg>
          } @else {
            <svg lucidePanelLeftClose [size]="18"></svg>
          }
        </button>
      </div>

      <div class="flex flex-1 flex-col gap-3 overflow-y-auto p-3 pt-2.5">
        @if (!collapsed()) {
          <div>
            <label>Patiënt</label>
            <app-patient-selector />
          </div>

          <div>
            <app-section-header
              label="ICPC contraindicaties"
              addLabel="ICPC contraindicatie toevoegen"
              (add)="icpcField.openAdd()"
            />
            <app-icpc-contraindication-field #icpcField />
          </div>

          <div>
            <app-section-header
              label="G-Standaard contraindicaties"
              addLabel="G-Standaard contraindicatie toevoegen"
              (add)="gstandaardField.openAdd()"
            />
            <app-gstandaard-contraindication-field #gstandaardField />
          </div>

          <div>
            <app-section-header
              label="Allergieën"
              addLabel="Allergie toevoegen"
              (add)="allergyField.openAdd()"
            />
            <app-allergy-field #allergyField />
          </div>

          <div>
            <app-section-header
              label="Laboratoriumgegevens"
              addLabel="Labwaarde toevoegen"
              (add)="labDataField.openAdd()"
            />
            <app-lab-data-field #labDataField />
          </div>

          <div>
            <div class="flex items-center justify-between">
              <label>Medicatie</label>
              <button
                type="button"
                class="flex size-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                aria-label="Medicatie details bekijken"
                (click)="medicationField.openDetails()"
              >
                <svg lucideList [size]="14"></svg>
              </button>
            </div>
            <app-medication-field #medicationField (editPrescription)="onEditPrescription($event)" />
          </div>

          <div>
            <label>Advies</label>
            <app-advice-field />
          </div>
        }
      </div>

      @if (!collapsed()) {
        <div class="relative flex gap-0 border-t border-gray-200 p-3">
          <button
            type="button"
            class="primary flex flex-1 items-center justify-center gap-1.5 rounded-r-none px-3 py-2 text-sm"
            (click)="runMainAction()"
          >
            @if (activeSessionType() === selectedMode()) {
              <svg lucideRotateCw [size]="16"></svg>
            } @else {
              <svg lucidePlay [size]="16"></svg>
            }
            {{ selectedMode() === 'formulary' ? 'Prescriptor' : 'CreateRx' }}
          </button>

          <button
            type="button"
            class="flex items-center justify-center rounded-lg rounded-l-none border border-gray-300 px-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [attr.aria-expanded]="modeMenuOpen()"
            aria-haspopup="true"
            aria-label="Modus kiezen"
            (click)="toggleModeMenu($event)"
          >
            <svg lucideChevronUp [size]="18"></svg>
          </button>

          @if (modeMenuOpen()) {
            <div
              class="absolute right-2 bottom-full left-2 overflow-hidden rounded-lg border border-gray-200 bg-white text-sm shadow-lg"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                [attr.aria-current]="selectedMode() === 'formulary' ? 'true' : null"
                (click)="selectMode('formulary', $event)"
              >
                Prescriptor
                @if (selectedMode() === 'formulary') {
                  <svg lucideCheck [size]="16" class="text-blue-600"></svg>
                }
              </button>
              <button
                type="button"
                class="flex w-full items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-left hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                [attr.aria-current]="selectedMode() === 'create-rx' ? 'true' : null"
                (click)="selectMode('create-rx', $event)"
              >
                CreateRx
                @if (selectedMode() === 'create-rx') {
                  <svg lucideCheck [size]="16" class="text-blue-600"></svg>
                }
              </button>
            </div>
          }
        </div>

        <div
          [class]="handleClass()"
          style="cursor: col-resize"
          role="separator"
          aria-orientation="vertical"
          aria-label="Grootte van zijbalk wijzigen"
          [attr.aria-valuenow]="width()"
          [attr.aria-valuemin]="MIN_WIDTH"
          [attr.aria-valuemax]="MAX_WIDTH"
          tabindex="0"
          (pointerdown)="onResizeStart($event)"
          (pointermove)="onResizeMove($event)"
          (pointerup)="onResizeEnd($event)"
          (pointercancel)="onResizeEnd($event)"
          (keydown)="onResizeKeydown($event)"
        ></div>
      } @else {
        <div class="border-t border-gray-200 p-2">
          <button
            type="button"
            class="primary flex w-full items-center justify-center px-2 py-2"
            [attr.aria-label]="(selectedMode() === 'formulary' ? 'Prescriptor' : 'CreateRx') + ' starten'"
            (click)="runMainAction()"
          >
            @if (activeSessionType() === selectedMode()) {
              <svg lucideRotateCw [size]="16"></svg>
            } @else {
              <svg lucidePlay [size]="16"></svg>
            }
          </button>
        </div>
      }

      <app-icpc-run-modal
        [open]="icpcRunModalOpen()"
        (close)="icpcRunModalOpen.set(false)"
        (select)="onIcpcSelected($event)"
      />
    </aside>
  `,
})
export class PatientSidebar {
  protected readonly prescriptorService = inject(PrescriptorService);

  protected readonly MIN_WIDTH = MIN_WIDTH;
  protected readonly MAX_WIDTH = MAX_WIDTH;
  protected readonly COLLAPSED_WIDTH = COLLAPSED_WIDTH;

  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly collapsed = signal(false);
  protected readonly width = signal(this.loadStoredWidth());
  protected readonly resizing = signal(false);
  protected readonly handleClass = computed(
    () =>
      `absolute top-0 right-[-3px] h-full w-1.5 touch-none ${
        this.resizing() ? 'bg-blue-400/30' : 'hover:bg-blue-400/30'
      }`,
  );

  activeSessionType = input<PrescriptorSessionType | null>(null);
  runSession = output<{
    type: PrescriptorSessionType;
    icpc?: string;
    prescription?: PrescriptorPrescription;
    editingMedicationId?: string;
  }>();

  protected readonly icpcRunModalOpen = signal(false);
  protected readonly selectedMode = signal<PrescriptorSessionType>('formulary');
  protected readonly modeMenuOpen = signal(false);

  constructor() {
    effect(() => {
      this.window?.localStorage.setItem(WIDTH_STORAGE_KEY, String(this.width()));
    });
  }

  private loadStoredWidth(): number {
    const stored = Number(this.window?.localStorage.getItem(WIDTH_STORAGE_KEY));
    return Number.isFinite(stored) && stored > 0 ? clamp(stored, MIN_WIDTH, MAX_WIDTH) : DEFAULT_WIDTH;
  }

  protected onIcpcSelected(icpc: string) {
    this.icpcRunModalOpen.set(false);
    this.runSession.emit({ type: 'formulary', icpc });
  }

  protected onEditPrescription(medication: Medication) {
    const prescription = toPrescriptorPrescription(medication);
    if (!prescription) {
      return;
    }
    this.runSession.emit({ type: 'create-rx', prescription, editingMedicationId: medication.id });
  }

  protected runMainAction() {
    if (this.selectedMode() === 'formulary') {
      this.icpcRunModalOpen.set(true);
    } else {
      this.runSession.emit({ type: 'create-rx' });
    }
  }

  protected toggleModeMenu(event: Event) {
    event.stopPropagation();
    this.modeMenuOpen.update((open) => !open);
  }

  protected selectMode(mode: PrescriptorSessionType, event: Event) {
    event.stopPropagation();
    this.selectedMode.set(mode);
    this.modeMenuOpen.set(false);
  }

  protected closeModeMenu() {
    this.modeMenuOpen.set(false);
  }

  protected toggleCollapsed() {
    this.collapsed.update((value) => !value);
  }

  protected onResizeStart(event: PointerEvent) {
    event.preventDefault();
    this.resizing.set(true);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onResizeMove(event: PointerEvent) {
    if (!this.resizing()) {
      return;
    }
    this.width.update((value) => clamp(value + event.movementX, MIN_WIDTH, MAX_WIDTH));
  }

  protected onResizeEnd(event: PointerEvent) {
    this.resizing.set(false);
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  }

  protected onResizeKeydown(event: KeyboardEvent) {
    const step = event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.width.update((value) => clamp(value - step, MIN_WIDTH, MAX_WIDTH));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.width.update((value) => clamp(value + step, MIN_WIDTH, MAX_WIDTH));
    }
  }
}
