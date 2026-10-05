import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { Icon } from "@/lib/icons";
import { primaryFeatures, secondaryFeatures } from "@/lib/content";

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <BackgroundGlow variant="section" />
      <Container className="relative">
        <SectionHeading
          eyebrow="Everything a farmer needs"
          title="One app, replacing five"
          description="From satellite farm mapping to AI disease detection, HANARAD brings every core farming tool into a single, multilingual dashboard."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {primaryFeatures.map((feature) => (
            <RevealItem key={feature.title}>
              <div className="glass-card group relative h-full overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1">
                {feature.tag && (
                  <span className="absolute right-5 top-5 rounded-full border border-brand-gold-400/30 bg-brand-gold-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-gold-300">
                    {feature.tag}
                  </span>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-green-700 to-brand-green-900 ring-1 ring-white/10">
                  <Icon name={feature.icon} className="h-6 w-6 text-brand-mint-300" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-subtext">
                  {feature.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <RevealGroup className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {secondaryFeatures.map((feature) => (
            <RevealItem key={feature.title}>
              <div className="glass-card h-full rounded-xl p-5 transition-colors">
                <Icon name={feature.icon} className="h-5 w-5 text-brand-gold-300" />
                <h4 className="mt-3 text-sm font-semibold text-foreground">
                  {feature.title}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-subtext">
                  {feature.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
