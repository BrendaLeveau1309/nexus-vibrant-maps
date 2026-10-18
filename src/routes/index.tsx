import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Activity, Bell, CalendarDays, ChevronRight, Clock3, Droplets, Heart, HeartPulse, History, Home, LocateFixed, LogOut, Mail, Menu, Moon, Navigation, Phone, ShieldCheck, Share2, Star, Sun, UserRound, X } from "lucide-react";
import { NexoLogo } from "@/components/nexovital/logo";
import { Button } from "@/components/ui/button";
import { FullScreenMap } from "@/components/nexovital/full-screen-map";
import donationCare from "@/assets/donation-care.jpg";
import { supabase } from "@/integrations/supabase/client";
import { DonorCompatibility } from "@/components/nexovital/donor-compatibility";
import { donorRank } from "@/lib/donor-recognition";
import { CphView } from "@/components/nexovital/cph-view";
import { SplashScreen } from "@/components/nexovital/splash-screen";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "NexoVital — Donación de sangre" },
    { name: "description", content: "Encuentra centros de donación, responde solicitudes compatibles y sigue cada donación." },
    { property: "og:title", content: "NexoVital — Donación de sangre" },
    { property: "og:description", content: "Una red cercana que conecta donantes, familias y centros de salud." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: NexoVitalApp,
});

type View = "home" | "tracking" | "history" | "account";
type AuthMode = "login" | "register" | "recover";
type Role = "donor" | "requester";

const timeline = ["Emparejamiento aceptado", "En camino", "En establecimiento", "En tamizaje", "Donación realizada", "Exitosa"];

const donorHistory = [
  { date: "12 jun 2026", place: "Clínica Internacional", result: "CONCRETADA", hb: 13.8, bp: "120/80", pulse: 72 },
  { date: "03 ene 2026", place: "Hospital Rebagliati", result: "CONCRETADA", hb: 13.2, bp: "118/78", pulse: 70 },
  { date: "18 oct 2025", place: "Hospital Loayza", result: "CANCELADA", hb: 12.9, bp: "122/82", pulse: 75 },
];

const requesterHistory = [
  { code: "NV-28491", status: "En proceso", created: "28 sep 2026", blood: "O+", units: "2 / 3", urgency: "Alta", closed: null },
  { code: "NV-27110", status: "Atendida", created: "14 may 2026", blood: "O+", units: "2 / 2", urgency: "Media", closed: "16 may 2026" },
  { code: "NV-25982", status: "Cancelada", created: "02 feb 2026", blood: "A+", units: "0 / 1", urgency: "Baja", closed: "03 feb 2026" },
];

function NexoVitalApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [view, setView] = useState<View>("home");
  const [role, setRole] = useState<Role>("donor");
  const [showMatch, setShowMatch] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [showAvailability, setShowAvailability] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPanel, setMenuPanel] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const searchTimer = useRef<number | null>(null);

  useEffect(() => {
    setDarkMode(window.localStorage.getItem("nexovital-theme") === "dark");
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, []);
  const toggleTheme = () => setDarkMode(current => {
    window.localStorage.setItem("nexovital-theme", current ? "light" : "dark");
    return !current;
  });
  const changeRole = (next: Role) => {
    setRole(next);
    setView("home");
    setSearchDone(false);
    setSearching(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
  };
  const cancelSearch = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = null;
    setSearching(false);
  };

  useEffect(() => {
    if (!authenticated || !showMatch || role !== "donor") return;
    const deadline = Date.now() + secondsLeft * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) { setShowMatch(false); setShowAvailability(false); }
    }, 250);
    return () => window.clearInterval(timer);
  }, [authenticated, showMatch, role]);

  if (!authenticated) return (
    <PhoneFrame scrollable>
      <SplashScreen />
      <AuthScreen mode={authMode} setMode={setAuthMode} onDemo={() => setAuthenticated(true)} />
    </PhoneFrame>
  );

  const startSearch = () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    searchTimer.current = window.setTimeout(() => { setSearching(false); setSearchDone(true); searchTimer.current = null; }, 2200);
  };

  return (
    <PhoneFrame>
    <main className={`${darkMode ? "dark" : ""} mobile-app relative h-full w-full overflow-hidden bg-mobile-canvas text-foreground`}>
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mobile-header flex items-center justify-between bg-primary px-3 py-3 text-primary-foreground shadow-brand">
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}><Menu /></Button>
          <NexoLogo className="ml-1 size-9 text-primary-foreground" />
          <div className="min-w-0 flex-1 px-2">
            <h1 className="truncate text-base font-extrabold text-primary-foreground">NexoVital</h1>
            <p className="truncate text-xs font-bold text-primary-foreground/85">{role === "donor" ? "Donante" : "Solicitante"} · Hola, Valeria</p>
          </div>
          {role === "donor" && <span className="rounded-md bg-primary-foreground/15 px-3 py-2 text-sm font-extrabold text-primary-foreground">O+</span>}
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" aria-label="Notificaciones" onClick={() => setMenuPanel("notifications")}><Bell /></Button>
        </div>
      </header>
      {view === "home" && (
        <>
          <FullScreenMap />


          {role === "donor" ? (
            <>
              <div className="absolute left-4 top-24 z-10 flex gap-2">
                <span className="glass-panel rounded-full px-3 py-2 text-xs font-bold"><HeartPulse className="mr-1 inline size-4 text-primary" />4 donaciones</span>
                 <span className="glass-panel rounded-full px-3 py-2 text-xs font-bold"><LocateFixed className="mr-1 inline size-4 text-primary" />3 centros cerca</span>
              </div>
               {showMatch && secondsLeft > 0 && (
                <section className="glass-panel absolute inset-x-3 bottom-24 z-20 overflow-hidden rounded-lg border border-border p-4 border-t-4 border-t-chart-teal">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[10px] font-extrabold uppercase text-chart-teal">Solicitud compatible · NV-28491</p><h2 className="mt-1 text-base font-extrabold">Hospital Dos de Mayo</h2></div>
                     <span role="timer" aria-label={`Tiempo restante: ${secondsLeft} segundos`} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-extrabold"><Clock3 className="size-3.5" />00:{String(secondsLeft).padStart(2, "0")}</span>
                  </div>
                  <div className="my-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <Info label="Distancia" value="2.4 km" /><Info label="Requiere" value="O+" /><Info label="Urgencia" value="Alta" urgent />
                   </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="lg" onClick={() => setShowMatch(false)}>Rechazar</Button>
                    <Button variant="vivid" size="lg" onClick={() => setShowAvailability(true)}>Aceptar</Button>
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="glass-panel absolute inset-x-4 bottom-24 z-20 rounded-lg border border-border/70 p-5">
               <p className="text-xs font-extrabold uppercase text-primary">Buscar donantes</p>
              <h2 className="mt-1 text-xl font-extrabold">Ingresa tu código</h2>
              <p className="mt-1 text-sm text-muted-foreground">Lo encontrarás en la solicitud entregada por el hospital.</p>
              <div className="mt-4 flex gap-2">
                <input value={searchCode} onChange={e => setSearchCode(e.target.value)} className="min-w-0 flex-1 rounded-md border bg-surface px-4 py-3 font-bold uppercase" placeholder="Ej. NV-28491" maxLength={12} />
                <Button variant="vivid" size="lg" disabled={searching} onClick={startSearch}><Navigation />{searching ? "Buscando…" : "Buscar"}</Button>
              </div>
            </section>
          )}
        </>
      )}
      {view === "tracking" && <Tracking role={role} />}
      {view === "history" && <HistoryView role={role} />}
      {view === "account" && <Account role={role} darkMode={darkMode} onToggleTheme={toggleTheme} />}

      <nav className="mobile-nav safe-bottom absolute inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-primary-foreground/20 bg-primary px-2 pt-2 text-primary-foreground shadow-panel">
        <NavItem active={view === "home"} icon={Home} label="Inicio" onClick={() => setView("home")} />
        <NavItem active={view === "tracking"} icon={Navigation} label="Tracking" onClick={() => setView("tracking")} />
        <NavItem active={view === "history"} icon={History} label="Historial" onClick={() => setView("history")} />
        <NavItem active={view === "account"} icon={UserRound} label="Cuenta" onClick={() => setView("account")} />
      </nav>

      {showAvailability && <Modal title="¿Cuándo podrías donar?" onClose={() => setShowAvailability(false)}><p className="mb-4 text-sm text-muted-foreground">Indica una fecha estimada para que el hospital prepare tu llegada.</p><input type="datetime-local" className="w-full rounded-md border bg-surface px-4 py-3" /><Button className="mt-4 w-full" variant="vivid" size="lg" onClick={() => { setShowAvailability(false); setShowMatch(false); setView("tracking"); }}>Confirmar disponibilidad</Button></Modal>}
      {searching && <Modal title="Buscando coincidencias" onClose={cancelSearch}>
        <div role="status" aria-live="polite" className="flex flex-col items-center py-8 text-center">
          <div className="grid size-20 place-items-center rounded-full border-4 border-primary/15 border-t-primary motion-safe:animate-spin"><HeartPulse className="size-8 text-primary" /></div>
          <p className="mt-6 text-base font-extrabold">Buscando donantes compatibles</p>
          <p className="mt-2 text-sm text-muted-foreground">Solicitud {searchCode.trim().toUpperCase()}</p>
        </div>
        <Button className="w-full" variant="outline" onClick={cancelSearch}>Cancelar búsqueda</Button>
      </Modal>}
      {searchDone && <Modal title="Búsqueda finalizada" onClose={() => setSearchDone(false)}><p className="mb-4 text-sm text-muted-foreground">Encontramos donantes compatibles para la solicitud {searchCode.toUpperCase()}. Puedes seguir el avance de cada donación.</p><Button className="w-full" variant="vivid" size="lg" onClick={() => { setSearchDone(false); setView("tracking"); }}>Ver seguimiento</Button></Modal>}
      {menuOpen && <SideMenu role={role} onRoleChange={changeRole} darkMode={darkMode} onToggleTheme={toggleTheme} onClose={() => { setMenuOpen(false); setMenuPanel(null); }} onLogout={() => setAuthenticated(false)} onOpen={p => { if (p === "cph") setMenuOpen(false); setMenuPanel(p); }} />}
      {menuPanel === "cph" && <CphView onBack={() => setMenuPanel(null)} />}
      {menuPanel === "notifications" && <Modal title="Gestionar notificaciones" onClose={() => setMenuPanel(null)}><NotificationToggles /></Modal>}
      {menuPanel === "info" && <Modal title="Información para donar" onClose={() => setMenuPanel(null)}><p className="text-sm text-muted-foreground">Puedes donar si tienes entre 18 y 65 años, pesas más de 50 kg y han pasado al menos 3 meses desde tu última donación. Lleva tu documento de identidad y llega hidratado.</p></Modal>}
      {menuPanel === "terms" && <Modal title="Términos y condiciones" onClose={() => setMenuPanel(null)}><p className="text-sm text-muted-foreground">NexoVital conecta donantes voluntarios con solicitudes de sangre verificadas por establecimientos de salud registrados. El uso de la plataforma es gratuito y voluntario.</p></Modal>}
      {menuPanel === "privacy" && <Modal title="Política de privacidad" onClose={() => setMenuPanel(null)}><p className="text-sm text-muted-foreground">Tus datos personales y de salud solo se comparten con el establecimiento que atiende la solicitud que aceptaste. La identidad de donantes y solicitantes se mantiene anónima entre ambas partes.</p></Modal>}
    </main>
    </PhoneFrame>
  );
}

