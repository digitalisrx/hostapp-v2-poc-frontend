import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SafeResourceUrl } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import {
  LucideBug,
  LucideBuilding2,
  LucideHatGlasses,
  LucideLogOut,
  LucideSettings,
  LucideTarget,
  LucideTriangleAlert,
} from '@lucide/angular';
import { AuthStore, AuthUser } from './auth/auth.store';
import { OrganizationModal } from './auth/organization-modal/organization-modal';
import { DebugModal } from './debug/debug-modal/debug-modal';
import { PatientSidebar } from './patient-sidebar/patient-sidebar';
import { PrescriptorPrescription, PrescriptorService, PrescriptorSessionType } from './prescriptor.service';
import { PrescriptorView } from './prescriptor-view/prescriptor-view';
import { SettingsModal } from './settings/settings-modal/settings-modal';
import { TargetsModal } from './targets/targets-modal/targets-modal';

@Component({
  imports: [
    RouterOutlet,
    PatientSidebar,
    PrescriptorView,
    DebugModal,
    OrganizationModal,
    SettingsModal,
    TargetsModal,
    LucideBug,
    LucideBuilding2,
    LucideHatGlasses,
    LucideLogOut,
    LucideSettings,
    LucideTarget,
    LucideTriangleAlert,
  ],
  selector: 'app-root',
  host: { class: 'flex h-screen w-full flex-col overflow-hidden', '(document:click)': 'closeAccountMenu()' },
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private prescriptorService = inject(PrescriptorService);
  private readonly router = inject(Router);
  protected readonly authStore = inject(AuthStore);

  protected readonly title = signal('hostapp-new');
  protected readonly iframeUrl = signal<SafeResourceUrl | null>(null);
  protected readonly sessionId = signal<string | null>(null);
  protected readonly activeSessionType = signal<PrescriptorSessionType | null>(null);
  /** Unlike activeSessionType, this isn't reset on failure — it's what the error message/iframe title label off of. */
  protected readonly lastSessionType = signal<PrescriptorSessionType | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly debugModalOpen = signal(false);
  protected readonly settingsModalOpen = signal(false);
  protected readonly targetsModalOpen = signal(false);
  protected readonly organizationModalOpen = signal(false);
  protected readonly accountMenuOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly isLoginPage = computed(() => this.currentUrl().startsWith('/login'));

  protected readonly organizationWarning = computed(() => {
    const user = this.authStore.user();
    if (!user || !user.hasPrescriptorLicenseKey) {
      return null;
    }
    if (!user.selectedOrganizationId) {
      return 'Geen organisatie geselecteerd.';
    }
    return null;
  });

  constructor() {
    effect(() => {
      if (!this.authStore.sessionChecked() || this.isLoginPage()) {
        return;
      }
      if (!this.authStore.user()) {
        this.router.navigateByUrl('/login');
      }
    });
  }

  async runSession(
    type: PrescriptorSessionType,
    icpc?: string,
    prescription?: PrescriptorPrescription,
    editingMedicationId?: string,
  ) {
    this.errorMessage.set(null);
    this.lastSessionType.set(type);

    try {
      const session = await this.prescriptorService.createSession(type, icpc, prescription, editingMedicationId);
      this.iframeUrl.set(session.iframeUrl);
      this.sessionId.set(session.sessionId);
      this.activeSessionType.set(type);
    } catch (error) {
      this.iframeUrl.set(null);
      this.sessionId.set(null);
      this.activeSessionType.set(null);
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Het starten van de Prescriptor-sessie is mislukt.',
      );
    }
  }

  protected toggleAccountMenu(event: Event) {
    event.stopPropagation();
    this.accountMenuOpen.update((open) => !open);
  }

  protected closeAccountMenu() {
    this.accountMenuOpen.set(false);
  }

  protected openSettings(event: Event) {
    event.stopPropagation();
    this.accountMenuOpen.set(false);
    this.settingsModalOpen.set(true);
  }

  protected openTargets(event: Event) {
    event.stopPropagation();
    this.accountMenuOpen.set(false);
    this.targetsModalOpen.set(true);
  }

  protected openOrganization(event: Event) {
    event.stopPropagation();
    this.accountMenuOpen.set(false);
    this.organizationModalOpen.set(true);
  }

  protected logout(event: Event) {
    event.stopPropagation();
    this.accountMenuOpen.set(false);
    this.authStore.logout();
  }

  protected initialFor(user: AuthUser): string {
    const source = user.email ?? user.userId;
    return source ? source.charAt(0).toUpperCase() : '?';
  }
}
