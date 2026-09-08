import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Allergy } from './allergy.model';

const ALLERGY_SEARCH_URL = '/ajax/store/allergy';

interface AllergyDto {
  code: string;
  type: number;
  name: string;
}

function toAllergy(dto: AllergyDto): Allergy {
  return { id: String(dto.code), description: dto.name };
}

@Service()
export class AllergySearchService {
  private readonly http = inject(HttpClient);

  async search(term: string): Promise<Allergy[]> {
    const url = `${ALLERGY_SEARCH_URL}?searchStr=${encodeURIComponent(term)}`;
    const dtos = await firstValueFrom(this.http.get<AllergyDto[]>(url));
    return dtos.map(toAllergy);
  }
}
