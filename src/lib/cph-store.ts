// Demo store for CPH (células progenitoras hematopoyéticas) campaigns, shared by the
// mobile app and the hospital platform through localStorage + storage events.
export type CampaignStatus = "BORRADOR" | "PUBLICADA" | "FINALIZADA";
export type ParticipantStatus = "PREINSCRITO" | "CONFIRMADO";
export type Attendance = "ASISTIO" | "NO_ASISTIO" | null;
export type Participant = { id: string; name: string; status: ParticipantStatus; attendance: Attendance };
export type Campaign = {
  id: string; name: string; description: string; establishment: string;
  date: string; time: string; capacity: number; status: CampaignStatus;
  participants: Participant[];
};
export type Interest = { id: string; name: string; hospital: string; registeredAt: string };
export type CphState = { interestedCount: number; myInterest: boolean; myHospital?: string | undefined; interests: Interest[]; campaigns: Campaign[] };
export const CPH_HOSPITALS = ["Hospital Nacional Dos de Mayo", "Hospital Edgardo Rebagliati", "Hospital Arzobispo Loayza"];

export const CPH_KEY = "nexovital-cph-v3";
const dayOffset = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
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
      id: "cph-1", name: "Jornada CPH Dos de Mayo (hoy)", description: "Orientación y toma de muestra para el registro de donantes de CPH.",
      establishment: "Hospital Nacional Dos de Mayo", date: dayOffset(0), time: "09:00 - 13:00", capacity: 40, status: "PUBLICADA",
      participants: [
        { id: "p1", name: "Lucía Paredes", status: "CONFIRMADO", attendance: null },
        { id: "p2", name: "Diego Salas", status: "PREINSCRITO", attendance: null },
        { id: "p3", name: "Rosa Medina", status: "CONFIRMADO", attendance: null },
        { id: "i4", name: "Carlos Mendoza", status: "CONFIRMADO", attendance: null },
      ],
    },
    {
      id: "cph-3", name: "Campaña CPH de fin de mes", description: "Nueva fecha para donantes en espera del Hospital Dos de Mayo.",
      establishment: "Hospital Nacional Dos de Mayo", date: dayOffset(21), time: "08:00 - 12:00", capacity: 30, status: "PUBLICADA",
      participants: [{ id: "i5", name: "Ana Quispe", status: "CONFIRMADO", attendance: null }],
    },
    {
      id: "cph-0", name: "Jornada CPH Dos de Mayo (finalizada)", description: "Campaña anterior ya cerrada; su asistencia quedó registrada.",
      establishment: "Hospital Nacional Dos de Mayo", date: dayOffset(-14), time: "09:00 - 13:00", capacity: 25, status: "FINALIZADA",
      participants: [
        { id: "f1", name: "Marta Huamán", status: "CONFIRMADO", attendance: "ASISTIO" },
        { id: "f2", name: "Pedro Castillo", status: "CONFIRMADO", attendance: "NO_ASISTIO" },
        { id: "f3", name: "Elena Torres", status: "CONFIRMADO", attendance: "ASISTIO" },
      ],
    },
    {
      id: "cph-2", name: "Campaña CPH Lima Sur", description: "Campaña de difusión en coordinación con el establecimiento.",
      establishment: "Hospital Edgardo Rebagliati", date: dayOffset(30), time: "08:00 - 12:00", capacity: 60, status: "BORRADOR",
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

export function registerInterest(s: CphState, hospital: string = CPH_HOSPITALS[0] as string): CphState {
  if (s.myInterest) return s;
  const interest: Interest = { id: DEMO_USER.id, name: DEMO_USER.name, hospital, registeredAt: new Date().toISOString().slice(0, 10) as string };
  return { ...s, myInterest: true, myHospital: hospital, interestedCount: s.interestedCount + 1, interests: [...s.interests.filter(i => i.id !== DEMO_USER.id), interest] };
}
/** Interesados de un hospital con estado: Inscrito si confirmó cupo en una campaña publicada de ese hospital. */
export function hospitalInterests(s: CphState, hospital: string) {
  return s.interests.filter(i => i.hospital === hospital).map(i => ({
    ...i,
    status: isRegistered(s, i.id) ? "Registrado" as const : s.campaigns.some(c => c.establishment === hospital && c.status === "PUBLICADA" && c.participants.some(p => p.id === i.id && p.status === "CONFIRMADO")) ? "Inscrito" as const : "En espera" as const,
  }));
}
/** El registro CPH se hace una sola vez en la vida: si asistió a cualquier campaña, ya está registrado. */
export function isRegistered(s: CphState, userId: string): boolean {
  return s.campaigns.some(c => c.participants.some(p => p.id === userId && p.attendance === "ASISTIO"));
}
/** Una campaña publicada cuya fecha ya pasó se considera finalizada (historial). */
export function isFinished(c: Campaign, today: string = new Date().toISOString().slice(0, 10)): boolean {
  return c.status === "FINALIZADA" || (c.status === "PUBLICADA" && c.date < today);
}
export function confirmAttendance(s: CphState, campaignId: string): CphState {
  if (isRegistered(s, DEMO_USER.id)) return s;
  return {
    ...s,
    campaigns: s.campaigns.map(c => {
      if (c.id !== campaignId || c.status !== "PUBLICADA" || isFinished(c)) return c;
      const existing = c.participants.find(p => p.id === DEMO_USER.id);
      if (existing) return { ...c, participants: c.participants.map(p => p.id === DEMO_USER.id ? { ...p, status: "CONFIRMADO" } : p) };
      if (c.participants.length >= c.capacity) return c;
      return { ...c, participants: [...c.participants, { id: DEMO_USER.id, name: DEMO_USER.name, status: "CONFIRMADO", attendance: null }] };
    }),
  };
}
export function setAttendance(s: CphState, campaignId: string, participantId: string, attendance: Attendance): CphState {
  // Solo se registra asistencia en campañas activas (publicadas, desde su fecha y no finalizadas).
  const target = s.campaigns.find(c => c.id === campaignId);
  const today = new Date().toISOString().slice(0, 10);
  if (!target || target.status !== "PUBLICADA" || isFinished(target, today) || target.date > today) return s;
  // No se puede marcar ASISTIO si ya quedó registrado en otra campaña.
  if (attendance === "ASISTIO" && s.campaigns.some(c => c.id !== campaignId && c.participants.some(p => p.id === participantId && p.attendance === "ASISTIO"))) return s;
  return { ...s, campaigns: s.campaigns.map(c => c.id !== campaignId ? c : { ...c, participants: c.participants.map(p => p.id === participantId && p.status === "CONFIRMADO" ? { ...p, attendance } : p) }) };
}

/** Cierre manual por el personal (prioritario); si se olvida, la fecha pasada la finaliza igual. */
export function closeCampaign(s: CphState, campaignId: string): CphState {
  return { ...s, campaigns: s.campaigns.map(c => c.id === campaignId && c.status === "PUBLICADA" ? { ...c, status: "FINALIZADA" } : c) };
}
/** Desactiva el interés del donante: deja de contar en la demanda del hospital. */
export function deactivateInterest(s: CphState): CphState {
  if (!s.myInterest) return s;
  return { ...s, myInterest: false, myHospital: undefined, interestedCount: Math.max(0, s.interestedCount - 1), interests: s.interests.filter(i => i.id !== DEMO_USER.id) };
}
