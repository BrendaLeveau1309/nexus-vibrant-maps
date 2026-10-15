// Demo store for CPH (células progenitoras hematopoyéticas) campaigns, shared by the
// mobile app and the hospital platform through localStorage + storage events.
export type CampaignStatus = "BORRADOR" | "PUBLICADA";
export type ParticipantStatus = "PREINSCRITO" | "CONFIRMADO";
export type Attendance = "ASISTIO" | "NO_ASISTIO" | null;
export type Participant = { id: string; name: string; status: ParticipantStatus; attendance: Attendance };
export type Campaign = {
  id: string; name: string; description: string; establishment: string;
  date: string; time: string; capacity: number; status: CampaignStatus;
  participants: Participant[];
};
export type Interest = { id: string; name: string; hospital: string; registeredAt: string };
export type CphState = { interestedCount: number; myInterest: boolean; myHospital?: string; interests: Interest[]; campaigns: Campaign[] };
export const CPH_HOSPITALS = ["Hospital Nacional Dos de Mayo", "Hospital Edgardo Rebagliati", "Hospital Arzobispo Loayza"];

export const CPH_KEY = "nexovital-cph";
export const DEMO_USER = { id: "demo-user", name: "Usuario demo" };

const seed: CphState = {
  interestedCount: 41,
  myInterest: false,
  interests: [
    { id: "p1", name: "Lucía Paredes", hospital: "Hospital Nacional Dos de Mayo", registeredAt: "2026-10-02" },
    { id: "p3", name: "Rosa Medina", hospital: "Hospital Nacional Dos de Mayo", registeredAt: "2026-10-05" },
    { id: "i4", name: "Carlos Mendoza", hospital: "Hospital Nacional Dos de Mayo", registeredAt: "2026-10-12" },
    { id: "i5", name: "Ana Quispe", hospital: "Hospital Nacional Dos de Mayo", registeredAt: "2026-10-14" },
    { id: "i6", name: "Jorge Ríos", hospital: "Hospital Edgardo Rebagliati", registeredAt: "2026-10-09" },
  ],
  campaigns: [
    {
      id: "cph-1", name: "Jornada informativa CPH", description: "Charla y orientación sobre la donación de células progenitoras.",
      establishment: "Hospital Nacional Dos de Mayo", date: "2026-10-24", time: "09:00 - 13:00", capacity: 40, status: "PUBLICADA",
      participants: [
        { id: "p1", name: "Lucía Paredes", status: "CONFIRMADO", attendance: null },
        { id: "p2", name: "Diego Salas", status: "PREINSCRITO", attendance: null },
        { id: "p3", name: "Rosa Medina", status: "CONFIRMADO", attendance: null },
      ],
    },
    {
      id: "cph-2", name: "Campaña CPH Lima Sur", description: "Campaña de difusión en coordinación con el establecimiento.",
      establishment: "Hospital Edgardo Rebagliati", date: "2026-11-08", time: "08:00 - 12:00", capacity: 60, status: "BORRADOR",
      participants: [],
    },
  ],
};

export function loadCph(): CphState {
  if (typeof window === "undefined") return seed;
  try { const raw = localStorage.getItem(CPH_KEY); if (!raw) return seed; const st = JSON.parse(raw) as CphState; return { ...st, interests: st.interests ?? seed.interests }; } catch { return seed; }
}
export function saveCph(state: CphState) {
  localStorage.setItem(CPH_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("nexovital-cph"));
}
export function subscribeCph(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("nexovital-cph", cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener("nexovital-cph", cb); };
}

export function registerInterest(s: CphState, hospital: string = CPH_HOSPITALS[0]): CphState {
  if (s.myInterest) return s;
  const interest: Interest = { id: DEMO_USER.id, name: DEMO_USER.name, hospital, registeredAt: new Date().toISOString().slice(0, 10) };
  return { ...s, myInterest: true, myHospital: hospital, interestedCount: s.interestedCount + 1, interests: [...s.interests.filter(i => i.id !== DEMO_USER.id), interest] };
}
/** Interesados de un hospital con estado: Inscrito si confirmó cupo en una campaña publicada de ese hospital. */
export function hospitalInterests(s: CphState, hospital: string) {
  return s.interests.filter(i => i.hospital === hospital).map(i => ({
    ...i,
    status: s.campaigns.some(c => c.establishment === hospital && c.status === "PUBLICADA" && c.participants.some(p => p.id === i.id && p.status === "CONFIRMADO")) ? "Inscrito" as const : "En espera" as const,
  }));
}
export function confirmAttendance(s: CphState, campaignId: string): CphState {
  return {
    ...s,
    campaigns: s.campaigns.map(c => {
      if (c.id !== campaignId || c.status !== "PUBLICADA") return c;
      const existing = c.participants.find(p => p.id === DEMO_USER.id);
      if (existing) return { ...c, participants: c.participants.map(p => p.id === DEMO_USER.id ? { ...p, status: "CONFIRMADO" } : p) };
      if (c.participants.length >= c.capacity) return c;
      return { ...c, participants: [...c.participants, { id: DEMO_USER.id, name: DEMO_USER.name, status: "CONFIRMADO", attendance: null }] };
    }),
  };
}
export function setAttendance(s: CphState, campaignId: string, participantId: string, attendance: Attendance): CphState {
  return { ...s, campaigns: s.campaigns.map(c => c.id !== campaignId ? c : { ...c, participants: c.participants.map(p => p.id === participantId && p.status === "CONFIRMADO" ? { ...p, attendance } : p) }) };
}
