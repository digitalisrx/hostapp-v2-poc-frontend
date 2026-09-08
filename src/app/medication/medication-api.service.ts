import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Medication, MedicationCode } from './medication.model';

const BASE_URL = 'http://localhost:3000/api/patients';

interface MedicationDto {
  id: string;
  atc: string | null;
  description: string;
  duration: number | null;
  opium: boolean;
  codes: MedicationCode[];
}

function toMedication(dto: MedicationDto): Medication {
  return {
    id: dto.id,
    atc: dto.atc ?? '',
    description: dto.description,
    duration: dto.duration ?? 0,
    opium: dto.opium,
    codes: dto.codes,
  };
}

@Service()
export class MedicationApiService {
  private readonly http = inject(HttpClient);

  async getForPatient(patientId: string): Promise<Medication[]> {
    const response = await firstValueFrom(
      this.http.get<{ medications: MedicationDto[] }>(`${BASE_URL}/${patientId}/medications`),
    );
    return response.medications.map(toMedication);
  }

  async add(patientId: string, item: Omit<Medication, 'id'>, sessionId: string | null): Promise<Medication> {
    const response = await firstValueFrom(
      this.http.post<{ medication: MedicationDto }>(`${BASE_URL}/${patientId}/medications`, {
        atc: item.atc,
        description: item.description,
        duration: item.duration,
        opium: item.opium,
        codes: item.codes,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
    return toMedication(response.medication);
  }

  async remove(patientId: string, id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${BASE_URL}/${patientId}/medications/${id}`));
  }
}
