export const BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;

// Red-cell compatibility only; clinical screening remains necessary.
export function canDonateTo(donor: string, recipient: string): boolean {
  if (!BLOOD_TYPES.some(type => type === donor) || !BLOOD_TYPES.some(type => type === recipient)) return false;
  const group = donor.slice(0, -1);
  const receivingGroup = recipient.slice(0, -1);
  const aboCompatible = group === "O" || group === receivingGroup || receivingGroup === "AB";
  return aboCompatible && (donor.endsWith("-") || recipient.endsWith("+"));
}

export function bloodCompatibility(blood: string) {
  return {
    donateTo: BLOOD_TYPES.filter(type => canDonateTo(blood, type)),
    receiveFrom: BLOOD_TYPES.filter(type => canDonateTo(type, blood)),
  };
}

export function donorRank(donations: number): string {
  if (donations >= 15) return "Platino";
  if (donations >= 7) return "Oro";
  if (donations >= 3) return "Plata";
  if (donations >= 1) return "Bronce";
  return "Inicial";
}