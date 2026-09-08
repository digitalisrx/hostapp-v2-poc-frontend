import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GstandaardContraindication } from './gstandaard.model';

const GSTANDAARD_SEARCH_URL = '/ajax/store/contraindication';

interface GstandaardContraindicationDto {
  code: string;
  type: number;
  name: string;
}

function toContraindication(dto: GstandaardContraindicationDto): GstandaardContraindication {
  return { id: dto.code, description: dto.name };
}

@Service()
export class GstandaardSearchService {
  private readonly http = inject(HttpClient);

  async search(term: string): Promise<GstandaardContraindication[]> {
    const url = `${GSTANDAARD_SEARCH_URL}?searchStr=${encodeURIComponent(term)}`;
    const dtos = await firstValueFrom(this.http.get<GstandaardContraindicationDto[]>(url));
    return dtos.map(toContraindication);
  }
}
