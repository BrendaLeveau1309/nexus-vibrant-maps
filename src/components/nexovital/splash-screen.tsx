import { useEffect, useRef, useState } from "react";
import splash from "@/assets/splash.mp4.asset.json";

const KEY = "nexovital-splash-seen";

/** Video splash shown once per app session, then fades out over the main screen. */
export function SplashScreen() {
  const [phase, setPhase] = useState<"playing" | "leaving" | "done">("playing");
  const ref = useRef<HTMLVideoElement>(null);

  const finish = () => setPhase(p => (p === "playing" ? "leaving" : p));

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) { setPhase("done"); return; }
    sessionStorage.setItem(KEY, "1");
    ref.current?.play().catch(finish);
    const safety = window.setTimeout(finish, 10000);
    return () => window.clearTimeout(safety);
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    const t = window.setTimeout(() => setPhase("done"), 700);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;
  return (
    <div aria-hidden="true" className={`absolute inset-0 z-[100] bg-primary transition-opacity duration-700 ease-out ${phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"}`}>
      <video ref={ref} src={splash.url} muted playsInline autoPlay preload="auto" onEnded={finish} onError={finish} className={`h-full w-full object-cover transition-transform duration-700 ${phase === "leaving" ? "scale-105" : "scale-100"}`} />
    </div>
  );
}
