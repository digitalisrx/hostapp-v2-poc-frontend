import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Advice } from './advice.model';

const BASE_URL = 'http://localhost:3000/api/patients';

interface AdviceDto {
  id: string;
  text: string;
  content_type: string;
}

function toAdvice(dto: AdviceDto): Advice {
  return { id: dto.id, text: dto.text, contentType: dto.content_type };
}

@Service()
export class AdviceApiService {
  private readonly http = inject(HttpClient);

  async getForPatient(patientId: string): Promise<Advice[]> {
    const response = await firstValueFrom(
      this.http.get<{ advices: AdviceDto[] }>(`${BASE_URL}/${patientId}/advices`),
    );
    return response.advices.map(toAdvice);
  }

  async add(patientId: string, item: Omit<Advice, 'id'>, sessionId: string | null): Promise<Advice> {
    const response = await firstValueFrom(
      this.http.post<{ advice: AdviceDto }>(`${BASE_URL}/${patientId}/advices`, {
        text: item.text,
        contentType: item.contentType,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
    return toAdvice(response.advice);
  }

  async remove(patientId: string, id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${BASE_URL}/${patientId}/advices/${id}`));
  }
}
