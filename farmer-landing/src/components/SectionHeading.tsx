import clsx from "clsx";
import { Reveal } from "@/components/Reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <Reveal
      className={clsx(
        "mx-auto max-w-2xl",
        align === "center" ? "text-center" : "text-left"
      )}
    >
      <span className="inline-flex items-center rounded-full border border-border bg-white/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-mint-300">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg leading-relaxed text-subtext">
          {description}
        </p>
      )}
    </Reveal>
  );
}
