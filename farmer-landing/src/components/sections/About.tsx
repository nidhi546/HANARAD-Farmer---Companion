import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { RevealGroup, RevealItem, Reveal } from "@/components/Reveal";
import { Icon } from "@/lib/icons";
import { aboutPoints } from "@/lib/content";

export function About() {
  return (
    <section id="about" className="relative py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="About the app"
          title="Built for farmers, by people who care"
          description="Small and marginal farmers are often the last to get access to accurate weather, market, and crop data. HANARAD Farmer-Companion closes that gap — putting corner-grade agricultural intelligence in every farmer's pocket, for free."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {aboutPoints.map((point) => (
            <RevealItem key={point.title}>
              <div className="glass-card h-full rounded-2xl p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold-500/20 to-brand-gold-700/20 ring-1 ring-brand-gold-400/20">
                  <Icon name={point.icon} className="h-6 w-6 text-brand-gold-300" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-subtext">
                  {point.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="mt-14">
          <div className="glass-card mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl px-8 py-8 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green-700 to-brand-green-900 ring-1 ring-white/10">
              <Icon name="leaf" className="h-7 w-7 text-brand-mint-300" />
            </div>
            <p className="text-sm leading-relaxed text-subtext">
              <span className="font-semibold text-foreground">
                Our mission is simple:
              </span>{" "}
              give every farmer — regardless of literacy, connectivity, or
              language — the same quality of climate and market intelligence
              that large agribusinesses take for granted.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
