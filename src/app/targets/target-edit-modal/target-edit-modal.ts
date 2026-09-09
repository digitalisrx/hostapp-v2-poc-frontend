import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { LucideTarget } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { Target } from '../target.model';
import { TargetStore } from '../target.store';

interface TargetEditModel {
  label: string;
  url: string;
}

@Component({
  selector: 'app-target-edit-modal',
  imports: [Modal, FormField, LucideTarget],
  template: `
    <app-modal [open]="open()" [title]="target() ? 'Target bewerken' : 'Target toevoegen'" (close)="handleClose()">
      <svg modalIcon lucideTarget [size]="20"></svg>

      <form class="flex flex-col gap-3" (submit)="onSubmit($event)">
        <label>
          Label
          <input
            type="text"
            autofocus
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [formField]="editForm.label"
          />
          @if (editForm.label().touched() && editForm.label().invalid()) {
            @for (error of editForm.label().errors(); track error) {
              <span class="mt-1 block text-xs text-red-600">{{ error.message }}</span>
            }
          }
        </label>

        <label>
          URL
          <input
            type="url"
            placeholder="https://…"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [formField]="editForm.url"
          />
          @if (editForm.url().touched() && editForm.url().invalid()) {
            @for (error of editForm.url().errors(); track error) {
              <span class="mt-1 block text-xs text-red-600">{{ error.message }}</span>
            }
          }
        </label>

        @if (submitError(); as error) {
          <p class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {{ error }}
          </p>
        }

        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            (click)="handleClose()"
          >
            Annuleren
          </button>
          <button type="submit" class="primary px-3 py-2 text-sm" [disabled]="editForm().invalid() || submitting()">
            {{ submitting() ? 'Opslaan…' : 'Opslaan' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class TargetEditModal {
  private readonly targetStore = inject(TargetStore);

  open = input.required<boolean>();
  target = input<Target | null>(null);
  close = output<void>();

  protected readonly editModel = signal<TargetEditModel>({ label: '', url: '' });
  protected readonly editForm = form(this.editModel, (schemaPath) => {
    required(schemaPath.label, { message: 'Label is verplicht' });
    required(schemaPath.url, { message: 'URL is verplicht' });
  });
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }

      const target = this.target();
      this.editModel.set(target ? { label: target.label, url: target.url } : { label: '', url: '' });
      this.submitError.set(null);
    });
  }

  protected async onSubmit(event: Event) {
    event.preventDefault();

    if (this.editForm().invalid()) {
      return;
    }

    const values = this.editModel();
    const target = this.target();

    this.submitting.set(true);
    this.submitError.set(null);

    try {
      if (target) {
        await this.targetStore.update(target.id, values);
      } else {
        await this.targetStore.create(values);
      }
      this.close.emit();
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Target opslaan mislukt.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected handleClose() {
    this.close.emit();
  }
}
