import { DOCUMENT } from '@angular/common';
import { Service, inject, signal } from '@angular/core';
import { AuthApiService, AuthSession, SsoOrganization } from './auth-api.service';

const EMAIL_CACHE_KEY = 'app-auth-email';

export interface AuthUser {
  userId: string;
  /** The address the user typed in — the backend session itself only knows a userId. */
  email: string | null;
  organizations: SsoOrganization[];
  selectedOrganizationId: string | null;
  /** False for an SSO account with no Prescriptor license key — nothing to select, the app uses fallback credentials. */
  hasPrescriptorLicenseKey: boolean;
}

@Service()
export class AuthStore {
  private readonly api = inject(AuthApiService);
  private readonly window = inject(DOCUMENT).defaultView;

  private readonly userState = signal<AuthUser | null>(null);
  private readonly sessionCheckedState = signal(false);

  readonly user = this.userState.asReadonly();
  /** False until the initial session check resolves — lets callers avoid acting on a not-yet-confirmed `user() === null`. */
  readonly sessionChecked = this.sessionCheckedState.asReadonly();

  constructor() {
    // Defer call to prevent circular depencency
    setTimeout(() => void this.checkSession(), 0);
  }

  /** Backend sessions are in-memory only, so check on load rather than trusting local state. */
  async checkSession() {
    const session = await this.api.getSession();
    this.applySession(session, this.loadCachedEmail());
    this.sessionCheckedState.set(true);

    if (session) {
      await this.autoSelectSingleOrganization(session);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const session = await this.api.login(email, password);
    this.applySession(session, email);
    this.window?.localStorage.setItem(EMAIL_CACHE_KEY, email);
    await this.autoSelectSingleOrganization(session);
  }

  async logout() {
    await this.api.logout();
    this.userState.set(null);
    this.window?.localStorage.removeItem(EMAIL_CACHE_KEY);
  }

  async selectOrganization(organizationId: string): Promise<void> {
    const session = await this.api.selectOrganization(organizationId);
    this.applySession(session, this.userState()?.email ?? null);
  }

  /** A single-org account has nothing to choose — pick it for them instead of making them open the modal. */
  private async autoSelectSingleOrganization(session: AuthSession) {
    if (session.selectedOrganizationId || !session.hasPrescriptorLicenseKey) {
      return;
    }
    const enabledOrganizations = session.organizations.filter((organization) => organization.enabled);
    if (enabledOrganizations.length === 1) {
      await this.selectOrganization(enabledOrganizations[0].id);
    }
  }

  private applySession(session: AuthSession | null, email: string | null) {
    this.userState.set(
      session
        ? {
            userId: session.userId,
            email,
            organizations: session.organizations,
            selectedOrganizationId: session.selectedOrganizationId,
            hasPrescriptorLicenseKey: session.hasPrescriptorLicenseKey,
          }
        : null,
    );
  }

  private loadCachedEmail(): string | null {
    return this.window?.localStorage.getItem(EMAIL_CACHE_KEY) ?? null;
  }
}
