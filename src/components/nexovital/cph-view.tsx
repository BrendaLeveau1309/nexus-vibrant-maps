import { useEffect, useState } from "react";
import { ArrowLeft, Award, Bell, Share2, CalendarDays, CheckCircle2, Clock3, Info, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import cphIllustration from "@/assets/cph-illustration.jpg";
import { CPH_HOSPITALS, DEMO_USER, confirmAttendance, deactivateInterest, isFinished, isRegistered, loadCph, registerInterest, saveCph, subscribeCph, type Campaign, type CphState } from "@/lib/cph-store";

const steps = [
  ["Infórmate", "Conoce qué son las CPH y resuelve tus dudas con fuentes oficiales."],
  ["Manifiesta tu interés", "Indica en NexoVital que te gustaría recibir información y campañas."],
  ["Asiste a una campaña", "Los establecimientos publican campañas donde podrás orientarte."],
  ["Registro oficial", "La inscripción y evaluación las realiza el registro y personal médico autorizado."],
];

export function CphView({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<CphState | null>(null);
  const [confirmInterest, setConfirmInterest] = useState(false);
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [message, setMessage] = useState("");
  const [hospital, setHospital] = useState<string>(CPH_HOSPITALS[0] as string);

  useEffect(() => { const r = () => setState(loadCph()); r(); return subscribeCph(r); }, []);
  if (!state) return null;
  const subscribed = (state.myInterest && !!state.myHospital) || isRegistered(state, DEMO_USER.id);
  const published = subscribed ? state.campaigns.filter(c => c.status === "PUBLICADA" && !isFinished(c) && (!state.myHospital || c.establishment === state.myHospital)) : [];
  const mine = (c: Campaign) => c.participants.find(p => p.id === DEMO_USER.id);
  const registered = isRegistered(state, DEMO_USER.id);
  const update = (next: CphState) => { saveCph(next); setState(next); };

  return (
    <section className="absolute inset-0 z-40 overflow-y-auto bg-mobile-canvas pb-10">
      <header className="sticky top-0 z-10 flex h-[64px] items-center gap-2 bg-primary px-3 text-primary-foreground">
        <Button size="icon" variant="ghost" aria-label="Volver" className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" onClick={onBack}><ArrowLeft /></Button>
        <h1 className="text-base font-extrabold">Ser donante de CPH</h1>
      </header>
      <div className="space-y-4 p-4">
        <img src={cphIllustration} alt="Ilustración de donación de células progenitoras" width={1024} height={640} className="w-full rounded-xl border bg-surface object-cover" />
        <article className="rounded-xl border bg-card p-4">
          <h2 className="text-lg font-extrabold">¿Qué son las CPH?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Las células progenitoras hematopoyéticas son células que dan origen a la sangre: glóbulos rojos, blancos y plaquetas. Su trasplante puede ayudar a personas con leucemia y otras enfermedades de la sangre.</p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <h2 className="text-lg font-extrabold">¿Cómo funciona el proceso?</h2>
          <ol className="mt-3 space-y-3">{steps.map(([t, d], i) => <li key={t} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">{i + 1}</span><div><p className="text-sm font-bold">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div></li>)}</ol>
        </article>
        <p className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed"><Info className="size-4 shrink-0 text-warning" />Manifestar interés en NexoVital no equivale a una inscripción oficial en el registro de donantes ni garantiza tu aptitud para donar.</p>

        {registered && <article role="status" className="rounded-xl border border-success/40 bg-success/10 p-4">
          <p className="flex items-center gap-2 text-sm font-extrabold text-success"><Award className="size-5" />Registrado · Embajador CPH</p>
          <p className="mt-1 text-xs text-muted-foreground">¡Ya formas parte del registro de donantes de CPH! Seguirás recibiendo avisos de campañas para compartirlas con tus familiares y amigos.</p>
        </article>}
        <article className="rounded-xl border bg-card p-4">
          <p className="text-xs font-extrabold uppercase text-primary">Interés general</p>
          {state.myInterest
            ? <p role="status" className="mt-2 flex items-center gap-2 text-sm font-bold text-success"><CheckCircle2 className="size-4" />Interés CPH: ACTIVO{state.myHospital ? ` · ${state.myHospital}` : ""}</p>
            : <p className="mt-2 text-sm text-muted-foreground">Aún no has manifestado interés.</p>}
          {state.myInterest && message === "interest" && <p role="status" className="mt-2 rounded-lg bg-success/15 p-3 text-xs font-bold text-success">¡Tu interés quedó registrado! Recibirás información sobre nuevas campañas CPH.</p>}
          {state.myInterest && !registered && <Button className="mt-3 w-full" variant="outline" onClick={() => { update(deactivateInterest(state)); setMessage(""); }}>Desactivar mi interés</Button>}
          {!state.myInterest && !registered && <Button className="mt-3 w-full" variant="vivid" size="lg" onClick={() => setConfirmInterest(true)}>Me interesa ser potencial donante de CPH</Button>}
        </article>

        <div>
          <h2 className="mb-2 text-sm font-extrabold uppercase text-muted-foreground">Campañas publicadas</h2>
          {published.length === 0 && <p className="text-sm text-muted-foreground">No hay campañas publicadas por ahora.</p>}
          {published.map(c => <Button key={c.id} variant="ghost" className="mb-2 flex h-auto w-full items-start gap-3 whitespace-normal rounded-xl border bg-card p-4 text-left" onClick={() => { setMessage(""); setDetail(c); }}>
            <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="flex-1"><b className="block text-sm">{c.name}</b><span className="text-xs text-muted-foreground">{c.establishment} · {c.date}</span></span>
            {mine(c)?.status === "CONFIRMADO" && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-extrabold text-success">CONFIRMADO</span>}
          </Button>)}
        </div>
      </div>

      {confirmInterest && <Sheet title="Confirmar interés" onClose={() => setConfirmInterest(false)}>
        <p className="text-sm text-muted-foreground">Registraremos tu interés para recibir información y campañas CPH. Esto no es una inscripción oficial ni una evaluación médica.</p>
        <label className="mt-4 block text-sm font-bold">Elige tu hospital de preferencia<select value={hospital} onChange={e => setHospital(e.target.value)} className="mt-1 w-full rounded-lg border bg-card px-3 py-2 font-normal">{CPH_HOSPITALS.map(h => <option key={h}>{h}</option>)}</select></label>
        <p className="mt-1 text-xs text-muted-foreground">Solo recibirás campañas de este hospital.</p>
        <Button className="mt-4 w-full" variant="vivid" onClick={() => { update(registerInterest(state, hospital)); setConfirmInterest(false); setMessage("interest"); }}>Confirmar interés</Button>
        <Button className="mt-2 w-full" variant="ghost" onClick={() => setConfirmInterest(false)}>Cancelar</Button>
      </Sheet>}

      {detail && (() => {
        const c = state.campaigns.find(x => x.id === detail.id) ?? detail;
        const me = mine(c);
        const full = !me && c.participants.length >= c.capacity;
        return <Sheet title={c.name} onClose={() => setDetail(null)}>
          <p className="text-sm text-muted-foreground">{c.description}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex gap-2"><MapPin className="size-4 text-primary" />{c.establishment}</li>
            <li className="flex gap-2"><CalendarDays className="size-4 text-primary" />{c.date}</li>
            <li className="flex gap-2"><Clock3 className="size-4 text-primary" />{c.time}</li>
            <li className="flex gap-2"><Users className="size-4 text-primary" />{c.participants.length} / {c.capacity} cupos</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Confirmar asistencia registra tu participación en esta campaña; es distinto de tu interés general.</p>
          {registered
            ? <Button className="mt-4 w-full" variant="vivid" onClick={() => { const t = `${c.name} · ${c.establishment} · ${c.date}. ¡Súmate como donante de CPH!`; if (navigator.share) navigator.share({ text: t }).catch(() => {}); else navigator.clipboard?.writeText(t); setMessage("Comparte esta campaña con tus amigos y familiares."); }}><Share2 />Compartir campaña</Button>
            : me?.status === "CONFIRMADO"
            ? <p role="status" className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-success/15 p-3 text-sm font-extrabold text-success"><CheckCircle2 className="size-5" />Asistencia CONFIRMADA</p>
            : <Button className="mt-4 w-full" variant="vivid" disabled={full} onClick={() => { update(confirmAttendance(state, c.id)); setMessage("¡Tu asistencia quedó confirmada!"); }}>{full ? "Campaña sin cupos" : "Confirmar asistencia"}</Button>}
          {message && <p role="status" className="mt-2 text-center text-xs font-bold text-success">{message}</p>}
        </Sheet>;
      })()}
    </section>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/30 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
    <div className="mx-auto w-full max-w-[448px] rounded-xl bg-surface p-5 text-foreground shadow-panel" onClick={e => e.stopPropagation()}>
      <h2 className="mb-3 text-lg font-extrabold">{title}</h2>{children}
    </div>
  </div>;
}
