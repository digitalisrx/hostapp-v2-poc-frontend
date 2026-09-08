export interface MedicationCode {
  type: string;
  value: number | string;
  description: string;
  quantity: { value: number; unit: string };
  directions?: string | { type: string; coded: string; user: string };
}

export interface Medication {
  id: string;
  codes: MedicationCode[];
  duration: number;
  opium: boolean;
  description: string;
  atc: string;
}
