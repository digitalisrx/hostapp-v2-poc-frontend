import { Component, inject, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { LucideUser, LucideHatGlasses } from '@lucide/angular';
import { AuthStore } from '../auth.store';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-page',
  imports: [FormField, LucideUser, LucideHatGlasses],
  template: `
    <div class="flex h-screen w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      <div class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div class="flex justify-center items-center gap-1.5 mb-5">
        <span class="header-text !text-2xl"> Hostapp </span>
        <svg lucideHatGlasses [size]="25"></svg>
      </div>

        <form class="flex flex-col gap-3" (submit)="onSubmit($event)">
          <label>
            E-mailadres
            <input
              type="email"
              autofocus
              autocomplete="email"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
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
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              [formField]="loginForm.password"
            />
            @if (loginForm.password().touched() && loginForm.password().invalid()) {
              @for (error of loginForm.password().errors(); track error) {
                <span class="mt-1 block text-xs text-red-600">{{ error.message }}</span>
              }
            }
          </label>

          @if (submitError(); as error) {
            <p class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {{ error }}
            </p>
          }

          <div class="mt-2 flex items-center justify-end">
            <button type="submit" class="primary px-3 py-2 text-sm" [disabled]="loginForm().invalid() || submitting()">
              {{ submitting() ? 'Inloggen…' : 'Inloggen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly loginModel = signal<LoginModel>({ email: '', password: '' });
  protected readonly loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'E-mailadres is verplicht' });
    email(schemaPath.email, { message: 'Voer een geldig e-mailadres in' });
    required(schemaPath.password, { message: 'Wachtwoord is verplicht' });
  });
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

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
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Inloggen mislukt.');
    } finally {
      this.submitting.set(false);
    }
  }
}