/** Marco de teléfono: bisel y sombra en monitores, pantalla completa en celulares. */
function PhoneFrame({ children, scrollable = false }: { children: ReactNode; scrollable?: boolean }) {
  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center bg-zinc-950 sm:px-4 sm:py-6">
      <div className={`relative h-[100svh] w-full sm:h-[min(960px,calc(100svh-2rem))] sm:max-w-[440px] sm:rounded-[48px] sm:border-[12px] sm:border-zinc-800 sm:shadow-2xl ${scrollable ? "overflow-y-auto no-scrollbar" : "overflow-hidden"}`}>
        {children}
      </div>
    </div>
  );
}

function NotificationToggles() {
  const [flags, setFlags] = useState({ matches: true, reminders: true, campaigns: true });
  const items: { key: keyof typeof flags; label: string }[] = [
    { key: "matches", label: "Recibir solicitudes compatibles" },
    { key: "reminders", label: "Recordatorios de donación" },
    { key: "campaigns", label: "Información y campañas" },
  ];
  return <div className="mt-2 space-y-1">{items.map(({ key, label }) => (
    <Button variant="ghost" role="switch" aria-checked={flags[key]} key={key} onClick={() => setFlags(f => ({ ...f, [key]: !f[key] }))} className="flex h-auto w-full items-center justify-between gap-3 border-b py-3 text-left text-sm font-semibold whitespace-normal">
      {label}
      <span className={`relative h-6 w-11 rounded-full transition-colors ${flags[key] ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-surface shadow transition-all ${flags[key] ? "left-[22px]" : "left-0.5"}`} /></span>
    </Button>
  ))}</div>;
}

function AuthScreen({ mode, setMode, onDemo }: { mode: AuthMode; setMode: (mode: AuthMode) => void; onDemo: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const documentNumber = String(form.get("document") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!/^\w{6,20}$/.test(documentNumber) || password.length < 8) { setMessage("Revisa el documento y usa una contraseña de al menos 8 caracteres."); setBusy(false); return; }
    setMessage("Para ingresar con documento, primero crea tu cuenta con un correo válido."); setBusy(false);
  };

  return <main className="min-h-full bg-primary px-5 py-8 text-foreground"><div className="mx-auto flex min-h-full max-w-md flex-col justify-center">
    <div className="mb-7 flex items-center justify-center gap-3"><NexoLogo className="size-14 text-primary-foreground" /><div><p className="text-2xl font-extrabold text-primary-foreground">NexoVital</p><p className="text-sm text-primary-foreground/80">Donar nos conecta</p></div></div>
    <section className="overflow-hidden rounded-lg bg-card shadow-panel">
      {mode === "login" && <div className="relative h-36 overflow-hidden"><img src={donationCare} alt="Atención durante una donación de sangre" width={1536} height={1024} className="h-full w-full object-cover object-[center_60%]" /><span className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-md bg-surface/95 px-2.5 py-1.5 text-xs font-semibold text-foreground"><HeartPulse className="size-3.5 text-primary" />Donar nos conecta</span></div>}
      <div className="p-6 sm:p-8">
      <p className="text-xs font-extrabold uppercase text-primary">{mode === "login" ? "Bienvenido de vuelta" : mode === "register" ? "Únete a la red" : "Recupera tu acceso"}</p>
      <h1 className="mt-2 text-3xl font-extrabold">{mode === "login" ? "Inicia sesión" : mode === "register" ? "Crea tu cuenta" : "Nueva contraseña"}</h1>
      {mode === "login" && <form className="mt-6 space-y-4" onSubmit={submitLogin}><FieldSelect label="Tipo de documento" name="type" options={["DNI","CE","Pasaporte"]}/><Field label="Número de documento" name="document" placeholder="Ingresa tu documento" /><Field label="Contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres"/><Button type="button" variant="link" onClick={() => setMode("recover")} className="h-auto justify-start px-0 py-1 text-xs">¿Olvidaste tu contraseña?</Button><Button className="w-full" variant="vivid" size="lg" disabled={busy}>Iniciar sesión</Button><Button className="w-full" variant="ghost" type="button" onClick={() => setMode("register")}>Crear una cuenta</Button></form>}
      {mode === "register" && <RegisterForm onDone={() => setMode("login")} setMessage={setMessage} />}
      {mode === "recover" && <RecoverFlow onDone={() => { setMode("login"); setMessage(""); }} />}
      {message && <p role="status" className="mt-4 rounded-md bg-muted p-3 text-sm font-semibold">{message}</p>}
      </div>
    </section>
    <Button variant="ghost" className="mt-4 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={onDemo}>Explorar prototipo <ChevronRight /></Button>
     <a href="/backoffice" className="mt-2 text-center text-xs font-bold text-primary-foreground/80">Acceso para personal de salud</a>
  </div></main>;
}

function RecoverFlow({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"request" | "code" | "reset" | "done">("request");
  const [error, setError] = useState("");

  if (step === "request") return <div className="mt-6 space-y-4">
    <p className="text-sm text-muted-foreground">Enviaremos un código de verificación a tu teléfono y correo registrados.</p>
    <div className="rounded-md bg-muted p-4 text-sm font-bold"><p>Teléfono: ######19</p><p className="mt-1">Correo: ######@gmail.com</p></div>
    <Button className="w-full" variant="vivid" size="lg" onClick={() => setStep("code")}>Enviar código</Button>
    <Button className="w-full" variant="ghost" type="button" onClick={onDone}>Cancelar</Button>
  </div>;

  if (step === "code") return <form className="mt-6 space-y-4" onSubmit={e => { e.preventDefault(); const code = String(new FormData(e.currentTarget).get("code") ?? ""); if (!/^\d{6}$/.test(code)) return setError("Ingresa el código de 6 dígitos."); setError(""); setStep("reset"); }}>
    <p className="text-sm text-muted-foreground">Ingresa el código de 6 dígitos que enviamos a tu teléfono y correo.</p>
    <Field label="Código de verificación" name="code" placeholder="••••••" />
    <Button type="button" variant="link" className="px-0" onClick={() => setError("Te reenviamos el código.")}>Reenviar código</Button>
    <Button className="w-full" variant="vivid" size="lg">Validar código</Button>
    {error && <p role="status" className="rounded-md bg-muted p-3 text-sm font-semibold">{error}</p>}
  </form>;

  if (step === "reset") return <form className="mt-6 space-y-4" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); const next = String(f.get("password") ?? ""); if (next.length < 8 || next !== String(f.get("confirm") ?? "")) return setError("Las contraseñas no coinciden o tienen menos de 8 caracteres."); const email = String(f.get("email") ?? "").trim(); if (email.includes("@")) await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); setError(""); setStep("done"); }}>
    <Field label="Nueva contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres" />
    <Field label="Confirmar nueva contraseña" name="confirm" type="password" placeholder="Repite la contraseña" />
    <Button className="w-full" variant="vivid" size="lg">Restablecer contraseña</Button>
    {error && <p role="status" className="rounded-md bg-muted p-3 text-sm font-semibold">{error}</p>}
  </form>;

  return <div className="mt-6 space-y-4">
    <p role="status" className="rounded-md bg-accent p-4 text-sm font-bold text-accent-foreground">Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión.</p>
    <Button className="w-full" variant="vivid" size="lg" onClick={onDone}>Volver al inicio de sesión</Button>
  </div>;
}

