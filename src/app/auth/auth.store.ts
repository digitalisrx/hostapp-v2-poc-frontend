import { DOCUMENT } from '@angular/common';
import { Service, inject, signal } from '@angular/core';

const STORAGE_KEY = 'app-auth-user';

export interface AuthUser {
  email: string;
}

@Service()
export class AuthStore {
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly userState = signal<AuthUser | null>(this.loadUser());

  readonly user = this.userState.asReadonly();

  // No backend authentication endpoint exists yet — any non-empty email/password
  // is accepted, and the email becomes the signed-in identity.
  async login(email: string, password: string): Promise<void> {
    void password;
    const user: AuthUser = { email };
    this.userState.set(user);
    this.window?.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  logout() {
    this.userState.set(null);
    this.window?.localStorage.removeItem(STORAGE_KEY);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = this.window?.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null && typeof parsed.email === 'string'
        ? (parsed as AuthUser)
        : null;
    } catch {
      return null;
    }
  }
}
