import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { footerLinks, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background-alt">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <Image
                src="/brand/logo.svg"
                alt={`${site.name} logo`}
                width={36}
                height={36}
                className="rounded-[9px]"
              />
              <span className="flex flex-col leading-none">
                <span className="text-sm font-extrabold tracking-wide text-foreground">
                  HANARAD
                </span>
                <span className="text-[10px] font-medium tracking-wider text-brand-mint-300">
                  FARMER COMPANION
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-subtext">
              {site.tagline}. Powered by NASA POWER and Open-Meteo, built for
              farmers everywhere.
            </p>
          </div>

          <FooterColumn title="App" links={footerLinks.app} />
          <FooterColumn title="Languages" links={footerLinks.languages} />
          <FooterColumn title="Legal" links={footerLinks.legal} />
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted sm:flex-row">
          <p>
            © {site.copyrightYear} HANARAD Team. All rights reserved.
          </p>
          <p>Built with care for farmers worldwide.</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-subtext transition-colors hover:text-brand-mint-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
