import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Allergy } from './allergy.model';

const CATALOG_SEARCH_URL = 'http://localhost:3000/api/prescriptor/catalog/search';

// OGGrp = generieke groep, SNK = stofnaamcode, SSK = toedieningsroute (joins `toedieningsweg`).
// Matches the 1/2/3 convention the allergy chip already used for the third-party source.
const TYPE_BY_CODE_SYSTEM: Record<string, number> = { OGGrp: 1, SNK: 2, SSK: 3 };

interface CatalogSearchResult {
  code: string;
  codeSystem: string;
  display: string;
}

function toAllergy(result: CatalogSearchResult): Allergy {
  return { id: result.code, description: result.display, type: TYPE_BY_CODE_SYSTEM[result.codeSystem] };
}

@Service()
export class AllergySearchService {
  private readonly http = inject(HttpClient);

  async search(term: string): Promise<Allergy[]> {
    const url = `${CATALOG_SEARCH_URL}?domain=allergy&q=${encodeURIComponent(term)}`;
    const response = await firstValueFrom(this.http.get<{ items: CatalogSearchResult[] }>(url));
    return response.items.map(toAllergy);
  }
}
