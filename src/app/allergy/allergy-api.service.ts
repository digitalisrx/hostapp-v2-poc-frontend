import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Allergy } from './allergy.model';

const BASE_URL = 'http://localhost:3000/api/patients';
const CODE_SYSTEM = 'SNK';

interface AllergyDto {
  id: string;
  code: string;
  code_system: string;
  description: string | null;
  type?: number | null;
}

export interface AllergyRecord {
  recordId: string;
  item: Allergy;
}

function toRecord(dto: AllergyDto): AllergyRecord {
  return {
    recordId: dto.id,
    item: { id: String(dto.code), description: dto.description ?? '', type: dto.type ?? undefined },
  };
}

@Service()
export class AllergyApiService {
  private readonly http = inject(HttpClient);

  async getForPatient(patientId: string): Promise<AllergyRecord[]> {
    const response = await firstValueFrom(
      this.http.get<{ allergies: AllergyDto[] }>(`${BASE_URL}/${patientId}/allergies`),
    );
    return response.allergies.filter((dto) => dto.code_system === CODE_SYSTEM).map(toRecord);
  }

  async add(patientId: string, item: Allergy): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{ allergy: AllergyDto }>(`${BASE_URL}/${patientId}/allergies`, {
        code: String(item.id),
        codeSystem: CODE_SYSTEM,
        description: item.description,
        ...(item.type !== undefined ? { type: item.type } : {}),
      }),
    );
    return response.allergy.id;
  }

  async remove(patientId: string, recordId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${BASE_URL}/${patientId}/allergies/${recordId}`));
  }
}
