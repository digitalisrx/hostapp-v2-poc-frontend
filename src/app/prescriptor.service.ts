import { DOCUMENT } from '@angular/common';
import { Service, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AdviceStore } from './advice/advice.store';
import { Advice } from './advice/advice.model';
import { AllergyStore } from './allergy/allergy.store';
import { GstandaardContraindicationStore } from './gstandaard/gstandaard-contraindication.store';
import { IcpcContraindicationStore } from './icpc/icpc-contraindication.store';
import { LabCodeSearchService } from './lab/lab-code-search.service';
import { LabDataStore } from './lab/lab-data.store';
import { LabDatum } from './lab/lab-datum.model';
import { MedicationStore } from './medication/medication.store';
import { Medication } from './medication/medication.model';
import { PatientStore } from './patient/patient.store';

interface PrescriptorCode {
  code: string;
  codeSystem: string;
}

interface PrescriptorMedication {
  code: number;
  codeSystem: 'PRK' | 'HPK';
}

interface PrescriptorLaboratoryDatum {
  memo: string;
  mat: string;
  bijz: string;
  date: string;
  value: string;
}

interface PrescriptorPrescriptionCode {
  value: number;
  type: 'PRK' | 'HPK';
  description?: string;
}

/** An existing medication handed to CreateRx as the starting point for an edit session. */
export interface PrescriptorPrescription {
  codes: PrescriptorPrescriptionCode[];
  atc?: string;
  quantity?: { value: number; unit: string };
  directions?: string;
}

/** Null when the medication has no PRK/HPK code — CreateRx can't be started from it. */
export function toPrescriptorPrescription(medication: Medication): PrescriptorPrescription | null {
  const code = medication.codes[0];
  if (!code || (code.type !== 'PRK' && code.type !== 'HPK')) {
    return null;
  }

  return {
    codes: [
      {
        value: typeof code.value === 'number' ? code.value : Number(code.value),
        type: code.type,
        description: code.description,
      },
    ],
    ...(medication.atc ? { atc: medication.atc } : {}),
    quantity: code.quantity,
    // CreateRx expects the coded G-Standaard dosage instruction (e.g. "4D1C MVOE 1W") to
    // populate its structured Frequentie/Tijd/Aantal/Eenheid fields — the free-text `.user`
    // rendering isn't reliably parsed and leaves fields like Tijd/Eenheid blank.
    ...(code.directions
      ? { directions: typeof code.directions === 'string' ? code.directions : code.directions.coded }
      : {}),
  };
}

// The legacy JSON API only accepts current medication as a PRK or HPK code — a GPK
// (or any other) code from a session result can't be sent back, so it's dropped.
function toPrescriptorMedications(medications: readonly Medication[]): PrescriptorMedication[] {
  return medications.flatMap((medication) =>
    medication.codes
      .filter((code): code is typeof code & { type: 'PRK' | 'HPK' } => code.type === 'PRK' || code.type === 'HPK')
      .map((code) => ({
        code: typeof code.value === 'number' ? code.value : Number(code.value),
        codeSystem: code.type,
      })),
  );
}

function toPrescriptorDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function toPrescriptorLaboratoryData(
  labData: readonly LabDatum[],
  getLabCode: (labCodeId: string) => { memo: string; materiaal: string; bijzonderheden: string } | null,
): PrescriptorLaboratoryDatum[] {
  return labData.map((item) => {
    const labCode = getLabCode(item.labCodeId);
    return {
      memo: labCode?.memo ?? '',
      mat: labCode?.materiaal ?? '',
      bijz: labCode?.bijzonderheden ?? '',
      date: toPrescriptorDate(item.daysAgo),
      value: String(item.value),
    };
  });
}

export type PrescriptorSessionType = 'create-rx' | 'formulary';
export type PrescriptorTransport = 'json' | 'fhir';
export type PrescriptorResultStatus = 'idle' | 'loading' | 'resolved' | 'error';

const BACKEND_ORIGIN = 'http://localhost:3000';

const SESSION_URLS: Record<PrescriptorSessionType, string> = {
  'create-rx': `${BACKEND_ORIGIN}/api/prescriptor/session/create-rx`,
  formulary: `${BACKEND_ORIGIN}/api/prescriptor/session/formulary`,
};

// Transport this app currently always starts sessions with. Fetching a result mirrors it.
const TRANSPORT: PrescriptorTransport = 'json';

interface PrescriptorSessionResponse {
  iframeUrl: string;
  sessionId: string;
}

export interface PrescriptorSession {
  iframeUrl: SafeResourceUrl;
  sessionId: string;
}

interface PrescriptorResult {
  drugs: Omit<Medication, 'id'>[];
  advices: Omit<Advice, 'id'>[];
}

@Service()
export class PrescriptorService {
  private sanitizer = inject(DomSanitizer);
  private patientStore = inject(PatientStore);
  private icpcContraindicationStore = inject(IcpcContraindicationStore);
  private gstandaardContraindicationStore = inject(GstandaardContraindicationStore);
  private allergyStore = inject(AllergyStore);
  private medicationStore = inject(MedicationStore);
  private adviceStore = inject(AdviceStore);
  private labDataStore = inject(LabDataStore);
  private labCodeSearch = inject(LabCodeSearchService);
  private window = inject(DOCUMENT).defaultView;

  private activeSessionId: string | null = null;
  private activePatientId: string | null = null;
  private activeEditingMedicationId: string | null = null;
  private readonly fetchedSessionIds = new Set<string>();

