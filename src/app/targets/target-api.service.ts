import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Target } from './target.model';

const BASE_URL = 'http://localhost:3000/api/targets';

interface TargetDto {
  id: string;
  user_id: string;
  label: string;
  url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

function toTarget(dto: TargetDto): Target {
  return { id: dto.id, label: dto.label, url: dto.url, active: dto.active };
}

function toApiError(error: unknown, fallback: string): Error {
  if (error instanceof HttpErrorResponse) {
    const message = (error.error as { error?: string } | undefined)?.error;
    return new Error(message || fallback);
  }
  return new Error(fallback);
}

@Service()
export class TargetApiService {
  private readonly http = inject(HttpClient);

  async getTargets(): Promise<Target[]> {
    const response = await firstValueFrom(this.http.get<{ targets: TargetDto[] }>(BASE_URL, { withCredentials: true }));
    return response.targets.map(toTarget);
  }

  async create(data: { label: string; url: string }): Promise<Target> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ target: TargetDto }>(BASE_URL, data, { withCredentials: true }),
      );
      return toTarget(response.target);
    } catch (error) {
      throw toApiError(error, 'Target opslaan mislukt.');
    }
  }

  async update(id: string, updates: { label?: string; url?: string }): Promise<Target> {
    try {
      const response = await firstValueFrom(
        this.http.patch<{ target: TargetDto }>(`${BASE_URL}/${id}`, updates, { withCredentials: true }),
      );
      return toTarget(response.target);
    } catch (error) {
      throw toApiError(error, 'Target opslaan mislukt.');
    }
  }

  async activate(id: string): Promise<void> {
    await firstValueFrom(this.http.post(`${BASE_URL}/${id}/activate`, {}, { withCredentials: true }));
  }

  /** Throws with the not-found ids listed if any of them aren't the caller's own. */
  async reorder(orderedIds: readonly string[]): Promise<void> {
    const response = await firstValueFrom(
      this.http.patch<{ notFound?: string[] }>(
        `${BASE_URL}/reorder`,
        { orderedIds },
        { withCredentials: true },
      ),
    );
    if (response.notFound?.length) {
      throw new Error(`Kon de volgorde niet bijwerken voor ${response.notFound.length} target(en).`);
    }
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${BASE_URL}/${id}`, { withCredentials: true }));
  }
}
