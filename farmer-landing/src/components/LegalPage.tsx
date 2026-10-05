import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/content";

type Section = { icon: string; title: string; body: string };

export function LegalPage({
  title,
  meta,
  intro,
  sections,
  contactNote,
}: {
  title: string;
  meta: string;
  intro: string;
  sections: Section[];
  contactNote: string;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pb-24 pt-32 lg:pt-40">
        <Container className="max-w-3xl">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-border bg-white/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-mint-300">
              {site.name}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm text-muted">{meta}</p>
            <p className="mt-6 rounded-2xl border border-brand-indigo-500/25 bg-brand-indigo-500/10 p-5 text-sm leading-relaxed text-subtext">
              {intro}
            </p>
          </Reveal>

          <div className="mt-8 space-y-4">
            {sections.map((section) => (
              <div key={section.title} className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{section.icon}</span>
                  <h2 className="text-base font-bold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-subtext">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-brand-mint-400/25 bg-brand-mint-400/10 p-6 text-center">
            <p className="text-sm font-semibold text-foreground">
              Questions? Reach out.
            </p>
            <a
              href={`mailto:${site.legalEmail}`}
              className="mt-1 inline-block text-sm font-bold text-brand-mint-300"
            >
              {site.legalEmail}
            </a>
            <p className="mt-2 text-xs text-muted">{contactNote}</p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