  private readonly resultStatusState = signal<PrescriptorResultStatus>('idle');
  private readonly resultErrorState = signal<string | null>(null);
  private readonly lastSessionRequestState = signal<unknown>(null);
  private readonly lastSessionResultState = signal<unknown>(null);

  readonly resultStatus = this.resultStatusState.asReadonly();
  readonly resultError = this.resultErrorState.asReadonly();
  /** For the debug modal: the raw request/response JSON of the most recent session. */
  readonly lastSessionRequest = this.lastSessionRequestState.asReadonly();
  readonly lastSessionResult = this.lastSessionResultState.asReadonly();

  constructor() {
    this.window?.addEventListener('message', (event: MessageEvent) => this.handleMessage(event));
  }

  async createSession(
    type: PrescriptorSessionType,
    icpc?: string,
    prescription?: PrescriptorPrescription,
    editingMedicationId?: string,
  ): Promise<PrescriptorSession> {
    const patient = this.patientStore.selectedPatient();

    if (!patient) {
      throw new Error('Geen patiënt geselecteerd.');
    }

    if (type === 'formulary' && !icpc) {
      throw new Error('Geen ICPC-code geselecteerd.');
    }

    const contraIndications: PrescriptorCode[] = [
      ...this.icpcContraindicationStore
        .contraindications()
        .map((item) => ({ code: item.id, codeSystem: 'ICPC' })),
      ...this.gstandaardContraindicationStore
        .contraindications()
        .map((item) => ({ code: item.id, codeSystem: 'CICode' })),
    ];
    const allergies: PrescriptorCode[] = this.allergyStore
      .allergies()
      .map((item) => ({ code: item.id, codeSystem: 'SNK' }));
    const medications: PrescriptorMedication[] = toPrescriptorMedications(this.medicationStore.medications());
    const laboratoryData: PrescriptorLaboratoryDatum[] = toPrescriptorLaboratoryData(this.labDataStore.labData(), (id) =>
      this.labCodeSearch.getCached(id),
    );

    const body = {
      ...(type === 'formulary' ? { icpc } : {}),
      ...(prescription ? { prescription } : {}),
      patient: {
        gender: patient.gender,
        dob: patient.dob,
        allergies,
        contraIndications,
        medications,
        laboratoryData,
        labResults: [],
      },
      endSessionUrl: `${BACKEND_ORIGIN}/api/prescriptor/callback`,
      xis: { id: 'hostapp', version: '2.0.0' },
      transport: TRANSPORT,
    };

    this.lastSessionRequestState.set(body);
    this.lastSessionResultState.set(null);

    const response = await fetch(SESSION_URLS[type], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Prescriptor-sessieaanvraag mislukt met status ${response.status}.`);
    }

    const data: PrescriptorSessionResponse = await response.json();

    this.activeSessionId = data.sessionId;
    this.activePatientId = patient.id;
    this.activeEditingMedicationId = editingMedicationId ?? null;
    this.resultStatusState.set('idle');
    this.resultErrorState.set(null);

    return {
      iframeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(data.iframeUrl),
      sessionId: data.sessionId,
    };
  }

  private handleMessage(event: MessageEvent) {
    if (event.origin !== BACKEND_ORIGIN) {
      return;
    }

    const data = event.data;
    if (!data || typeof data !== 'object') {
      return;
    }

    if (data.type === 'PRESCRIPTOR_SESSION_ENDED') {
      void this.handleSessionEnded();
    } else if (data.type === 'PRESCRIPTOR_SESSION_ERROR') {
      this.resultErrorState.set(
        typeof data.error === 'string' ? data.error : 'De Prescriptor-sessie is mislukt.',
      );
      this.resultStatusState.set('error');
    }
  }

  private async handleSessionEnded() {
    const sessionId = this.activeSessionId;
    const patientId = this.activePatientId;
    const editingMedicationId = this.activeEditingMedicationId;
    if (!sessionId || !patientId || this.fetchedSessionIds.has(sessionId)) {
      return;
    }
    this.fetchedSessionIds.add(sessionId);
    this.activeEditingMedicationId = null;

    this.resultStatusState.set('loading');
    this.resultErrorState.set(null);

    try {
      const result = await this.fetchResult(sessionId);

      await Promise.all([
        this.medicationStore.addMany(patientId, result.drugs, sessionId),
        this.adviceStore.addMany(patientId, result.advices, sessionId),
      ]);

      // An edit session's result replaces the medication it was started from,
      // rather than sitting alongside it as a duplicate.
      if (editingMedicationId) {
        await this.medicationStore.remove(editingMedicationId);
      }

      this.resultStatusState.set('resolved');
    } catch (error) {
      this.resultErrorState.set(
        error instanceof Error ? error.message : 'Het ophalen van het Prescriptor-resultaat is mislukt.',
      );
      this.resultStatusState.set('error');
    }
  }

  private async fetchResult(sessionId: string): Promise<PrescriptorResult> {
    const response = await fetch(
      `${BACKEND_ORIGIN}/api/prescriptor/result/${sessionId}?transport=${TRANSPORT}`,
      { credentials: 'include' },
    );

    if (!response.ok) {
      throw new Error(`Ophalen van het Prescriptor-resultaat is mislukt met status ${response.status}.`);
    }

    const data = await response.json();
    this.lastSessionResultState.set(data);

    return {
      drugs: Array.isArray(data.drugs) ? data.drugs : [],
      advices: Array.isArray(data.advices) ? data.advices : [],
    };
  }
}
