export type PatientGender = 'M' | 'F';

export interface Patient {
  id: string;
  name: string;
  gender: PatientGender;
  /** Stored directly rather than derived from a birth date, so patients don't visibly age as real time passes — this is a testing environment. */
  ageYears: number;
  ageMonths: number;
}

// Children under 10 are shown as years+months (e.g. "3j 7m"), the Dutch
// clinical convention where age precision matters more at that stage.
export function formatAge(patient: Pick<Patient, 'ageYears' | 'ageMonths'>): string {
  return `${patient.ageYears}j ${patient.ageMonths}m`;
}

/** Approximates a date of birth from a stored age, for integrations (e.g. Prescriptor) that require a real one. */
export function estimateDob(patient: Pick<Patient, 'ageYears' | 'ageMonths'>, today = new Date()): string {
  const totalMonths = patient.ageYears * 12 + patient.ageMonths;
  let year = today.getFullYear() - Math.floor(totalMonths / 12);
  let month = today.getMonth() + 1 - (totalMonths % 12);

  if (month <= 0) {
    month += 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}-01`;
}
