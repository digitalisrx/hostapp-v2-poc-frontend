import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IcpcContraindication } from './icpc.model';

const ICPC_SEARCH_URL = 'http://localhost:3000/api/prescriptor/catalog/icpc/search';

interface IcpcSearchResult {
  code: string;
  title: string;
}

function toIcpc(result: IcpcSearchResult): IcpcContraindication {
  return { id: result.code, description: result.title };
}

@Service()
export class IcpcSearchService {
  private readonly http = inject(HttpClient);

  async search(term: string): Promise<IcpcContraindication[]> {
    const url = `${ICPC_SEARCH_URL}?q=${encodeURIComponent(term)}`;
    const response = await firstValueFrom(this.http.get<{ items: IcpcSearchResult[] }>(url));
    return response.items.map(toIcpc);
  }
}
