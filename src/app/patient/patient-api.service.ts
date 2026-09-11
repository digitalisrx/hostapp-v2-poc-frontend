import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Patient, PatientGender } from './patient.model';

const PATIENTS_URL = 'http://localhost:3000/api/patients';

interface PatientDto {
  id: string;
  name: string;
  gender: PatientGender;
  age_years: number;
  age_months: number;
  sort_order: number;
}

function toPatient(dto: PatientDto): Patient {
  return { id: dto.id, name: dto.name, gender: dto.gender, ageYears: dto.age_years, ageMonths: dto.age_months };
}

@Service()
export class PatientApiService {
  private readonly http = inject(HttpClient);

  async getPatients(): Promise<Patient[]> {
    const response = await firstValueFrom(this.http.get<{ patients: PatientDto[] }>(PATIENTS_URL));
    return [...response.patients].sort((a, b) => a.sort_order - b.sort_order).map(toPatient);
  }

  async createPatient(data: Omit<Patient, 'id'>, sortOrder: number): Promise<Patient> {
    const response = await firstValueFrom(
      this.http.post<{ patient: PatientDto }>(PATIENTS_URL, {
        name: data.name,
        gender: data.gender,
        ageYears: data.ageYears,
        ageMonths: data.ageMonths,
        sortOrder,
      }),
    );
    return toPatient(response.patient);
  }

  async updatePatient(id: string, updates: Partial<Omit<Patient, 'id'>>): Promise<Patient> {
    const response = await firstValueFrom(
      this.http.patch<{ patient: PatientDto }>(`${PATIENTS_URL}/${id}`, {
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.gender !== undefined ? { gender: updates.gender } : {}),
        ...(updates.ageYears !== undefined ? { ageYears: updates.ageYears } : {}),
        ...(updates.ageMonths !== undefined ? { ageMonths: updates.ageMonths } : {}),
      }),
    );
    return toPatient(response.patient);
  }

  async updateSortOrder(order: ReadonlyArray<{ id: string; sortOrder: number }>): Promise<void> {
    const response = await firstValueFrom(
      this.http.patch<{ patients: PatientDto[]; notFound: string[] }>(PATIENTS_URL, { patients: order }),
    );

    if (response.notFound.length > 0) {
      throw new Error(`Kon de volgorde niet bijwerken voor ${response.notFound.length} patiënt(en).`);
    }
  }

  async deletePatient(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${PATIENTS_URL}/${id}`));
  }

  async duplicatePatient(id: string): Promise<Patient> {
    const response = await firstValueFrom(
      this.http.post<{ patient: PatientDto }>(`${PATIENTS_URL}/${id}/duplicate`, {}),
    );
    return toPatient(response.patient);
  }
}
