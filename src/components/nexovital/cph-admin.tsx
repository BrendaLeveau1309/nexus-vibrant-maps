import { useEffect, useState, type FormEvent } from "react";
import { Archive, CalendarDays, CheckCircle2, HeartHandshake, Megaphone, Send, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { closeCampaign, hospitalInterests, isFinished, loadCph, saveCph, setAttendance, subscribeCph, type Campaign, type CphState } from "@/lib/cph-store";

export function CphAdmin({ hospital }: { hospital: string }) {
  const [state, setState] = useState<CphState | null>(null);
  const [filter, setFilter] = useState<"Todas" | "BORRADOR" | "PUBLICADA" | "Historial">("Todas");
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState<Campaign | null>(null);
  const [closing, setClosing] = useState<Campaign | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showInterested, setShowInterested] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { const r = () => setState(loadCph()); r(); return subscribeCph(r); }, []);
  if (!state) return null;
  const update = (next: CphState) => { saveCph(next); setState(next); };
  const own = state.campaigns.filter(c => c.establishment === hospital);
  const interested = hospitalInterests(state, hospital);
  const waiting = interested.filter(i => i.status === "En espera").length;
  const today = new Date().toISOString().slice(0, 10);
  const statusOf = (c: Campaign) => isFinished(c, today) ? "FINALIZADA" : c.status;
  const list = own.filter(c => filter === "Todas" || (filter === "Historial" ? statusOf(c) === "FINALIZADA" : statusOf(c) === filter));
  const confirmed = own.reduce((n, c) => n + c.participants.filter(p => p.status === "CONFIRMADO").length, 0);
  const current = selected ? state.campaigns.find(c => c.id === selected) : null;
  const canMark = (c: Campaign) => statusOf(c) === "PUBLICADA" && c.date <= today;

  const create = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const capacity = Number(d.get("capacity"));
    const name = String(d.get("name") ?? "").trim();
    if (!name || !capacity || capacity < 1) { setMsg({ ok: false, text: "Completa los campos y una capacidad válida." }); return; }
    const c: Campaign = { id: `cph-${Date.now()}`, name, description: String(d.get("description") ?? ""), establishment: hospital, date: String(d.get("date") ?? ""), time: `${d.get("start")} - ${d.get("end")}`, capacity, status: "BORRADOR", participants: [] };
    update({ ...state, campaigns: [c, ...state.campaigns] });
    setCreating(false); setMsg({ ok: true, text: `Borrador “${name}” guardado.` });
  };
  const publish = () => {
    if (!publishing) return;
    update({ ...state, campaigns: state.campaigns.map(c => c.id === publishing.id ? { ...c, status: "PUBLICADA" } : c) });
    setMsg({ ok: true, text: `Campaña publicada. Ya es visible en la app y se notificó a ${interested.length} interesados en ${hospital}.` });
    setPublishing(null);
  };

  return <>
    <h2 className="text-3xl font-extrabold">Campañas CPH</h2>
    <p className="text-muted-foreground">Campañas de células progenitoras hematopoyéticas de {hospital}.</p>
    {msg && <p role="status" className={`mt-5 rounded-lg p-3 text-sm font-bold ${msg.ok ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"}`}>{msg.text}</p>}
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {([[interested.length, "Interesados en este hospital", HeartHandshake, "tint-primary"], [own.filter(c => statusOf(c) === "PUBLICADA").length, "Campañas activas", Megaphone, "tint-teal"], [confirmed, "Participantes confirmados", Users, "tint-gold"]] as const).map(([v, l, Icon, t]) =>
        <article key={l} className={`rounded-xl border p-6 shadow-sm ${t}`}><Icon className="size-5 text-primary" /><p className="mt-3 text-3xl font-extrabold">{v}</p><p className="text-sm text-muted-foreground">{l}</p>{l === "Interesados en este hospital" && <><p className="mt-1 text-xs font-bold text-warning">{waiting} en espera de campaña</p><Button size="sm" variant="outline" className="mt-3" onClick={() => setShowInterested(true)}>Ver interesados</Button></>}</article>)}
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Solo se cuentan donantes que eligieron este hospital como preferencia. El interés activo no equivale a participación confirmada en una campaña.</p>

    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1">{(["Todas", "BORRADOR", "PUBLICADA", "Historial"] as const).map(f => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>)}</div>
      <Button variant="vivid" onClick={() => { setMsg(null); setCreating(true); }}><Megaphone />Nueva campaña</Button>
    </div>
    <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Campaña</th><th className="p-3">Establecimiento</th><th className="p-3">Fecha</th><th className="p-3">Cupos</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th></tr></thead>
        <tbody>{list.map(c => <tr key={c.id} className="border-t">
          <td className="p-3 font-bold">{c.name}</td><td className="p-3">{c.establishment}</td><td className="p-3">{c.date} · {c.time}</td>
          <td className="p-3">{c.participants.length}/{c.capacity}</td>
          <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${statusOf(c) === "PUBLICADA" ? "bg-success/15 text-success" : statusOf(c) === "FINALIZADA" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{statusOf(c)}</span></td>
          <td className="p-3 text-right"><div className="flex justify-end gap-2">
            {c.status === "BORRADOR" && <Button size="sm" variant="vivid" onClick={() => setPublishing(c)}><Send />Publicar</Button>}
            {statusOf(c) === "PUBLICADA" && <Button size="sm" variant="destructive" onClick={() => setClosing(c)}><Archive />Cerrar campaña</Button>}
            <Button size="sm" variant="outline" onClick={() => setSelected(c.id)}>Participantes</Button>
          </div></td>
        </tr>)}
        {list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No hay campañas con este filtro.</td></tr>}</tbody>
      </table>
    </div>

    {current && <section className="mt-6 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold">Participantes · {current.name}</h3><Button size="icon" variant="ghost" aria-label="Cerrar" onClick={() => setSelected(null)}><X /></Button></div>
      <p className="text-xs text-muted-foreground">{statusOf(current) === "FINALIZADA" ? "Campaña finalizada: la asistencia ya no se puede modificar." : canMark(current) ? "Campaña activa: registra la asistencia de los confirmados." : "La asistencia se habilita el día de la campaña, mientras esté activa."}</p>
      {current.participants.filter(p => p.status === "CONFIRMADO").length === 0 && <p className="mt-4 text-sm text-muted-foreground">Aún no hay participantes confirmados.</p>}
      <div className="mt-3 divide-y">{current.participants.filter(p => p.status === "CONFIRMADO").map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
        <span className="font-semibold">{p.name} <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${p.status === "CONFIRMADO" ? "bg-chart-teal/15 text-chart-teal" : "bg-muted text-muted-foreground"}`}>{p.status}</span></span>
        {p.status === "CONFIRMADO" && (canMark(current)
          ? <div className="flex gap-2">{(["ASISTIO", "NO_ASISTIO"] as const).map(a => <Button key={a} size="sm" variant={p.attendance === a ? "default" : "outline"} onClick={() => { update(setAttendance(state, current.id, p.id, a)); setMsg({ ok: true, text: `Asistencia registrada: ${p.name} · ${a}` }); }}>{a === "ASISTIO" ? <CheckCircle2 /> : <X />}{a}</Button>)}</div>
          : <span className="text-xs font-bold text-muted-foreground">{p.attendance ?? "Pendiente"}</span>)}
      </div>)}</div>
    </section>}

    {creating && <Dialog title="Nueva campaña CPH" onClose={() => setCreating(false)}>
      <form onSubmit={create} className="space-y-3">
        <In label="Nombre" name="name" /><label className="block text-sm font-bold">Descripción<textarea name="description" required maxLength={500} className="mt-1 w-full rounded-lg border bg-surface px-3 py-2" /></label>
        <p className="text-sm"><b>Establecimiento:</b> {hospital}</p>
        <div className="grid grid-cols-3 gap-2"><In label="Fecha" name="date" type="date" /><In label="Inicio" name="start" type="time" /><In label="Fin" name="end" type="time" /></div>
        <In label="Capacidad" name="capacity" type="number" />
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-4" />La campaña se guarda como BORRADOR hasta publicarla.</p>
        <Button className="w-full" variant="vivid">Guardar borrador</Button>
      </form>
    </Dialog>}
    {showInterested && <Dialog title="Interesados en este hospital" onClose={() => setShowInterested(false)}>
      <p className="text-xs text-muted-foreground">La participación es voluntaria: usa esta lista para dimensionar nuevas campañas, no para contactar individualmente.</p>
      {interested.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Aún no hay interesados.</p>}
      <div className="mt-3 max-h-80 divide-y overflow-y-auto">{interested.map(i => <div key={i.id} className="flex items-center justify-between gap-2 py-2 text-sm">
        <span><b>{i.name}</b><span className="block text-xs text-muted-foreground">Registro: {i.registeredAt}</span></span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${i.status === "Inscrito" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{i.status}</span>
      </div>)}</div>
    </Dialog>}
    {closing && <Dialog title="Cerrar campaña" onClose={() => setClosing(null)}>
      <p className="text-sm text-muted-foreground">“{closing.name}” pasará al historial como FINALIZADA: no aceptará nuevas confirmaciones ni cambios de asistencia. Registra la asistencia antes de cerrarla.</p>
      <p className="mt-2 text-xs text-muted-foreground">Si olvidas cerrarla, se finaliza automáticamente al pasar su fecha.</p>
      <div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setClosing(null)}>Cancelar</Button><Button variant="destructive" className="flex-1" onClick={() => { update(closeCampaign(state, closing.id)); setMsg({ ok: true, text: `“${closing.name}” se cerró y pasó al historial.` }); setClosing(null); }}><Archive />Cerrar campaña</Button></div>
    </Dialog>}
    {publishing && <Dialog title="Publicar campaña" onClose={() => setPublishing(null)}>
      <p className="text-sm text-muted-foreground">“{publishing.name}” pasará a PUBLICADA, será visible en la app móvil y se notificará a los usuarios con interés activo.</p>
      <div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setPublishing(null)}>Cancelar</Button><Button variant="vivid" className="flex-1" onClick={publish}><Send />Publicar campaña</Button></div>
    </Dialog>}
  </>;
}

function In({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return <label className="block text-sm font-bold">{label}<input name={name} type={type} required min={type === "number" ? 1 : undefined} maxLength={120} className="mt-1 w-full rounded-lg border bg-surface px-3 py-2 font-normal" /></label>;
}
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-panel"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-extrabold">{title}</h3><Button size="icon" variant="ghost" aria-label="Cerrar" onClick={onClose}><X /></Button></div>{children}</div>
  </div>;
}
