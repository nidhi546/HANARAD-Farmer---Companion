export function BackgroundGlow({ variant = "hero" }: { variant?: "hero" | "section" }) {
  if (variant === "hero") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-brand-green-600/30 blur-[120px]" />
        <div className="absolute -top-10 right-[8%] h-72 w-72 rounded-full bg-brand-gold-500/20 blur-[100px] animate-pulse-slow" />
        <div className="absolute top-40 left-[4%] h-64 w-64 rounded-full bg-brand-mint-400/10 blur-[110px]" />
      </div>
    );
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-green-700/15 blur-[140px]" />
    </div>
  );
}
