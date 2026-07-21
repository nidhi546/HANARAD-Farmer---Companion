import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { journeySteps } from "@/lib/content";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="From first launch to your first harvest insight"
          description="No complicated setup — HANARAD gets you from onboarding to a personalized farming dashboard in minutes."
        />

        <RevealGroup className="relative mt-16 grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent lg:block" />
          {journeySteps.map((step) => (
            <RevealItem key={step.step} className="relative">
              <div className="glass-card h-full rounded-2xl p-7">
                <span className="text-gradient-gold text-3xl font-extrabold">
                  {step.step}
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-subtext">
                  {step.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
