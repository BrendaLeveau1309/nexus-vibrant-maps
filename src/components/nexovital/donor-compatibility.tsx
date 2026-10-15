import { CheckCircle2, Heart, Info, Star } from "lucide-react";
import { bloodCompatibility } from "@/lib/donor-recognition";

export function DonorCompatibility({ blood }: { blood: string }) {
  const { donateTo, receiveFrom } = bloodCompatibility(blood);
  return <section className="mt-5 border-y py-4" aria-label="Compatibilidad sanguínea">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-extrabold"><Heart className="size-5 text-primary"/>Tu Compatibilidad ({blood || "—"})</h2>
      {blood === "O-" && <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><Star className="size-3"/>Donante universal</span>}
    </div>
    {donateTo.length > 0 ? <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="rounded-lg border border-chart-teal/30 bg-chart-teal/10 p-3">
        <h3 className="flex items-center gap-1.5 text-xs font-extrabold text-chart-teal"><CheckCircle2 className="size-4 shrink-0"/>Puedes Donar A:</h3>
        <div className="mt-2 flex flex-wrap gap-1">{donateTo.map(type => <span key={type} className="rounded-full bg-chart-teal px-2 py-0.5 text-xs font-extrabold text-primary-foreground">{type}</span>)}</div>
      </div>
      <div className="rounded-lg border border-compatibility/30 bg-compatibility/10 p-3">
        <h3 className="flex items-center gap-1.5 text-xs font-extrabold text-compatibility"><Info className="size-4 shrink-0"/>Puedes Recibir De:</h3>
        <div className="mt-2 flex flex-wrap gap-1">{receiveFrom.map(type => <span key={type} className="rounded-full bg-compatibility px-2 py-0.5 text-xs font-extrabold text-primary-foreground">{type}</span>)}</div>
      </div>
    </div> : <p className="mt-3 text-xs text-muted-foreground">Grupo sanguíneo pendiente de registro.</p>}
    <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Compatibilidad de glóbulos rojos. Requiere evaluación y confirmación del personal de salud.</p>
  </section>;
}