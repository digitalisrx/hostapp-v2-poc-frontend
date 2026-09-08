import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IcpcContraindication } from './icpc.model';

const ICPC_SEARCH_URL = 'https://evs.prescriptor.nl/wp1services/ith2000/ith_rest.php';

interface IcpcSearchResponse {
  data: IcpcContraindication[];
  availableRows: number;
}

@Service()
export class IcpcSearchService {
  private readonly http = inject(HttpClient);

  async search(term: string): Promise<IcpcContraindication[]> {
    const url = `${ICPC_SEARCH_URL}?noHeadings=1&searchStr=${encodeURIComponent(term)}`;
    const response = await firstValueFrom(this.http.jsonp<IcpcSearchResponse>(url, 'callback'));
    return response.data;
  }
}