function RegisterForm({ onDone, setMessage }: { onDone: () => void; setMessage: (value: string) => void }) {
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const f = new FormData(event.currentTarget); const email=String(f.get("email")??"").trim(); const password=String(f.get("password")??""); if (!email.includes("@") || password.length < 8 || password !== String(f.get("confirm")??"")) return setMessage("Revisa el correo y confirma una contraseña de al menos 8 caracteres."); const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }); setMessage(error ? "No pudimos crear la cuenta." : "Revisa tu correo para confirmar la cuenta. Luego podrás iniciar sesión."); if (!error) setTimeout(onDone, 1800); };
  return <form className="mt-6 grid grid-cols-2 gap-3" onSubmit={submit}><FieldSelect label="Documento" name="type" options={["DNI","CE","Pasaporte"]}/><Field label="Número" name="document" placeholder="Documento"/><div className="col-span-2"><Field label="Nombres y apellidos" name="name" placeholder="Se completará al validar"/></div><div className="col-span-2"><Field label="Correo" name="email" type="email" placeholder="nombre@correo.com"/></div><div className="col-span-2"><Field label="Teléfono" name="phone" placeholder="999 999 999"/></div><FieldSelect label="Grupo" name="blood" options={["A","B","AB","O"]}/><FieldSelect label="Factor Rh" name="rh" options={["+","-"]}/><div className="col-span-2"><Field label="Contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres"/></div><div className="col-span-2"><Field label="Confirmar" name="confirm" type="password" placeholder="Repite la contraseña"/></div><label className="col-span-2 flex gap-2 text-xs text-muted-foreground"><input type="checkbox" required/>Acepto los términos y la política de privacidad.</label><Button className="col-span-2" variant="vivid" size="lg">Crear cuenta</Button><Button className="col-span-2" variant="ghost" type="button" onClick={onDone}>Cancelar</Button></form>;
}

