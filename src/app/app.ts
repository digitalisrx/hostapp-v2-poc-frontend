import { Component, inject, signal } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { LucideBug, LucideUser, LucideLogOut, LucideSettings } from '@lucide/angular';
import { AuthStore } from './auth/auth.store';
import { LoginModal } from './auth/login-modal/login-modal';
import { DebugModal } from './debug/debug-modal/debug-modal';
import { PatientSidebar } from './patient-sidebar/patient-sidebar';
import { PrescriptorService, PrescriptorSessionType } from './prescriptor.service';
import { PrescriptorView } from './prescriptor-view/prescriptor-view';
import { SettingsModal } from './settings/settings-modal/settings-modal';

@Component({
  imports: [
    RouterOutlet,
    PatientSidebar,
    PrescriptorView,
    DebugModal,
    LoginModal,
    SettingsModal,
    LucideBug,
    LucideUser,
    LucideLogOut,
    LucideSettings,
  ],
  selector: 'app-root',
  host: { class: 'flex h-screen w-full flex-col overflow-hidden' },
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private prescriptorService = inject(PrescriptorService);
  protected readonly authStore = inject(AuthStore);

  protected readonly title = signal('hostapp-new');
  protected readonly iframeUrl = signal<SafeResourceUrl | null>(null);
  protected readonly sessionId = signal<string | null>(null);
  protected readonly activeSessionType = signal<PrescriptorSessionType | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly debugModalOpen = signal(false);
  protected readonly settingsModalOpen = signal(false);
  protected readonly loginModalOpen = signal(false);

  async runSession(type: PrescriptorSessionType, icpc?: string) {
    this.errorMessage.set(null);

    try {
      const session = await this.prescriptorService.createSession(type, icpc);
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
}
