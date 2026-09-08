import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IcpcContraindication } from './icpc.model';

const BASE_URL = 'http://localhost:3000/api/patients';
const CODE_SYSTEM = 'ICPC';

interface ContraindicationDto {
  id: string;
  code: string;
  code_system: string;
  description: string | null;
}

export interface IcpcContraindicationRecord {
  recordId: string;
  item: IcpcContraindication;
}

function toRecord(dto: ContraindicationDto): IcpcContraindicationRecord {
  return { recordId: dto.id, item: { id: dto.code, description: dto.description ?? '' } };
}

@Service()
export class IcpcContraindicationApiService {
  private readonly http = inject(HttpClient);

  async getForPatient(patientId: string): Promise<IcpcContraindicationRecord[]> {
    const response = await firstValueFrom(
      this.http.get<{ contraindications: ContraindicationDto[] }>(`${BASE_URL}/${patientId}/contraindications`),
    );
    return response.contraindications.filter((dto) => dto.code_system === CODE_SYSTEM).map(toRecord);
  }

  async add(patientId: string, item: IcpcContraindication): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{ contraindication: ContraindicationDto }>(`${BASE_URL}/${patientId}/contraindications`, {
        code: item.id,
        codeSystem: CODE_SYSTEM,
        description: item.description,
      }),
    );
    return response.contraindication.id;
  }

  async remove(patientId: string, recordId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${BASE_URL}/${patientId}/contraindications/${recordId}`));
  }
}
