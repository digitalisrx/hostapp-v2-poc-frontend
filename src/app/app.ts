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
import { SettingsStore } from './settings/settings.store';
import { SplitScreenPane, SplitScreenView } from './split-screen-view/split-screen-view';
import { TargetsModal } from './targets/targets-modal/targets-modal';
import { TargetStore } from './targets/target.store';

@Component({
  imports: [
    RouterOutlet,
    PatientSidebar,
    PrescriptorView,
    SplitScreenView,
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
  protected readonly settingsStore = inject(SettingsStore);
  private readonly targetStore = inject(TargetStore);

  protected readonly title = signal('hostapp-new');
  protected readonly iframeUrl = signal<SafeResourceUrl | null>(null);
  protected readonly sessionId = signal<string | null>(null);
  protected readonly activeSessionType = signal<PrescriptorSessionType | null>(null);
  /** Unlike activeSessionType, this isn't reset on failure — it's what the error message/iframe title label off of. */
  protected readonly lastSessionType = signal<PrescriptorSessionType | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  /** Keyed by target id — filled in as split-screen sessions are run via the sidebar's run button. */
  private readonly splitScreenResults = signal<Map<string, { iframeUrl: SafeResourceUrl | null; errorMessage: string | null }>>(
    new Map(),
  );
  protected readonly splitScreenPanes = computed<SplitScreenPane[]>(() =>
    this.targetStore
      .targets()
      .slice(0, 2)
      .map((target) => ({
        target,
        iframeUrl: this.splitScreenResults().get(target.id)?.iframeUrl ?? null,
        errorMessage: this.splitScreenResults().get(target.id)?.errorMessage ?? null,
      })),
  );

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

    if (this.settingsStore.splitScreenMode()) {
      await this.runSplitScreenSessions(type, icpc, prescription, editingMedicationId);
      return;
    }

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

  // Sequential on purpose: PrescriptorService tracks the "active" session as a few
  // singular fields (see its handleMessage comment), so running these one at a time keeps
  // that state from being overwritten mid-request by the other target's call.
  private async runSplitScreenSessions(
    type: PrescriptorSessionType,
    icpc?: string,
    prescription?: PrescriptorPrescription,
    editingMedicationId?: string,
  ) {
    for (const target of this.targetStore.targets().slice(0, 2)) {
      try {
        const session = await this.prescriptorService.createSession(
          type,
          icpc,
          prescription,
          editingMedicationId,
          target.id,
        );
        this.splitScreenResults.update((results) =>
          new Map(results).set(target.id, { iframeUrl: session.iframeUrl, errorMessage: null }),
        );
      } catch (error) {
        this.splitScreenResults.update((results) =>
          new Map(results).set(target.id, {
            iframeUrl: null,
            errorMessage: error instanceof Error ? error.message : 'Het starten van de sessie is mislukt.',
          }),
        );
      }
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
