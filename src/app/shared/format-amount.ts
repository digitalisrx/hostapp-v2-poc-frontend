import numeral from 'numeral';
import 'numeral/locales/nl-nl';

numeral.locale('nl-nl');

export function formatAmount(value: number): string {
  return numeral(value).format('0,0.[00]');
}
