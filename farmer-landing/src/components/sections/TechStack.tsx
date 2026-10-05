import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { techStack } from "@/lib/content";

export function TechStack() {
  return (
    <section className="relative py-24 lg:py-32">
      <BackgroundGlow variant="section" />
      <Container className="relative">
        <SectionHeading
          eyebrow="Under the hood"
          title="Powered by trusted, real-world data"
          description="HANARAD is built on proven mobile technology and public scientific data sources — not black-box APIs."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {techStack.map((tech) => (
            <RevealItem key={tech.name}>
              <div className="glass-card h-full rounded-xl px-5 py-4">
                <p className="text-sm font-bold text-foreground">{tech.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-subtext">
                  {tech.detail}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
