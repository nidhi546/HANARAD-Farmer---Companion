import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { Icon } from "@/lib/icons";
import { benefits, languages } from "@/lib/content";

export function Benefits() {
  return (
    <section className="relative py-24 lg:py-32">
      <Container>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why farmers choose HANARAD"
              title="Real value, not vanity features"
            />
            <RevealGroup className="mt-10 space-y-5">
              {benefits.map((benefit) => (
                <RevealItem key={benefit.title}>
                  <div className="flex gap-4">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-mint-400/10 ring-1 ring-brand-mint-400/25">
                      <Icon name="check" className="h-4 w-4 text-brand-mint-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {benefit.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-subtext">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <div id="languages">
            <SectionHeading
              align="left"
              eyebrow="Your language, your farm"
              title="Speaks the way you do"
              description="More languages — Marathi, Tamil, Telugu, and Punjabi — are coming soon."
            />
            <RevealGroup className="mt-10 grid grid-cols-2 gap-4">
              {languages.map((lang) => (
                <RevealItem key={lang.code}>
                  <div className="glass-card h-full rounded-2xl p-5">
                    <span className="text-2xl">{lang.flag}</span>
                    <h3 className="mt-3 text-base font-bold text-foreground">
                      {lang.native}
                    </h3>
                    <p className="text-xs text-muted">{lang.region}</p>
                    <p className="mt-3 text-xs italic text-brand-mint-300">
                      &ldquo;{lang.sample}&rdquo;
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </Container>
    </section>
  );
}
