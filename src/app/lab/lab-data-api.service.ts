import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LabDatum } from './lab-datum.model';

const BASE_URL = 'http://localhost:3000/api/patients';

interface LabDatumDto {
  id: string;
  patient_id: string;
  lab_code_id: string;
  days_ago: number;
  value: number;
  created_at: string;
}

function toLabDatum(dto: LabDatumDto): LabDatum {
  return {
    id: String(dto.id),
    labCodeId: String(dto.lab_code_id),
    daysAgo: dto.days_ago,
    value: dto.value,
  };
}

@Service()
export class LabDataApiService {
  private readonly http = inject(HttpClient);

  async getForPatient(patientId: string): Promise<LabDatum[]> {
    const response = await firstValueFrom(
      this.http.get<{ labData: LabDatumDto[] }>(`${BASE_URL}/${patientId}/lab-data`),
    );
    return response.labData.map(toLabDatum);
  }

  async add(patientId: string, labCodeId: string, daysAgo: number, value: number): Promise<LabDatum> {
    const response = await firstValueFrom(
      this.http.post<{ labData: LabDatumDto }>(`${BASE_URL}/${patientId}/lab-data`, {
        labCodeId: String(labCodeId),
        daysAgo,
        value,
      }),
    );
    return toLabDatum(response.labData);
  }

  async update(patientId: string, id: string, daysAgo: number, value: number): Promise<LabDatum> {
    const response = await firstValueFrom(
      this.http.patch<{ labData: LabDatumDto }>(`${BASE_URL}/${patientId}/lab-data/${id}`, {
        daysAgo,
        value,
      }),
    );
    return toLabDatum(response.labData);
  }

  async remove(patientId: string, id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${BASE_URL}/${patientId}/lab-data/${id}`));
  }
}
