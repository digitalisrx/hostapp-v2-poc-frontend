import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { LucideUser } from '@lucide/angular';
import { Modal } from '../../shared/modal/modal';
import { AuthStore } from '../auth.store';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-modal',
  imports: [Modal, FormField, LucideUser],
  template: `
    <app-modal [open]="open()" title="Inloggen" maxWidth="max-w-md" (close)="handleClose()">
      <svg modalIcon lucideUser [size]="20"></svg>

      <form class="flex flex-col gap-3" (submit)="onSubmit($event)">
        <label>
          E-mailadres
          <input
            type="email"
            autofocus
            autocomplete="email"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [formField]="loginForm.email"
          />
          @if (loginForm.email().touched() && loginForm.email().invalid()) {
            @for (error of loginForm.email().errors(); track error) {
              <span class="mt-1 block text-xs text-red-600">{{ error.message }}</span>
            }
          }
        </label>

        <label>
          Wachtwoord
          <input
            type="password"
            autocomplete="current-password"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            [formField]="loginForm.password"
          />
          @if (loginForm.password().touched() && loginForm.password().invalid()) {
            @for (error of loginForm.password().errors(); track error) {
              <span class="mt-1 block text-xs text-red-600">{{ error.message }}</span>
            }
          }
        </label>

        @if (submitError(); as error) {
          <p class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {{ error }}
          </p>
        }

        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            (click)="handleClose()"
          >
            Annuleren
          </button>
          <button type="submit" class="primary px-3 py-2 text-sm" [disabled]="loginForm().invalid() || submitting()">
            {{ submitting() ? 'Inloggen…' : 'Inloggen' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class LoginModal {
  private readonly authStore = inject(AuthStore);

  open = input.required<boolean>();
  close = output<void>();

  protected readonly loginModel = signal<LoginModel>({ email: '', password: '' });
  protected readonly loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'E-mailadres is verplicht' });
    email(schemaPath.email, { message: 'Voer een geldig e-mailadres in' });
    required(schemaPath.password, { message: 'Wachtwoord is verplicht' });
  });
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }
      this.loginModel.set({ email: '', password: '' });
      this.submitError.set(null);
    });
  }

  protected async onSubmit(event: Event) {
    event.preventDefault();

    if (this.loginForm().invalid()) {
      return;
    }

    const values = this.loginModel();

    this.submitting.set(true);
    this.submitError.set(null);

    try {
      await this.authStore.login(values.email, values.password);
      this.close.emit();
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Inloggen mislukt.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected handleClose() {
    this.close.emit();
  }
}
