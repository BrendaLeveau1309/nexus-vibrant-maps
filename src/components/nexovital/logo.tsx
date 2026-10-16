import logo from "@/assets/nexovital-logo.png.asset.json";

/** NexoVital logo tinted with the current text color (works on red or white surfaces). */
export function NexoLogo({ className = "size-8" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Logo de NexoVital"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{ maskImage: `url(${logo.url})`, WebkitMaskImage: `url(${logo.url})`, maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}
    />
  );
}
