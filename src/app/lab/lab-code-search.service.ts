import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { LabCode } from './lab-code.model';

const BASE_URL = 'http://localhost:3000/api/lab-codes';

interface LabCodeDto {
  id: string;
  memo: string | null;
  materiaal: string | null;
  bijzonderheden: string | null;
  omschrijving: string | null;
  kort_oms: string | null;
  aub: string | null;
  unit: string | null;
}

function toLabCode(dto: LabCodeDto): LabCode {
  return {
    id: String(dto.id),
    memo: dto.memo ?? '',
    materiaal: dto.materiaal ?? '',
    bijzonderheden: dto.bijzonderheden ?? '',
    omschrijving: dto.omschrijving ?? '',
    kortOms: dto.kort_oms ?? '',
    aub: dto.aub ?? '',
    unit: dto.unit ?? '',
  };
}

@Service()
export class LabCodeSearchService {
  private readonly http = inject(HttpClient);

  // Per-patient lab data only carries a lab_code_id (no joined description), so we
  // remember every code we've seen — via search or a direct lookup — to resolve a
  // readable label for it. A signal so components re-render once a lookup resolves.
  private readonly seenState = signal(new Map<string, LabCode>());
  private readonly pendingLookups = new Set<string>();

  async search(term: string): Promise<LabCode[]> {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(term)}`;
    const response = await firstValueFrom(this.http.get<{ labCodes: LabCodeDto[] }>(url));
    const codes = response.labCodes.map(toLabCode);
    this.remember(codes);
    return codes;
  }

  /** Fetches and caches a single lab code by id, if not already known. Fails silently. */
  async resolve(labCodeId: string): Promise<void> {
    if (this.seenState().has(labCodeId) || this.pendingLookups.has(labCodeId)) {
      return;
    }

    this.pendingLookups.add(labCodeId);
    try {
      const response = await firstValueFrom(
        this.http
          .get<{ labCode: LabCodeDto }>(`${BASE_URL}/${encodeURIComponent(labCodeId)}`)
          .pipe(catchError(() => of(null))),
      );
      if (response) {
        this.remember([toLabCode(response.labCode)]);
      }
    } finally {
      this.pendingLookups.delete(labCodeId);
    }
  }

  describe(labCodeId: string): string {
    const code = this.seenState().get(labCodeId);
    return code ? code.omschrijving || code.memo : `Code ${labCodeId}`;
  }

  unitFor(labCodeId: string): string {
    return this.seenState().get(labCodeId)?.unit ?? '';
  }

  getCached(labCodeId: string): LabCode | null {
    return this.seenState().get(labCodeId) ?? null;
  }

  private remember(codes: readonly LabCode[]) {
    this.seenState.update((current) => {
      const next = new Map(current);
      codes.forEach((code) => next.set(code.id, code));
      return next;
    });
  }
}
