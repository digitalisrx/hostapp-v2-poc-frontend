export interface Allergy {
  id: string;
  description: string;
  /** SNK classification from the third-party allergy source: 1 = generiek, 2 = stofnaam, 3 = toedieningsroute. Absent for allergies added before this was tracked. */
  type?: number;
}
