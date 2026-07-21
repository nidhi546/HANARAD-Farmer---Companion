import { Icon } from "@/lib/icons";

const miniCards = [
  { icon: "sprout", label: "Crop Advisor", value: "Cotton · 92%" },
  { icon: "line-chart", label: "Mandi Price", value: "₹6,250 /qtl" },
  { icon: "bell-ring", label: "Alerts", value: "2 new" },
  { icon: "map-pinned", label: "Farm Map", value: "2.4 acres" },
];

export function HeroDevice() {
  return (
    <div className="flex h-full flex-col px-4 pb-6 pt-9 text-white">
      <div className="flex items-center justify-between text-[10px] text-white/60">
        <span>9:41</span>
        <span>●●●● 5G 100%</span>
      </div>

      <div className="mt-5">
        <p className="text-[11px] text-brand-mint-300">Good Morning</p>
        <p className="text-lg font-bold">Farmer 🌾</p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">32°C</p>
            <p className="text-xs text-white/60">Sunny & Warm</p>
          </div>
          <span className="text-3xl">☀️</span>
        </div>
        <div className="mt-3 flex justify-between text-[11px] text-white/55">
          <span>💧 65% humidity</span>
          <span>💨 12 km/h</span>
          <span>🌧 0mm</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {miniCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
          >
            <Icon name={card.icon} className="h-4 w-4 text-brand-gold-300" />
            <p className="mt-2 text-[10px] text-white/55">{card.label}</p>
            <p className="text-xs font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto rounded-xl border border-brand-gold-400/30 bg-brand-gold-400/10 p-3 text-[10px] text-brand-gold-200">
        🛰️ NASA data synced 4 min ago
      </div>
    </div>
  );
}
