"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Container } from "@/components/Container";
import { Icon } from "@/lib/icons";
import { navLinks, site } from "@/lib/content";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <Container className="flex h-16 items-center justify-between lg:h-20">
        <a href="#top" className="flex items-center gap-2.5">
          <Image
            src="/brand/logo.svg"
            alt={`${site.name} logo`}
            width={36}
            height={36}
            className="rounded-[9px]"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-wide text-foreground">
              HANARAD
            </span>
            <span className="text-[10px] font-medium tracking-wider text-brand-mint-300">
              FARMER COMPANION
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-subtext transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <a
            href="#download"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-gold-400 to-brand-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-green-900 shadow-lg shadow-brand-gold-500/20 transition-transform hover:scale-[1.03]"
          >
            Get the App
            <Icon
              name="arrow-right"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
        >
          <Icon name={open ? "x" : "menu"} className="h-5 w-5" />
        </button>
      </Container>

      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-subtext hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#download"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-gold-400 to-brand-gold-500 px-5 py-2.5 text-sm font-semibold text-brand-green-900"
            >
              Get the App
            </a>
          </Container>
        </div>
      )}
    </header>
  );
}
