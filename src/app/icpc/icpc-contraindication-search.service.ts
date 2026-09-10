import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IcpcContraindication } from './icpc.model';

const CATALOG_SEARCH_URL = 'http://localhost:3000/api/prescriptor/catalog/search';

interface CatalogSearchResult {
  code: string;
  codeSystem: string;
  display: string;
}

function toContraindication(result: CatalogSearchResult): IcpcContraindication {
  return { id: result.code, description: result.display };
}

@Service()
export class IcpcContraindicationSearchService {
  private readonly http = inject(HttpClient);

  async search(term: string): Promise<IcpcContraindication[]> {
    const url = `${CATALOG_SEARCH_URL}?domain=contra&codeSystem=ICPC&q=${encodeURIComponent(term)}`;
    const response = await firstValueFrom(this.http.get<{ items: CatalogSearchResult[] }>(url));
    return response.items.map(toContraindication);
  }
}