function Tracking({ role }: { role: Role }) {
  const [openDonor, setOpenDonor] = useState<number | null>(0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string> | null>(null);
  useEffect(() => { try { const raw = localStorage.getItem(QUIZ_KEY); if (raw) setAnswers(JSON.parse(raw)); } catch { /* ignore */ } }, []);

  if (role === "requester") {
    const donors = [
      { alias: "Donante 1", status: "En camino", step: 1 },
      { alias: "Donante 2", status: "Emparejamiento aceptado", step: 0 },
    ];
    return <div className="h-full overflow-y-auto px-5 pb-28 pt-28">
      <p className="text-xs font-extrabold uppercase text-primary">Seguimiento activo</p>
      <h1 className="mt-2 text-2xl font-extrabold">Solicitud NV-28491</h1>
      <section className="mt-5 overflow-hidden rounded-lg border bg-card shadow-sm" aria-label="Resumen de solicitud">
        <div className="flex flex-wrap items-start justify-between gap-3 bg-primary px-5 py-4 text-primary-foreground">
          <div><p className="text-xs font-bold text-primary-foreground/80">GRUPO SOLICITADO</p><p className="mt-1 flex items-center gap-2 text-3xl font-extrabold"><Droplets className="size-6" /> O+</p></div>
          <span className="rounded-md bg-secondary px-3 py-1.5 text-xs font-extrabold text-secondary-foreground">Urgencia alta</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">Paciente</p>
          <p className="mt-1 font-extrabold">J. Quispe <span className="font-medium text-muted-foreground">· DNI 45678912</span></p>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Unidades cubiertas</p><p className="mt-1 font-extrabold">2 de 3</p></div>
            <div><p className="text-xs text-muted-foreground">Estado</p><p className="mt-1 font-extrabold text-primary">En proceso</p></div>
            <div className="col-span-2 flex items-center gap-2 border-t pt-3 text-muted-foreground"><CalendarDays className="size-4" /> Creada el 28 sep 2026</div>
          </div>
        </div>
      </section>
      <h2 className="mt-6 text-sm font-extrabold uppercase text-muted-foreground">Donantes conectados</h2>
      {donors.map((d, i) => <article key={d.alias} className="mt-3 rounded-lg border bg-card">
        <Button variant="ghost" className="flex h-auto w-full items-center justify-between p-4 text-left" onClick={() => setOpenDonor(openDonor === i ? null : i)}>
          <div><p className="font-extrabold">{d.alias}</p><p className="text-xs font-bold text-primary">{d.status}</p></div>
          <ChevronRight className={`size-4 text-muted-foreground transition-transform ${openDonor === i ? "rotate-90" : ""}`} />
        </Button>
        {openDonor === i && <div className="space-y-0 px-4 pb-4">{timeline.map((item, j) => <div key={item} className="flex gap-3"><div className="flex flex-col items-center"><span className={`grid size-6 place-items-center rounded-full text-[10px] font-extrabold ${j <= d.step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{j < d.step ? "✓" : j + 1}</span>{j < timeline.length - 1 && <span className={`h-6 w-0.5 ${j < d.step ? "bg-primary" : "bg-border"}`} />}</div><p className={`text-sm ${j === d.step ? "font-extrabold" : "text-muted-foreground"}`}>{item}</p></div>)}</div>}
      </article>)}
    </div>;
  }

  return <div className="h-full overflow-y-auto px-5 pb-28 pt-28"><p className="text-xs font-extrabold uppercase text-primary">Seguimiento activo</p><h1 className="mt-2 text-2xl font-extrabold">Tu donación</h1><div className="mt-5 rounded-lg bg-primary p-5 text-primary-foreground shadow-brand"><p className="text-sm opacity-80">Hospital Dos de Mayo · 2.4 km</p><div className="mt-3 flex items-end justify-between"><span className="text-4xl font-extrabold">O+</span><span className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold text-secondary-foreground">Urgencia alta</span></div></div><div className="mt-7 space-y-0">{timeline.map((item,i)=><div key={item} className="flex gap-4"><div className="flex flex-col items-center"><span className={`grid size-8 place-items-center rounded-full ${i<=1?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground"}`}>{i<1?"✓":i+1}</span>{i<timeline.length-1&&<span className={`${i===3?"h-24":"h-12"} w-0.5 ${i<1?"bg-primary":"bg-border"}`}/>}</div><div><p className="font-extrabold">{item}</p><p className="text-xs text-muted-foreground">{i===1?"Estado actual":i<1?"Completado":"Pendiente"}</p>{i===3&&<Button size="sm" variant="outline" className="mt-2" onClick={() => setQuizOpen(true)}>{answers ? "Ver mi código QR" : "Cuestionario predonación (opcional)"}</Button>}</div></div>)}</div>
    {quizOpen && <PreDonationQuiz answers={answers} onSave={a => { setAnswers(a); localStorage.setItem(QUIZ_KEY, JSON.stringify(a)); }} onClose={() => setQuizOpen(false)} />}
    {cancelled ? <p role="status" className="mt-4 rounded-md bg-muted p-3 text-sm font-bold">Proceso cancelado. El solicitante fue notificado y podrá buscar nuevos donantes.</p> : confirmCancel ? <div className="mt-4 rounded-lg border border-destructive/40 bg-card p-4"><p className="text-sm font-bold">¿Seguro que deseas cancelar la donación? El solicitante será notificado.</p><div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setConfirmCancel(false)}>Volver</Button><Button variant="vivid" onClick={() => { setCancelled(true); setConfirmCancel(false); }}>Sí, cancelar</Button></div></div> : <Button className="mt-4 w-full" variant="outline" onClick={() => setConfirmCancel(true)}>Cancelar proceso</Button>}
  </div>;
}

function MiniChart({ label, values, unit }: { label: string; values: number[]; unit: string }) {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const spread = Math.max(high - low, 1);
  const coords = values.map((value, index) => ({ x: 18 + index * (264 / Math.max(1, values.length - 1)), y: 108 - (value - (low - spread * 0.35)) / (high - low + spread * 0.7) * 82 }));
  const points = coords.map(({ x, y }) => `${x},${y}`).join(" ");
  const dates = ["Oct 25", "Ene 26", "Jun 26"];
  const colorClass = label === "Hemoglobina" ? "text-primary" : label === "Pulso" ? "text-chart-gold" : "text-chart-teal";
  const difference = (values.at(-1) ?? 0) - (values[0] ?? 0);
  return <article className="rounded-lg border bg-card p-4" aria-label={`${label}: ${values.map((v, i) => `${dates[i]} ${v} ${unit}`).join(", ")}`}>
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-extrabold">{label}</h2><p className="mt-0.5 text-xs text-muted-foreground">Últimos {values.length} registros</p></div><div className="text-right"><p className={`text-xl font-extrabold ${colorClass}`}>{values[values.length - 1]} <span className="text-xs font-semibold">{unit}</span></p><p className="text-xs text-muted-foreground">{difference === 0 ? "Sin variación" : `${difference > 0 ? "+" : ""}${Number(difference.toFixed(1))} desde ${dates[0]}`}</p></div></div>
    <div className={`mt-4 ${colorClass}`}><svg viewBox="0 0 300 126" className="h-32 w-full overflow-visible" role="img" aria-label={`Evolución de ${label.toLowerCase()}`} preserveAspectRatio="none">
      {[26, 67, 108].map(y => <line key={y} x1="18" x2="282" y1={y} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4" />)}
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(({x,y}, i) => <g key={i}><circle cx={x} cy={y} r="6" fill="var(--card)" stroke="currentColor" strokeWidth="3" /><text x={x} y={Math.max(14, y - 13)} textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700">{values[i]}</text></g>)}
    </svg></div>
    <div className="flex justify-between px-1 text-xs font-semibold text-muted-foreground">{dates.map(date => <span key={date}>{date}</span>)}</div>
  </article>;
}

function HistoryView({ role }: { role: Role }) {
  const [tab, setTab] = useState<"history" | "stats">("history");

  if (role === "requester") return <div className="h-full overflow-y-auto px-5 pb-28 pt-28">
    <p className="text-xs font-extrabold uppercase text-primary">Tus solicitudes</p>
    <h1 className="mt-2 text-2xl font-extrabold">Historial</h1>
    <div className="mt-5 space-y-3">{requesterHistory.map(r => <article key={r.code} className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-extrabold">{r.code}</p><p className="text-sm text-muted-foreground">{r.created} · {r.blood} · {r.units} unidades</p></div><span className="text-xs font-extrabold text-primary">{r.status.toUpperCase()}</span></div>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground"><span>Urgencia {r.urgency}</span>{r.closed && <span>Cierre: {r.closed}</span>}</div>
    </article>)}</div>
  </div>;

  return <div className="h-full overflow-y-auto px-5 pb-28 pt-28">
    <p className="text-xs font-extrabold uppercase text-primary">Tu impacto</p>
    <h1 className="mt-2 text-2xl font-extrabold">Historial</h1>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Button variant={tab === "history" ? "vivid" : "outline"} onClick={() => setTab("history")}>Historial</Button>
      <Button variant={tab === "stats" ? "vivid" : "outline"} onClick={() => setTab("stats")}>Estadísticas</Button>
    </div>
    {tab === "history" ? <>
      <div className="mt-5 grid grid-cols-3 gap-2"><Info label="Última" value="12 jun"/><Info label="Próxima" value="12 dic"/><Info label="Exitosas" value="4"/></div>
      <div className="mt-6 space-y-3">{donorHistory.map(r => <article key={r.date} className="rounded-lg border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-extrabold">{r.place}</p><p className="text-sm text-muted-foreground">{r.date} · O+</p></div><span className="text-xs font-extrabold text-primary">{r.result}</span></div><div className="mt-3 flex gap-4 text-xs text-muted-foreground"><span>Hb {r.hb}</span><span>{r.bp}</span><span>{r.pulse} ppm</span></div></article>)}</div>
    </> : <div className="mt-5 space-y-3">
      <MiniChart label="Hemoglobina" values={[...donorHistory].reverse().map(r => r.hb)} unit="g/dL" />
      <MiniChart label="Presión sistólica" values={[...donorHistory].reverse().map(r => Number(r.bp.split("/")[0]))} unit="mmHg" />
      <MiniChart label="Pulso" values={[...donorHistory].reverse().map(r => r.pulse)} unit="ppm" />
    </div>}
  </div>;
}

function Account({role,darkMode,onToggleTheme}:{role:Role;darkMode:boolean;onToggleTheme:()=>void}){
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");
  const [profile, setProfile] = useState<{ name: string; blood: string; donations: number; document: string; email: string; phone: string; available: boolean; fitness: string } | null>(null);
  const [profileState, setProfileState] = useState<"loading" | "demo" | "ready" | "error">("loading");
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) { setProfileState("error"); return; }
      if (!session) {
        setProfile({ name: "Valeria Mendoza", blood: "O+", donations: donorHistory.filter(d => d.result === "CONCRETADA").length, document: "DNI 72918421", email: "valeria@email.com", phone: "+51 987 654 321", available: true, fitness: "APTO" });
        setProfileState("demo"); return;
      }
      const [person, donations] = await Promise.all([
        supabase.from("profiles").select("first_names,last_names,blood_group,rh_factor,document_type,document_number,email,phone,donor_available,donor_fitness").eq("id", session.user.id).maybeSingle(),
        supabase.from("donations").select("id", { count: "exact", head: true }).eq("donor_id", session.user.id).eq("status", "exitosa"),
      ]);
      if (!active) return;
      if (person.error || donations.error || !person.data) { setProfileState("error"); return; }
      const p = person.data;
      setProfile({ name: `${p.first_names} ${p.last_names}`.trim(), blood: p.blood_group && p.rh_factor ? `${p.blood_group}${p.rh_factor}` : "", donations: donations.count ?? 0, document: `${p.document_type} ${p.document_number}`, email: p.email, phone: p.phone, available: p.donor_available, fitness: p.donor_fitness });
      setProfileState("ready");
    };
    void load();
    return () => { active = false; };
  }, []);
  const shareText = `🩸 Soy donante de sangre voluntario en NexoVital. Grupo: ${profile?.blood ?? ""} • Donaciones: ${profile?.donations ?? 0} • ¡Dona sangre y salva vidas!`;
  const shareDonorCard = async () => {
    if (!profile?.blood) return;
    setShareError("");
    if (navigator.share) {
      try { await navigator.share({ title: "NexoVital", text: shareText }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch { setShareError("No se pudo copiar el texto. Revisa los permisos del navegador."); }
  };
  return <div className="h-full overflow-y-auto px-5 pb-28 pt-28">
  <p className="text-xs font-extrabold uppercase text-primary">Mi cuenta</p><h1 className="mt-2 text-2xl font-extrabold">Cuenta</h1>
  {profileState === "loading" && <p role="status" className="mt-6 text-sm text-muted-foreground">Cargando perfil…</p>}
  {profileState === "error" && <p role="alert" className="mt-6 text-sm text-destructive">No pudimos cargar tu perfil. Vuelve a abrir Cuenta para reintentar.</p>}
  {profileState === "demo" && <p className="mt-4 text-xs text-muted-foreground">Perfil de demostración</p>}
  {role === "requester" && profile && <div className="mt-6 flex items-center gap-4 border-b pb-6"><UserRound className="size-8 text-primary"/><div className="min-w-0"><h2 className="text-xl font-extrabold">{profile.name}</h2><p className="mt-1 text-sm text-muted-foreground">Perfil de solicitante</p></div></div>}
  {role === "donor" && profile && <section className="donor-card mt-4 rounded-lg p-5 text-primary-foreground" aria-label="Carnet digital de donante">
    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-primary-foreground/85"><ShieldCheck className="size-6 shrink-0"/>Carnet digital de donante</p>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-foreground px-3 py-2 text-xl font-extrabold text-primary"><Droplets className="size-5"/>{profile.blood || "—"}</span>
    </div>
    <h2 className="mt-3 break-words text-2xl font-extrabold leading-tight">{profile.name}</h2>
    <div className="mt-5 grid grid-cols-3 gap-2">
      <div className="donor-stat"><Droplets className="size-4"/><p>Donaciones</p><strong>{profile.donations}</strong></div>
      <div className="donor-stat"><Heart className="size-4"/><p>Vidas Salvadas</p><strong>~{profile.donations * 3}</strong></div>
      <div className="donor-stat"><Star className="size-4 text-secondary"/><p>Rango</p><strong className="text-secondary">{donorRank(profile.donations)} ★</strong></div>
    </div>
    <p className="mt-2 text-[9px] text-primary-foreground/70">Impacto estimado: hasta 3 vidas por donación.</p>
    <div className="mt-3 flex justify-end"><Button size="sm" variant="outline" disabled={!profile.blood} className="gap-2 rounded-full border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground" onClick={shareDonorCard}><Share2 className="size-4"/>Compartir</Button></div>
    {copied && <p role="status" className="mt-2 text-right text-xs font-bold">¡Texto copiado!</p>}
    {shareError && <p role="alert" className="mt-2 text-xs">{shareError}</p>}
  </section>}
  {role === "donor" && profile && <DonorCompatibility blood={profile.blood}/>}
  {profile && <section className="mt-6"><h2 className="text-xs font-extrabold uppercase text-muted-foreground">Datos personales</h2><div className="mt-2 divide-y border-y"><AccountRow icon={ShieldCheck} label="Documento" value={profile.document}/><AccountRow icon={Mail} label="Correo electrónico" value={profile.email}/><AccountRow icon={Phone} label="Teléfono" value={profile.phone}/></div></section>}
  {role === "donor" && profile && <section className="mt-7"><h2 className="text-xs font-extrabold uppercase text-muted-foreground">Información de donación</h2><div className="mt-2 divide-y border-y"><AccountRow icon={Droplets} label="Grupo sanguíneo" value={profile.blood || "Sin registrar"}/><AccountRow icon={HeartPulse} label="Disponibilidad" value={profile.available ? "Disponible" : "No disponible"}/><AccountRow icon={Activity} label="Aptitud" value={profile.fitness}/></div></section>}
  <section className="mt-7"><h2 className="text-xs font-extrabold uppercase text-muted-foreground">Apariencia</h2><Button variant="ghost" className="mt-2 flex h-auto w-full justify-start gap-3 border-y py-4 text-left text-foreground" onClick={onToggleTheme} aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}>{darkMode ? <Sun className="size-5 text-primary"/> : <Moon className="size-5 text-primary"/>}<span className="flex-1 font-bold">{darkMode ? "Modo claro" : "Modo oscuro"}</span></Button></section>
</div>}
function AccountRow({icon:Icon,label,value}:{icon:typeof Home;label:string;value:string}){return <div className="flex min-h-16 items-center gap-3 py-3"><Icon className="size-5 shrink-0 text-primary"/><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="break-words text-sm font-bold">{value}</p></div></div>}

function SideMenu({role,onRoleChange,darkMode,onToggleTheme,onClose,onLogout,onOpen}:{role:Role;onRoleChange:(r:Role)=>void;darkMode:boolean;onToggleTheme:()=>void;onClose:()=>void;onLogout:()=>void;onOpen:(panel:string)=>void}){
  const items: { label: string; panel: string }[] = [
    { label: "Ser donante de CPH", panel: "cph" },
    { label: "Gestionar notificaciones", panel: "notifications" },
    { label: "Información para donar", panel: "info" },
    { label: "Términos y condiciones", panel: "terms" },
    { label: "Política de privacidad", panel: "privacy" },
  ];
  return <div className="absolute inset-0 z-50 bg-foreground/20" onClick={onClose}><aside className="h-full w-[84%] overflow-y-auto bg-surface p-5 text-foreground shadow-panel" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between"><b className="flex items-center gap-2 text-xl"><NexoLogo className="size-8 text-primary" />NexoVital</b><Button size="icon" variant="ghost" aria-label="Cerrar" onClick={onClose}><X/></Button></div><div className="mt-8 rounded-lg bg-accent p-4"><p className="text-xs font-bold text-primary">MODO ACTUAL</p><p className="text-xl font-extrabold">{role==="donor"?"Donante":"Solicitante"}</p><Button className="mt-3 w-full" variant="outline" onClick={()=>{onRoleChange(role==="donor"?"requester":"donor");onClose();}}>Cambiar de modo</Button></div><Button variant="ghost" className="mt-4 w-full justify-start text-foreground" onClick={onToggleTheme}>{darkMode ? <Sun/> : <Moon/>}{darkMode ? "Modo claro" : "Modo oscuro"}</Button>{items.map(x=><Button variant="ghost" key={x.panel} onClick={()=>onOpen(x.panel)} className="flex h-auto w-full items-center justify-between border-b px-0 py-4 text-left text-sm font-semibold whitespace-normal">{x.label}<ChevronRight className="size-4"/></Button>)}<Button className="mt-8 w-full text-foreground" variant="ghost" onClick={onLogout}><LogOut/>Cerrar sesión</Button></aside></div>;
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="absolute inset-0 z-50 grid place-items-end bg-foreground/30 p-4" role="dialog" aria-modal="true" aria-label={title}><div className="max-h-[85svh] w-full overflow-y-auto rounded-lg bg-surface p-5 text-foreground shadow-panel"><div className="flex justify-between"><h2 className="text-xl font-extrabold">{title}</h2><Button size="icon" variant="ghost" className="text-foreground" aria-label="Cerrar" onClick={onClose}><X/></Button></div>{children}</div></div>}
function Info({label,value,urgent=false}:{label:string;value:string;urgent?:boolean}){return <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">{label}</p><p className={`mt-1 font-extrabold ${urgent?"text-destructive":"text-foreground"}`}>{value}</p></div>}
function NavItem({active,icon:Icon,label,onClick}:{active:boolean;icon:typeof Home;label:string;onClick:()=>void}){return <Button variant="ghost" aria-current={active ? "page" : undefined} onClick={onClick} className={`flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-bold ${active?"bg-primary-foreground/20 text-primary-foreground":"text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"}`}><Icon className="size-5"/>{label}</Button>}
function Field({label,name,type="text",placeholder}:{label:string;name:string;type?:string;placeholder:string}){return <label className="block text-sm font-bold">{label}<input name={name} type={type} required maxLength={255} placeholder={placeholder} className="mt-1.5 w-full rounded-md border bg-surface px-4 py-3 font-normal"/></label>}
function FieldSelect({label,name,options}:{label:string;name:string;options:string[]}){return <label className="block text-sm font-bold">{label}<select name={name} className="mt-1.5 w-full rounded-md border bg-surface px-3 py-3 font-normal">{options.map(x=><option key={x}>{x}</option>)}</select></label>}

const QUIZ_KEY = "nexovital-predonacion";
const QUIZ = [
  "¿Te sientes bien de salud hoy?",
  "¿Has dormido al menos 6 horas anoche?",
  "¿Has comido algo en las últimas 4 horas?",
  "¿Has tenido fiebre, gripe o infección en los últimos 14 días?",
  "¿Has tomado antibióticos u otros medicamentos en la última semana?",
  "¿Te has hecho un tatuaje, piercing o acupuntura en los últimos 12 meses?",
  "¿Has tenido alguna cirugía o transfusión en los últimos 12 meses?",
  "¿Has consumido alcohol en las últimas 24 horas?",
];
function PreDonationQuiz({ answers, onSave, onClose }: { answers: Record<string, string> | null; onSave: (a: Record<string, string>) => void; onClose: () => void }) {
  const [editing, setEditing] = useState(!answers);
  const [draft, setDraft] = useState<Record<string, string>>(answers ?? {});
  const complete = QUIZ.every((_, i) => draft[i]);
  const code = `NX-TAMIZAJE-${(JSON.stringify(answers ?? {}).split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 100000000).toString().padStart(8, "0")}`;
  return <Modal title={editing ? "Cuestionario predonación" : "Tu código de tamizaje"} onClose={onClose}>
    {editing ? <div className="mt-4 space-y-4">
      {QUIZ.map((q, i) => <fieldset key={q} className="rounded-md border p-3"><legend className="px-1 text-sm font-bold">{q}</legend><div className="mt-2 grid grid-cols-2 gap-2">{["Sí", "No"].map(opt => <Button key={opt} type="button" size="sm" variant={draft[i] === opt ? "default" : "outline"} onClick={() => setDraft({ ...draft, [i]: opt })}>{opt}</Button>)}</div></fieldset>)}
      <Button className="w-full" disabled={!complete} onClick={() => { onSave(draft); setEditing(false); }}>Guardar respuestas</Button>
      {!complete && <p className="text-center text-xs text-muted-foreground">Responde todas las preguntas para guardar.</p>}
    </div> : <div className="mt-4 flex flex-col items-center gap-3 text-center">
      <div className="rounded-lg bg-surface p-3 shadow-sm"><QRCodeSVG value={JSON.stringify({ code, donor: "DEMO", answers })} size={200} /></div>
      <p className="font-mono text-sm font-extrabold">{code}</p>
      <p className="text-sm text-muted-foreground">Muestra este código al personal del banco de sangre para verificar tus respuestas.</p>
      <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>Revisar o editar respuestas</Button>
    </div>}
  </Modal>;
}
