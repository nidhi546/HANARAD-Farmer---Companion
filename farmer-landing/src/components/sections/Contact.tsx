import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";
import { Icon } from "@/lib/icons";
import { site } from "@/lib/content";

export function Contact() {
  return (
    <>
      <section id="download" className="relative py-24 lg:py-28">
        <BackgroundGlow variant="hero" />
        <Container className="relative">
          <Reveal className="glass-card mx-auto max-w-4xl rounded-3xl px-8 py-14 text-center sm:px-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Get {site.name}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-subtext">
              Free to download. Free to use. Always.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <StoreButton
                label="Google Play"
                note="Download now"
                icon="download"
                href={site.playStoreUrl}
              />
              <StoreButton label="App Store" note="Coming soon" icon="download" />
            </div>

            <p className="mt-8 text-xs text-muted">
              Android 8.0+ and iOS 14+ · Requires ~50 MB storage
            </p>
          </Reveal>
        </Container>
      </section>

      <section id="contact" className="relative py-24 lg:py-32">
        <Container>
          <SectionHeading
            eyebrow="Get in touch"
            title="We're here to help"
            description="Questions, feedback, or a partnership idea? Reach out and our team will get back to you."
          />

          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <RevealItem>
              <ContactCard
                icon="phone"
                title="Call Support"
                value={site.supportPhone}
                note={site.supportHours}
                href={`tel:${site.supportPhone.replace(/-/g, "")}`}
              />
            </RevealItem>
            <RevealItem>
              <ContactCard
                icon="mail"
                title="Email Support"
                value={site.supportEmail}
                note="Responds within 24 hours"
                href={`mailto:${site.supportEmail}`}
              />
            </RevealItem>
            <RevealItem>
              <ContactCard
                icon="shield-check"
                title="Legal & Privacy"
                value={site.legalEmail}
                note="Business days"
                href={`mailto:${site.legalEmail}`}
              />
            </RevealItem>
          </RevealGroup>
        </Container>
      </section>
    </>
  );
}

function StoreButton({
  label,
  note,
  icon,
  href,
}: {
  label: string;
  note: string;
  icon: string;
  href?: string;
}) {
  const className = href
    ? "flex w-full max-w-[220px] items-center gap-3 rounded-2xl border border-brand-mint-400/30 bg-brand-mint-400/10 px-5 py-3.5 transition-transform hover:-translate-y-0.5 hover:bg-brand-mint-400/15"
    : "flex w-full max-w-[220px] cursor-not-allowed items-center gap-3 rounded-2xl border border-border-strong bg-white/5 px-5 py-3.5 opacity-80";

  const content = (
    <>
      <Icon name={icon} className="h-6 w-6 text-brand-gold-300" />
      <div className="text-left leading-tight">
        <p className="text-[10px] uppercase tracking-wide text-muted">{note}</p>
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <div aria-disabled className={className}>
      {content}
    </div>
  );
}

function ContactCard({
  icon,
  title,
  value,
  note,
  href,
}: {
  icon: string;
  title: string;
  value: string;
  note: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="glass-card group flex h-full flex-col items-center rounded-2xl p-8 text-center transition-transform hover:-translate-y-1"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mint-400/10 ring-1 ring-brand-mint-400/25">
        <Icon name={icon} className="h-6 w-6 text-brand-mint-300" />
      </div>
      <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <p className="mt-2 text-base font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-subtext">{note}</p>
    </a>
  );
}
