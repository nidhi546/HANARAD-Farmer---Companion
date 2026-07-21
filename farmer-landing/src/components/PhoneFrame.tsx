import { type ReactNode } from "react";
import clsx from "clsx";

export function PhoneFrame({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "compact";
}) {
  return (
    <div
      className={clsx(
        "relative mx-auto rounded-[2.75rem] border-[6px] border-white/10 bg-brand-green-900 shadow-2xl shadow-black/50",
        size === "default" ? "aspect-[9/19] w-[280px]" : "aspect-[9/19] w-[220px]",
        className
      )}
    >
      <div className="absolute left-1/2 top-2.5 z-10 h-4 w-24 -translate-x-1/2 rounded-full bg-black/70" />
      <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-brand-green-800 via-brand-green-900 to-[#020806]">
        {children}
      </div>
    </div>
  );
}
