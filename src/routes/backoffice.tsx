import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Activity, ArrowRight, Building2, ClipboardPlus, Droplets, Eye, EyeOff, FileText, Heart, HeartPulse, LayoutDashboard, Lock, LogOut, Megaphone, Monitor, Search, Smartphone, User, UserPlus, Users, X, type LucideIcon } from "lucide-react";
import { NexoLogo } from "@/components/nexovital/logo";
import { Button } from "@/components/ui/button";
import { CphAdmin } from "@/components/nexovital/cph-admin";
import { LiquidRed } from "@/components/nexovital/liquid-red";

export const Route = createFileRoute("/backoffice")({
  head: () => ({ meta: [
    { title: "Backoffice — NexoVital" },
    { name: "description", content: "Gestión segura de establecimientos, solicitudes y procesos de donación de NexoVital." },
    { property: "og:title", content: "Backoffice — NexoVital" },
    { property: "og:description", content: "Operación hospitalaria y administración de la red NexoVital." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Backoffice,
});

type Section = "dashboard" | "requests" | "process" | "staff" | "centers" | "cph";
type Role = "hospital" | "admin";
// Padrón demo para autocompletar nombres a partir del DNI.
const DNI_REGISTRY: Record<string, string> = {
  "45678912": "Juan Quispe Huamán", "46789123": "Lucía Ramos Torres", "40881234": "Miguel Flores Rojas", "71234560": "Rosa Paredes Díaz",
  "72345678": "Carmen Salazar Vega", "43219876": "Pedro Gutiérrez León", "70123456": "Andrea Castillo Ruiz", "44556677": "Luis Mendoza Chávez",
};
const lookupDni = (dni: string) => DNI_REGISTRY[dni.replace(/\D/g, "")] ?? null;
function DniField({ label, name }: { label: string; name: string }) {
  const [v, setV] = useState("");
  const found = v.length === 8 ? lookupDni(v) : null;
  return <label className="block text-sm font-bold">{label}<input required name={name} value={v} onChange={e => setV(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" pattern="\d{8}" className="mt-2 w-full rounded-lg border p-3" placeholder="8 dígitos" />
    {v.length > 0 && v.length < 8 && <span className="mt-1 block text-xs font-semibold text-destructive">El DNI debe tener 8 dígitos</span>}
    {v.length === 8 && (found ? <span className="mt-1 block text-xs font-semibold text-success">{found}</span> : <input required name={`${name}Name`} maxLength={120} className="mt-2 w-full rounded-lg border p-3 font-normal" placeholder="Nombres y apellidos" />)}</label>;
}

type DialogKind = "request" | "staff" | "center" | null;

type Center = { name: string; address: string; active: boolean };
type StaffMember = { name: string; document: string; center: string; active: boolean };
type Request = {
  code: string; patient: string; patientDoc: string; blood: string; rh: string;
  requesterDoc?: string; requesterName?: string; originHospital?: string;
  units: number; fulfilled: number; urgency: string; status: "En proceso" | "Atendida" | "Cancelada";
  created: string; closed: string | null;
  donations: { alias: string; status: string; result: string }[];
};

const initialCenters: Center[] = [
  { name: "Hospital Nacional Dos de Mayo", address: "Av. Grau 13, Lima", active: true },
  { name: "Hospital Edgardo Rebagliati", address: "Av. Rebagliati 490, Jesús María", active: true },
  { name: "Clínica Internacional", address: "Av. Washington 1475, Lima", active: false },
];
const initialStaff: StaffMember[] = [
  { name: "Ana Torres", document: "DNI 45612378", center: "Hospital Nacional Dos de Mayo", active: true },
  { name: "Carlos Ruiz", document: "DNI 41236789", center: "Hospital Edgardo Rebagliati", active: true },
  { name: "María Vega", document: "DNI 70981234", center: "Clínica Internacional", active: false },
];
const DAY = 24 * 60 * 60 * 1000;
const seedRequests: (Request & { createdAt: number })[] = [
  { code: "NV-28491", patient: "J. Quispe", patientDoc: "DNI 45678912", blood: "O", rh: "+", units: 3, fulfilled: 1, urgency: "Alta", status: "En proceso", created: "hoy", closed: null, createdAt: Date.now() - 2 * 60 * 60 * 1000, donations: [{ alias: "Donante 1", status: "Exitosa", result: "Donación exitosa · APTO" }, { alias: "Donante 2", status: "No realizada", result: "Donación no realizada" }] },
  { code: "NV-28480", patient: "L. Ramos", patientDoc: "DNI 46789123", blood: "A", rh: "-", units: 2, fulfilled: 0, urgency: "Alta", status: "En proceso", created: "ayer", closed: null, createdAt: Date.now() - 30 * 60 * 60 * 1000, donations: [] },
  { code: "NV-28473", patient: "M. Flores", patientDoc: "DNI 40881234", blood: "A", rh: "+", units: 2, fulfilled: 2, urgency: "Media", status: "Atendida", created: "20 sep 2026", closed: "21 sep 2026", createdAt: 0, donations: [{ alias: "Donante 1", status: "Exitosa", result: "Donación exitosa · APTO" }, { alias: "Donante 2", status: "No exitosa", result: "Donación no exitosa · NO APTO TEMPORALMENTE" }] },
  { code: "NV-28441", patient: "R. Paredes", patientDoc: "DNI 71234560", blood: "B", rh: "-", units: 1, fulfilled: 0, urgency: "Baja", status: "Cancelada", created: "10 sep 2026", closed: "11 sep 2026", createdAt: 0, donations: [] },
];
// Regla: una solicitud solo tiene vigencia de un día; vencida pasa a Cancelada.
const initialRequests: Request[] = seedRequests.map(({ createdAt, ...r }) => r.status === "En proceso" && Date.now() - createdAt > DAY ? { ...r, status: "Cancelada", closed: "Vencida (24 h)" } : r);

type Step = "identify" | "tamizaje" | "donacion" | "validacion";
const STEPS: [Step, string][] = [["identify", "Identificación"], ["tamizaje", "Tamizaje"], ["donacion", "Donación"], ["validacion", "Validación final"]];
const stepIndex = (s: Step) => STEPS.findIndex(([id]) => id === s);
type ProcessRecord = { code: string; donorDoc: string; step: Step; hb?: string; bp?: string; pulse?: string; donation?: string; updatedBy?: string };
const PROCESS_KEY = "nexovital-hospital-processes";
const loadProcesses = (): Record<string, ProcessRecord> => { try { return JSON.parse(localStorage.getItem(PROCESS_KEY) ?? "{}"); } catch { return {}; } };
const saveProcesses = (v: Record<string, ProcessRecord>) => localStorage.setItem(PROCESS_KEY, JSON.stringify(v));

const donorHistoryDemo = [
  { date: "12 jun 2026", place: "Clínica Internacional", result: "Exitosa", hb: "13.8", bp: "120/80", pulse: 72 },
  { date: "03 ene 2026", place: "Hospital Rebagliati", result: "Exitosa", hb: "13.2", bp: "118/78", pulse: 70 },
];

function Backoffice() {
  const [entered, setEntered] = useState(false);
  const [section, setSection] = useState<Section>("dashboard");
  const [role, setRole] = useState<Role>("hospital");
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [requests, setRequests] = useState(initialRequests);
  const [centers, setCenters] = useState(initialCenters);
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [dniSearch, setDniSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateFilter, setDateFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [recover, setRecover] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [processStep, setProcessStep] = useState<Step>("identify");
  const [processError, setProcessError] = useState("");
  const [record, setRecord] = useState<ProcessRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [processes, setProcesses] = useState<Record<string, ProcessRecord>>({});
  useEffect(() => {
    const refresh = () => setProcesses(loadProcesses());
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);
  const persistProcesses = (all: Record<string, ProcessRecord>) => { saveProcesses(all); setProcesses(all); };
  const activeProcesses = Object.values(processes).filter(p => requests.some(r => r.code === p.code && r.status === "En proceso"));
  const donationUsers = new Set(activeProcesses.filter(p => p.step === "donacion").map(p => p.donorDoc)).size;
  const validationUsers = new Set(activeProcesses.filter(p => p.step === "validacion").map(p => p.donorDoc)).size;

  const open = (kind: DialogKind) => { setNotice(""); setDialog(kind); };
  const navigate = (next: Section) => { setSection(next); setNotice(""); setQuery(""); setSearch(""); setDetail(null); };
  const toggleRole = () => { setRole(role === "admin" ? "hospital" : "admin"); navigate("dashboard"); };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (dialog === "request") {
      const patientDni = String(data.get("patientDoc") ?? ""), requesterDni = String(data.get("requesterDoc") ?? "");
      const patientName = lookupDni(patientDni) ?? String(data.get("patientDocName") ?? "").trim(), requesterName = lookupDni(requesterDni) ?? String(data.get("requesterDocName") ?? "").trim();
      if (!/^\d{8}$/.test(patientDni) || !/^\d{8}$/.test(requesterDni)) { setNotice("Cada DNI debe tener 8 dígitos."); return; }
      if (!patientName || !requesterName) { setNotice("Escribe el nombre y apellido de cada DNI."); return; }
      const code = `NV-${Math.floor(10000 + Math.random() * 90000)}`;
      const blood = String(data.get("blood") ?? "O");
      setRequests(current => [{
        code, patient: patientName, patientDoc: `DNI ${patientDni}`, requesterDoc: `DNI ${requesterDni}`, requesterName, originHospital: String(data.get("origin") ?? "").trim(), blood: blood.replace(/[+-]/, ""), rh: blood.includes("-") ? "-" : "+",
        units: Number(data.get("units") ?? 1), fulfilled: 0, urgency: String(data.get("urgency") ?? "Media"),
        status: "En proceso", created: "hoy", closed: null, donations: [],
      }, ...current]);
      setDialog(null); setNewCode(code); navigate("requests");
      return;
    }
    if (!name) return;
    if (dialog === "staff") { setStaff(current => [{ name, document: String(data.get("document") ?? ""), center: String(data.get("center") ?? ""), active: true }, ...current]); navigate("staff"); }
    if (dialog === "center") { setCenters(current => [{ name, address: String(data.get("address") ?? ""), active: true }, ...current]); navigate("centers"); }
    setDialog(null); setNotice("Registro guardado en esta demostración.");
  };

  const toggleCenter = (name: string) => setCenters(cs => cs.map(c => c.name === name ? { ...c, active: !c.active } : c));
  const toggleStaff = (doc: string) => setStaff(ss => ss.map(s => s.document === doc ? { ...s, active: !s.active } : s));

  if (!entered) {
    const field = "flex items-center gap-3 rounded-lg border bg-surface px-4 focus-within:ring-2 focus-within:ring-primary/40";
    return <main className="grid min-h-screen bg-surface md:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-primary text-primary-foreground md:flex md:flex-col md:items-center md:justify-center">
        <LiquidRed />
        <div className="relative text-center">
          <NexoLogo className="mx-auto block size-44 text-primary-foreground" />
          <h1 className="mt-4 text-6xl font-extrabold tracking-tight">NexoVital</h1>
          <p className="mt-3 text-xl text-primary-foreground/85">Plataforma de gestión de donaciones</p>
        </div>
        <p className="absolute bottom-10 left-10 flex items-center gap-3 text-sm text-primary-foreground/85"><span className="h-px w-8 bg-primary-foreground/70" />Juntos conectamos vidas</p>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center gap-2 md:hidden"><NexoLogo className="size-8 text-primary" /><b className="text-xl">NexoVital</b></div>
          {recover ? <form onSubmit={event => { event.preventDefault(); setNotice("Si el correo está registrado, recibirás instrucciones para recuperar tu acceso."); }}>
            <h2 className="text-4xl font-extrabold">Recuperar acceso</h2>
            <p className="mt-2 text-muted-foreground">Te enviaremos instrucciones a tu correo institucional.</p>
            <label className="mt-8 block text-sm font-bold">Correo institucional<div className={`${field} mt-2`}><User className="size-5 text-muted-foreground" /><input type="email" required className="w-full bg-transparent py-3.5 outline-none" placeholder="nombre@hospital.pe" /></div></label>
            <Button className="mt-6 h-14 w-full text-base" variant="vivid">Enviar instrucciones</Button>
            <Button type="button" className="mt-2 w-full" variant="ghost" onClick={() => { setRecover(false); setNotice(""); }}>Volver</Button>
          </form> : <form onSubmit={event => { event.preventDefault(); setEntered(true); setNotice(""); }}>
            <h2 className="text-4xl font-extrabold">Bienvenido</h2>
            <p className="mt-2 text-lg text-muted-foreground">Inicia sesión en la plataforma NexoVital</p>
            <label className="mt-8 block text-sm font-bold">Tipo de documento<div className={`${field} mt-2`}><FileText className="size-5 text-muted-foreground" /><select className="w-full bg-transparent py-3.5 font-normal outline-none"><option>DNI</option><option>Carné de extranjería</option><option>Pasaporte</option></select></div></label>
            <label className="mt-5 block text-sm font-bold">Número de documento<div className={`${field} mt-2`}><User className="size-5 text-muted-foreground" /><input required inputMode="numeric" className="w-full bg-transparent py-3.5 font-normal outline-none" placeholder="Ingresa tu número de documento" /></div></label>
            <label className="mt-5 block text-sm font-bold">Contraseña<div className={`${field} mt-2`}><Lock className="size-5 text-muted-foreground" /><input required type={showPw ? "text" : "password"} className="w-full bg-transparent py-3.5 font-normal outline-none" placeholder="••••••" /><Button type="button" size="icon" variant="ghost" aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff /> : <Eye />}</Button></div></label>
            <Button type="button" variant="link" className="mt-3 px-0" onClick={() => setRecover(true)}>¿Olvidaste tu contraseña?</Button>
            <Button className="mt-4 h-14 w-full text-base" variant="vivid">Iniciar sesión <ArrowRight /></Button>
            <div className="mt-8 flex flex-col items-center gap-1 border-t pt-6">
              <Button type="button" variant="ghost" className="text-muted-foreground" onClick={() => setEntered(true)}><Monitor />Explorar demostración</Button>
              <Button type="button" variant="ghost" className="text-muted-foreground" onClick={toggleRole}><Users />Vista demo: {role === "admin" ? "Administrador" : "Personal hospitalario"}</Button>
              <Button asChild variant="ghost" className="text-muted-foreground"><Link to="/"><Smartphone />Volver a la app móvil</Link></Button>
            </div>
          </form>}
          {notice && <p role="status" className="mt-3 text-sm text-primary">{notice}</p>}
        </div>
      </section>
    </main>;
  }

  const items: { id: Section; label: string; icon: LucideIcon }[] = role === "admin" ? [{ id: "dashboard", label: "Inicio", icon: LayoutDashboard }, { id: "staff", label: "Personal de salud", icon: UserPlus }, { id: "centers", label: "Establecimientos", icon: Building2 }] : [{ id: "dashboard", label: "Inicio", icon: LayoutDashboard }, { id: "requests", label: "Solicitudes", icon: Droplets }, { id: "process", label: "Proceso activo", icon: Activity }, { id: "cph", label: "Campañas CPH", icon: Megaphone }];

  const centerResults = centers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const requestResults = requests.filter(r =>
    r.code.toLowerCase().includes(query.toLowerCase()) && r.patientDoc.replace(/\D/g, "").includes(dniSearch.replace(/\D/g, "")) &&
    (statusFilter === "Todos" || r.status === statusFilter) &&
    (!dateFilter || r.created.includes(dateFilter))
  );
  const detailRequest = detail ? requests.find(r => r.code === detail) : null;

  const identifyProcess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") ?? "").trim().toUpperCase();
    const doc = String(data.get("donorDoc") ?? "").trim();
    const match = requests.find(r => r.code === code && r.status === "En proceso");
    if (!match || doc.length < 6) { setProcessError("No encontramos una solicitud vigente con ese código y DNI."); return; }
    const all = loadProcesses();
    const existing = all[`${code}|${doc}`] ?? { code, donorDoc: doc, step: "tamizaje" as Step };
    all[`${code}|${doc}`] = existing; persistProcesses(all);
    setRecord(existing); setEditing(false); setProcessError(""); setProcessStep(existing.step);
  };
  const updateRecord = (patch: Partial<ProcessRecord>) => {
    if (!record) return;
    const next = { ...record, ...patch, updatedBy: "Valeria M." };
    const all = loadProcesses(); all[`${next.code}|${next.donorDoc}`] = next; persistProcesses(all); setRecord(next);
  };
  const goStep = (step: Step) => { setEditing(false); setProcessStep(step); if (record) updateRecord({ step }); };
  const finishProcess = (status: string, result: string) => {
    if (!record) return;
    const ok = status === "Exitosa";
    setRequests(rs => rs.map(r => r.code === record.code ? { ...r, fulfilled: ok ? Math.min(r.units, r.fulfilled + 1) : r.fulfilled, donations: [...r.donations, { alias: `Donante ${record.donorDoc}`, status, result }] } : r));
    const all = loadProcesses(); delete all[`${record.code}|${record.donorDoc}`]; persistProcesses(all);
    setRecord(null); setProcessStep("identify"); setNotice(`Proceso cerrado: ${result}. Se registró en el historial de la solicitud.`);
  };

  return <main className="flex min-h-screen bg-bo-canvas"><aside className="bo-sidebar hidden w-64 shrink-0 p-6 text-primary-foreground md:flex md:flex-col"><div className="flex items-center gap-3"><NexoLogo className="size-10" /><b className="text-xl">NexoVital</b></div><p className="mt-8 text-xs font-extrabold uppercase text-primary-foreground/70">{role === "admin" ? "Administración" : "Hospital Dos de Mayo"}</p><nav className="mt-5 space-y-2">{items.map(({ id, label, icon: Icon }) => <Button key={id} className={`h-11 w-full justify-start border-0 ${section === id ? "bg-primary-foreground text-primary hover:bg-primary-foreground" : "bg-transparent text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"}`} variant="ghost" onClick={() => navigate(id)}><Icon />{label}</Button>)}</nav><Button className="mt-auto justify-start bg-transparent text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" variant="ghost" onClick={() => setEntered(false)}><LogOut />Cerrar sesión</Button></aside><section className="min-w-0 flex-1"><header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b bg-surface px-5 py-3 lg:px-8"><div><p className="text-xs font-extrabold uppercase text-primary">{role === "admin" ? "Administrador" : "Personal hospitalario"}</p><h1 className="text-xl font-extrabold">NexoVital <span className="font-medium text-muted-foreground">/ Panel operativo</span></h1></div><div className="flex items-center gap-2"><Button variant="outline" onClick={toggleRole}>Cambiar rol demo</Button><span className="grid size-10 place-items-center rounded-full bg-primary font-extrabold text-primary-foreground">VM</span></div></header><nav className="flex gap-1 overflow-x-auto border-b bg-surface px-4 py-2 md:hidden">{items.map(({ id, label }) => <Button key={id} size="sm" variant={section === id ? "default" : "ghost"} onClick={() => navigate(id)}>{label}</Button>)}<Button size="icon" variant="ghost" aria-label="Cerrar sesión" onClick={() => setEntered(false)}><LogOut /></Button></nav><div className="mx-auto max-w-7xl p-5 lg:p-10">{notice && <p role="status" className="mb-5 rounded-lg bg-accent p-3 text-sm font-bold text-accent-foreground">{notice}</p>}

      {section === "dashboard" && <>
        <section className="bo-hero rounded-2xl p-7 text-primary-foreground sm:p-9">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div className="min-w-0 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em]"><HeartPulse className="size-3.5" />{role === "admin" ? "Administración de red" : "Hospital Dos de Mayo"}</span>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">{role === "admin" ? "Red de establecimientos" : "Buenos días, Valeria"}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/85 sm:text-base">{role === "admin" ? "Consulta un establecimiento y revisa las cuentas de su personal registrado." : "Estas son las atenciones que requieren seguimiento hoy en tu hospital."}</p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-primary-foreground/20 pt-4 text-[11px] font-extrabold uppercase tracking-[0.1em] text-primary-foreground/80">
                <span>{role === "admin" ? `${centers.length} establecimientos en la red` : "Vigencia por solicitud: 24 horas"}</span>
                <span>{role === "admin" ? "Gestión de personal y centros" : "Registro compartido por etapa"}</span>
              </div>
            </div>
            <div className="ml-auto w-full max-w-[230px] rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 p-5">
              <span className="grid size-11 place-items-center rounded-lg bg-primary-foreground/15">{role === "admin" ? <Users className="size-5" /> : <Activity className="size-5" />}</span>
              <p className="mt-4 text-4xl font-extrabold">{role === "admin" ? staff.filter(s => s.active).length : activeProcesses.length}</p>
              <p className="mt-1 text-[11px] font-extrabold uppercase text-primary-foreground/80">{role === "admin" ? "Personal de salud activo" : "Procesos activos"}</p>
            </div>
          </div>
        </section>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">{((role === "admin" ? [[String(centers.filter(c => c.active).length), "Establecimientos activos", Building2], [String(staff.filter(s => s.active).length), "Cuentas activas", Users], [String(staff.filter(s => !s.active).length), "Cuentas desactivadas", UserPlus]] : [[String(requests.filter(r => r.status === "En proceso").length), "Solicitudes en proceso", Activity], [String(requests.filter(r => r.status === "Atendida").length), "Atendidas", Droplets], [String(requests.filter(r => r.status === "Cancelada").length), "Canceladas", Users]]) as [string, string, LucideIcon][]).map(([value, label, Icon], i) => <article key={label} className={`rounded-xl border p-6 shadow-sm ${["tint-primary", "tint-teal", "tint-gold"][i % 3]}`}><span className={`grid size-10 place-items-center rounded-md ${["bg-primary text-primary-foreground", "bg-chart-teal text-primary-foreground", "bg-chart-gold text-secondary-foreground"][i % 3]}`}><Icon className="size-5" /></span><p className="mt-4 text-3xl font-extrabold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></article>)}</div>
        <div className="mt-7 border-t pt-6">
          <h3 className="text-lg font-extrabold">{role === "admin" ? "Buscar por establecimiento" : "Actividad reciente"}</h3>
          <form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); }}><div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-surface px-4"><Search className="size-4 text-muted-foreground" /><input value={search} onChange={event => setSearch(event.target.value)} className="w-full py-3" placeholder={role === "admin" ? "Nombre del establecimiento" : "Código de solicitud"} /></div><Button variant="vivid">Buscar</Button></form>
          {role === "admin" ? (query ? (centerResults.length ? centerResults.map(c => <div key={c.name} className="mt-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><b>{c.name}</b><p className="text-xs text-muted-foreground">{c.address}</p></div><span className={`text-xs font-extrabold ${c.active ? "text-primary" : "text-muted-foreground"}`}>{c.active ? "ACTIVO" : "INACTIVO"}</span></div>
            <div className="mt-3 space-y-2 border-t pt-3">{staff.filter(s => s.center === c.name).map(s => <div key={s.document} className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{s.name} · {s.document}</span><span className={`text-xs font-extrabold ${s.active ? "text-chart-teal" : "text-muted-foreground"}`}>{s.active ? "ACTIVO" : "INACTIVO"}</span></div>)}{!staff.some(s => s.center === c.name) && <p className="text-sm text-muted-foreground">Sin personal registrado.</p>}</div>
          </div>) : <p className="mt-4 text-sm text-muted-foreground">No se encontraron establecimientos.</p>) : <p className="mt-4 text-sm text-muted-foreground">Ingresa el nombre de un establecimiento para consultar su personal.</p>)
          : (query ? requests.filter(r => r.code.toLowerCase().includes(query.toLowerCase())) : requests.slice(0, 5)).map(r => <div key={r.code} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm"><span className="flex min-w-0 items-center gap-3"><b className="truncate">{r.code}</b><StatusChip status={r.status} /></span><span className="text-sm text-muted-foreground">{r.created}</span></div>)}
        </div>
      </>}

      {section === "cph" && role === "hospital" && <CphAdmin hospital="Hospital Nacional Dos de Mayo" />}

      {section === "requests" && <>
        <h2 className="text-3xl font-extrabold">Gestión de solicitudes</h2><p className="text-muted-foreground">Requerimientos del establecimiento.</p>
        <Button className="mt-5" variant="vivid" onClick={() => open("request")}><ClipboardPlus />Nueva solicitud</Button>
        <div className="mt-6 flex flex-wrap gap-2">
          <form className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-surface px-4" onSubmit={e => { e.preventDefault(); setQuery(search.trim()); }}><Search className="size-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} className="w-full py-2.5" placeholder="Buscar por código" /></form>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-surface px-4"><Search className="size-4 text-muted-foreground" /><input value={dniSearch} onChange={e => setDniSearch(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" aria-label="Buscar por DNI del paciente" className="w-full py-2.5" placeholder="Buscar por DNI del paciente" />{dniSearch.length === 8 && <span className="shrink-0 text-xs font-semibold text-muted-foreground">{lookupDni(dniSearch) ?? "No encontrado"}</span>}</div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border bg-surface px-3 py-2.5 text-sm font-semibold">{["Todos", "En proceso", "Atendida", "Cancelada"].map(x => <option key={x}>{x}</option>)}</select>
          <input value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="rounded-lg border bg-surface px-3 py-2.5 text-sm font-semibold" placeholder="Fecha (ej. 28 sep)" />
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border bg-card shadow-sm"><div className="grid min-w-[540px] grid-cols-4 gap-2 bg-muted p-4 text-xs font-extrabold uppercase"><span>Código</span><span>Estado</span><span>Unidades</span><span>Acción</span></div>{requestResults.map(r => <div key={r.code} className="grid min-w-[540px] grid-cols-4 items-center gap-2 border-t p-4 text-sm hover:bg-muted/60 transition-colors"><b>{r.code}</b><StatusChip status={r.status} /><span>{r.fulfilled} / {r.units}</span><Button size="sm" variant="outline" onClick={() => setDetail(r.code)}>Ver detalle</Button></div>)}{!requestResults.length && <p className="p-4 text-sm text-muted-foreground">Sin resultados para los filtros aplicados.</p>}</div>
      </>}

      {section === "process" && <>
        <h2 className="text-3xl font-extrabold">Registro de proceso activo</h2><p className="text-muted-foreground">Registra cada etapa de la atención del donante.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <article aria-label="Usuarios en donación" className="tint-teal rounded-lg border p-4"><Droplets className="size-5 text-chart-teal"/><p className="mt-2 text-2xl font-extrabold">{donationUsers}</p><p className="text-sm font-semibold">En donación</p></article>
          <article aria-label="Usuarios en validación final" className="tint-gold rounded-lg border p-4"><HeartPulse className="size-5 text-chart-gold"/><p className="mt-2 text-2xl font-extrabold">{validationUsers}</p><p className="text-sm font-semibold">En validación final</p></article>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg border bg-card p-5">
            <ol className="flex flex-wrap gap-2 text-xs font-extrabold">{STEPS.map(([id, label], i) => <li key={id} className={`rounded-full px-3 py-1.5 ${processStep === id ? "bg-primary text-primary-foreground" : stepIndex(id) < stepIndex(processStep) ? "bg-chart-teal text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}. {label}</li>)}</ol>
            {record && processStep !== "identify" && <p className="mt-4 rounded-lg bg-accent p-3 text-xs font-semibold text-accent-foreground">Proceso {record.code} · {record.donorDoc}{record.updatedBy ? ` · Último registro: ${record.updatedBy}` : ""}. Cualquier personal del hospital puede continuar desde aquí.</p>}
            {processStep === "identify" && <form className="mt-5" onSubmit={identifyProcess}>
              <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Código de solicitud<input name="code" required className="mt-2 w-full rounded-lg border p-3" placeholder="NV-28491" /></label><label className="text-sm font-bold">DNI del donante<input name="donorDoc" required className="mt-2 w-full rounded-lg border p-3" placeholder="Documento del donante" /></label></div>
              <Button className="mt-5" variant="vivid">Validar proceso activo</Button>
              {processError && <p role="alert" className="mt-3 rounded-lg bg-muted p-3 text-sm font-semibold">{processError}</p>}
            </form>}
            {processStep === "tamizaje" && record && <form key={`t-${editing}`} className="mt-5" onSubmit={e => { e.preventDefault(); const d = new FormData(e.currentTarget); updateRecord({ hb: String(d.get("hb")), bp: String(d.get("bp")), pulse: String(d.get("pulse")) }); setEditing(false); }}>
              <h3 className="font-extrabold">Tamizaje</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">{([["hb", "Hemoglobina (g/dL)"], ["bp", "Presión arterial"], ["pulse", "Pulso (ppm)"]] as const).map(([k, x]) => <label key={k} className="text-sm font-bold">{x}<input name={k} required readOnly={!!record.hb && !editing} defaultValue={record[k] ?? ""} className="mt-2 w-full rounded-lg border p-3 read-only:bg-muted" placeholder="Registrar" /></label>)}</div>
              <div className="mt-5 flex flex-wrap gap-2">
                {(!record.hb || editing) && <Button variant="vivid">Guardar</Button>}
                {record.hb && !editing && <Button type="button" variant="outline" onClick={() => setEditing(true)}>Editar</Button>}
                {record.hb && !editing && <Button type="button" variant="vivid" onClick={() => goStep("donacion")}>Continuar a donación</Button>}
              </div>
            </form>}
            {processStep === "donacion" && record && <div className="mt-5">
              <h3 className="font-extrabold">Donación</h3>
              <p className="mt-2 text-sm text-muted-foreground">Indica si la extracción se realizó según protocolo.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => goStep("tamizaje")}>Volver a tamizaje</Button>
                <Button variant="vivid" onClick={() => { updateRecord({ donation: "realizada" }); goStep("validacion"); }}>Donación realizada</Button>
                <Button variant="destructive" onClick={() => finishProcess("No realizada", "Donación no realizada")}>Donación no realizada</Button>
              </div>
            </div>}
            {processStep === "validacion" && record && <form className="mt-5" onSubmit={e => { e.preventDefault(); const d = new FormData(e.currentTarget); const ok = d.get("result") === "Donación exitosa"; finishProcess(ok ? "Exitosa" : "No exitosa", `${d.get("result")} · ${d.get("fitness")}`); }}>
              <h3 className="font-extrabold">Validación final</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-bold">Resultado<select name="result" className="mt-2 w-full rounded-lg border bg-surface p-3"><option>Donación exitosa</option><option>Donación no exitosa</option></select></label>
                <label className="text-sm font-bold">Aptitud del donante<select name="fitness" className="mt-2 w-full rounded-lg border bg-surface p-3"><option>APTO</option><option>NO APTO TEMPORALMENTE</option><option>NO APTO PERMANENTEMENTE</option></select></label>
                <label className="text-sm font-bold sm:col-span-2">Motivo<input className="mt-2 w-full rounded-lg border p-3" placeholder="Opcional si la donación fue exitosa" /></label>
                <label className="text-sm font-bold">Fecha inicio<input type="date" className="mt-2 w-full rounded-lg border p-3" /></label>
                <label className="text-sm font-bold">Fecha fin<input type="date" className="mt-2 w-full rounded-lg border p-3" /></label>
              </div>
              <div className="mt-5 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => goStep("donacion")}>Editar donación</Button><Button variant="vivid">Registrar validación</Button></div>
            </form>}
          </div>
          <aside className="rounded-lg border bg-card p-5"><h3 className="font-extrabold">Historial de donaciones</h3><p className="mt-1 text-sm text-muted-foreground">Consulta limitada al donante validado.</p>{processStep === "identify" ? <p className="mt-3 text-sm text-muted-foreground">Valida el código y DNI para consultar los antecedentes.</p> : donorHistoryDemo.map(x => <div key={x.date} className="mt-3 rounded-lg bg-muted p-3 text-sm"><p className="font-bold">{x.date} · {x.result}</p><p className="text-xs text-muted-foreground">{x.place} · Hb {x.hb} · {x.bp} · {x.pulse} ppm</p></div>)}</aside>
        </div>
      </>}

      {section === "staff" && <>
        <h2 className="text-3xl font-extrabold">Personal de salud</h2><p className="text-muted-foreground">Cuentas asociadas a un establecimiento, con acceso aislado por hospital.</p>
        <Button className="mt-5" variant="vivid" onClick={() => open("staff")}><UserPlus />Registrar personal</Button>
        <div className="mt-6 space-y-3">{staff.map(s => <div key={s.document} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"><div><b>{s.name}</b><p className="text-xs text-muted-foreground">{s.document} · {s.center}</p><p className={`text-xs font-extrabold ${s.active ? "text-primary" : "text-muted-foreground"}`}>{s.active ? "ACTIVO" : "INACTIVO"}</p></div><Button variant={s.active ? "outline" : "vivid"} size="sm" onClick={() => toggleStaff(s.document)}>{s.active ? "Desactivar" : "Activar"}</Button></div>)}</div>
      </>}

      {section === "centers" && <>
        <h2 className="text-3xl font-extrabold">Establecimientos</h2><p className="text-muted-foreground">Centros que participan en la red.</p>
        <Button className="mt-5" variant="vivid" onClick={() => open("center")}><Building2 />Nuevo establecimiento</Button>
        <div className="mt-6 space-y-3">{centers.map(c => <div key={c.name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"><div><b>{c.name}</b><p className="text-xs text-muted-foreground">{c.address}</p><p className={`text-xs font-extrabold ${c.active ? "text-primary" : "text-muted-foreground"}`}>{c.active ? "ACTIVO" : "INACTIVO"}</p></div><Button variant={c.active ? "outline" : "vivid"} size="sm" onClick={() => toggleCenter(c.name)}>{c.active ? "Desactivar" : "Activar"}</Button></div>)}</div>
      </>}
    </div></section>

    {newCode && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={() => setNewCode(null)}><section role="dialog" aria-modal="true" aria-label="Solicitud creada" className="w-full max-w-md rounded-lg bg-card p-6 text-center shadow-panel" onClick={e => e.stopPropagation()}><p className="text-xs font-extrabold uppercase text-primary">Solicitud registrada</p><p className="mt-3 text-4xl font-extrabold">{newCode}</p><p className="mt-2 text-sm text-muted-foreground">Entrega este código al solicitante para que inicie la búsqueda de donantes.</p><Button className="mt-5 w-full" variant="vivid" onClick={() => setNewCode(null)}>Entendido</Button></section></div>}

    {(dialog || detail) && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" onClick={() => { setDialog(null); setDetail(null); }}><section role="dialog" aria-modal="true" aria-label={detail ? "Detalle" : "Nuevo registro"} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-card p-6 shadow-panel" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-extrabold">{detail ?? (dialog === "request" ? "Nueva solicitud" : dialog === "staff" ? "Registrar personal" : "Nuevo establecimiento")}</h2><Button size="icon" variant="ghost" aria-label="Cerrar" onClick={() => { setDialog(null); setDetail(null); }}><X /></Button></div>
      {detailRequest ? <>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <InfoBox label="Paciente" value={detailRequest.patient} /><InfoBox label="Documento" value={detailRequest.patientDoc} />
          {detailRequest.requesterName && <><InfoBox label="Solicitante" value={detailRequest.requesterName} /><InfoBox label="DNI solicitante" value={detailRequest.requesterDoc ?? ""} /></>}
          {detailRequest.originHospital && <InfoBox label="Hospital de procedencia" value={detailRequest.originHospital} />}
          <InfoBox label="Grupo y Rh" value={`${detailRequest.blood}${detailRequest.rh}`} /><InfoBox label="Urgencia" value={detailRequest.urgency} />
          <InfoBox label="Unidades requeridas" value={String(detailRequest.units)} /><InfoBox label="Atendidas" value={String(detailRequest.fulfilled)} />
          <InfoBox label="Pendientes" value={String(detailRequest.units - detailRequest.fulfilled)} /><InfoBox label="Estado" value={detailRequest.status} />
          <InfoBox label="Creación" value={detailRequest.created} />{detailRequest.closed && <InfoBox label={detailRequest.status === "Cancelada" ? "Cancelación" : "Cierre"} value={detailRequest.closed} />}
        </div>
        <h3 className="mt-5 text-sm font-extrabold uppercase text-muted-foreground">Donaciones asociadas</h3>
        {detailRequest.donations.length ? detailRequest.donations.map(d => <div key={d.alias} className="mt-2 flex items-center justify-between rounded-lg bg-muted p-3 text-sm"><b>{d.alias}</b><span>{d.status} · {d.result}</span></div>) : <p className="mt-2 text-sm text-muted-foreground">Sin donaciones registradas.</p>}
        <Button className="mt-5" variant="outline" onClick={() => setDetail(null)}>Cerrar detalle</Button>
      </> : detail ? <>
        <p className="mt-4 text-sm text-muted-foreground">Registro de demostración.</p>
        <Button className="mt-5" variant="outline" onClick={() => setDetail(null)}>Cerrar detalle</Button>
      </> : <form className="mt-5 space-y-4" onSubmit={save}>
        {dialog === "request" && <>
          <DniField label="DNI del paciente" name="patientDoc" />
          <DniField label="DNI del solicitante" name="requesterDoc" />
          <label className="block text-sm font-bold">Hospital de procedencia<input required name="origin" maxLength={120} className="mt-2 w-full rounded-lg border p-3" placeholder="Hospital que realiza la solicitud" /></label>
          {notice && <p role="alert" className="text-sm font-bold text-destructive">{notice}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold">Grupo sanguíneo<select name="blood" className="mt-2 w-full rounded-lg border bg-surface p-3">{["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(x => <option key={x}>{x}</option>)}</select></label>
            <label className="block text-sm font-bold">Unidades<input name="units" type="number" min="1" max="20" defaultValue="1" required className="mt-2 w-full rounded-lg border p-3" /></label>
          </div>
          <label className="block text-sm font-bold">Nivel de urgencia<select name="urgency" className="mt-2 w-full rounded-lg border bg-surface p-3">{["Alta", "Media", "Baja"].map(x => <option key={x}>{x}</option>)}</select></label>
        </>}
        {dialog === "staff" && <>
          <label className="block text-sm font-bold">Nombre del personal<input required name="name" className="mt-2 w-full rounded-lg border p-3" placeholder="Nombres y apellidos" /></label>
          <label className="block text-sm font-bold">Documento<input required name="document" className="mt-2 w-full rounded-lg border p-3" placeholder="DNI / CE / Pasaporte" /></label>
          <label className="block text-sm font-bold">Establecimiento<select name="center" className="mt-2 w-full rounded-lg border bg-surface p-3">{centers.filter(c => c.active).map(x => <option key={x.name}>{x.name}</option>)}</select></label>
        </>}
        {dialog === "center" && <>
          <label className="block text-sm font-bold">Nombre del establecimiento<input required name="name" className="mt-2 w-full rounded-lg border p-3" placeholder="Ingresa el nombre" /></label>
          <label className="block text-sm font-bold">Dirección<input required name="address" className="mt-2 w-full rounded-lg border p-3" placeholder="Dirección" /></label>
        </>}
        <Button className="w-full" variant="vivid">Guardar</Button>
      </form>}
    </section></div>}
  </main>;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-extrabold">{value}</p></div>;
}

function StatusChip({ status }: { status: string }) {
  const tone = status === "En proceso" ? "bg-primary/10 text-primary" : status === "Atendida" ? "bg-chart-teal/15 text-chart-teal" : "bg-muted text-muted-foreground";
  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold ${tone}`}>{status}</span>;
}
