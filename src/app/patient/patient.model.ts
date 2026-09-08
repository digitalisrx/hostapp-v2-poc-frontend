export type PatientGender = 'M' | 'F';

export interface Patient {
  id: string;
  name: string;
  gender: PatientGender;
  dob: string;
}

export function calculateAge(dob: string, today = new Date()): number {
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
}

// Children under 10 are shown as years+months (e.g. "3j+7m"), the Dutch
// clinical convention where age precision matters more at that stage.
export function formatAge(dob: string, today = new Date()): string {
  const years = calculateAge(dob, today);

  if (years >= 10) {
    return `${years}j`;
  }

  const birthDate = new Date(dob);
  let totalMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
  if (today.getDate() < birthDate.getDate()) {
    totalMonths--;
  }
  const remainingMonths = Math.max(totalMonths - years * 12, 0);

  return `${years}j ${remainingMonths}m`;
}
