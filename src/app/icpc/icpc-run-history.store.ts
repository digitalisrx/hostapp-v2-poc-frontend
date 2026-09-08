import { DOCUMENT } from '@angular/common';
import { Service, inject, signal } from '@angular/core';
import { IcpcContraindication } from './icpc.model';

const STORAGE_KEY = 'icpc-run-history';
const MAX_HISTORY = 10;

@Service()
export class IcpcRunHistoryStore {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly historyState = signal<IcpcContraindication[]>(this.loadHistory());

  readonly history = this.historyState.asReadonly();

  add(item: IcpcContraindication) {
    const next = [item, ...this.historyState().filter((existing) => existing.id !== item.id)].slice(
      0,
      MAX_HISTORY,
    );
    this.historyState.set(next);
    this.window?.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadHistory(): IcpcContraindication[] {
    try {
      const raw = this.window?.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
