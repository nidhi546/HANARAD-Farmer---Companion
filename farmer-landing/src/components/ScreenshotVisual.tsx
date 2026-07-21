import { type Screenshot } from "@/lib/content";
import { Icon } from "@/lib/icons";

const accentMap = {
  green: { text: "text-brand-mint-300", bar: "from-brand-mint-400 to-brand-green-600", ring: "stroke-brand-mint-400" },
  gold: { text: "text-brand-gold-300", bar: "from-brand-gold-300 to-brand-gold-500", ring: "stroke-brand-gold-400" },
  indigo: { text: "text-[#a5b4fc]", bar: "from-[#a5b4fc] to-brand-indigo-500", ring: "stroke-brand-indigo-500" },
};

export function ScreenshotVisual({ screenshot }: { screenshot: Screenshot }) {
  const accent = accentMap[screenshot.accent];

  switch (screenshot.id) {
    case "home":
      return (
        <div className="flex h-full flex-col gap-2 p-4 pt-8">
          <div className="h-14 rounded-xl border border-white/10 bg-white/5" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
          <div className="mt-1 h-16 rounded-xl border border-white/10 bg-white/5" />
        </div>
      );
    case "map":
      return (
        <div className="relative flex h-full items-center justify-center p-6">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <rect x="4" y="4" width="92" height="92" rx="8" className="fill-white/[0.03] stroke-white/10" />
            <polygon
              points="30,25 78,20 85,60 45,80 20,55"
              className={`fill-brand-gold-400/10 stroke-brand-gold-400`}
              strokeWidth="1.5"
            />
            {["30,25", "78,20", "85,60", "45,80", "20,55"].map((p) => {
              const [cx, cy] = p.split(",");
              return <circle key={p} cx={cx} cy={cy} r="2.2" className="fill-brand-gold-300" />;
            })}
          </svg>
        </div>
      );
    case "weather":
      return (
        <div className="flex h-full flex-col justify-end gap-2 p-4 pb-8">
          <div className="flex items-end gap-1.5">
            {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-t bg-gradient-to-t ${accent.bar}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-[8px] text-white/40">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        </div>
      );
    case "crops":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
          <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
            <circle cx="50" cy="50" r="42" className="fill-none stroke-white/10" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              className={`fill-none ${accent.ring}`}
              strokeWidth="8"
              strokeDasharray={264}
              strokeDashoffset={264 * 0.08}
              strokeLinecap="round"
            />
          </svg>
          <p className={`text-2xl font-extrabold ${accent.text}`}>92</p>
          <p className="text-[10px] text-white/50">Climate-fit score</p>
        </div>
      );
    case "mandi":
      return (
        <div className="flex h-full flex-col justify-center gap-3 p-5">
          {[
            { label: "Cotton", value: "₹6,250" },
            { label: "Wheat", value: "₹2,380" },
            { label: "Groundnut", value: "₹5,900" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5"
            >
              <span className="text-[11px] text-white/60">{row.label}</span>
              <span className={`text-xs font-bold ${accent.text}`}>{row.value}</span>
            </div>
          ))}
        </div>
      );
    case "disease":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <Icon name="scan-line" className={`h-10 w-10 ${accent.text}`} />
            <div className={`absolute inset-x-3 top-1/2 h-0.5 bg-gradient-to-r ${accent.bar} animate-pulse-slow`} />
          </div>
          <p className="text-[11px] text-white/50">Analyzing leaf pattern…</p>
        </div>
      );
    default:
      return null;
  }
}
