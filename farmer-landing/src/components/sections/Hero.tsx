"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/Container";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { PhoneFrame } from "@/components/PhoneFrame";
import { HeroDevice } from "@/components/HeroDevice";
import { Icon } from "@/lib/icons";
import { heroStats } from "@/lib/content";

// Note: initial states intentionally keep opacity at 1 (only animating
// y/scale) so hero content — including the LCP element — paints
// immediately server-side, before JS hydrates and Framer Motion runs.

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-36 lg:pb-32 lg:pt-44">
      <BackgroundGlow variant="hero" />
      <Container className="relative grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/5 px-4 py-1.5 text-xs font-medium text-brand-mint-300"
          >
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            Now available in 4 languages
          </motion.div>

          <motion.h1
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Smart Farming,{" "}
            <span className="text-gradient-gold">Better Harvest.</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-subtext"
          >
            HANARAD Farmer-Companion brings NASA satellite weather data,
            satellite farm mapping, AI crop advice, and live market prices
            into one free app — built for farmers who want to grow smarter.
          </motion.p>

          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <a
              href="#download"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-gold-400 to-brand-gold-500 px-7 py-3.5 text-sm font-semibold text-brand-green-900 shadow-xl shadow-brand-gold-500/25 transition-transform hover:scale-[1.02]"
            >
              <Icon name="download" className="h-4 w-4" />
              Download Free App
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-white/5 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-white/10"
            >
              See Features
              <Icon name="arrow-right" className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.dl
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-8"
          >
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-2xl font-extrabold text-gradient-mint">
                  {stat.value}
                </dd>
                <dd className="mt-1 text-xs leading-tight text-muted">
                  {stat.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ scale: 0.95, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto"
        >
          <div className="animate-float">
            <PhoneFrame>
              <HeroDevice />
            </PhoneFrame>
          </div>

          <FloatingBadge
            className="-top-4 left-[-2rem] hidden sm:flex"
            icon="satellite-dish"
            label="NASA Data"
          />
          <FloatingBadge
            className="right-[-2.75rem] top-[40%] hidden -translate-y-1/2 sm:flex"
            icon="sprout"
            label="Crop AI"
          />
          <FloatingBadge
            className="-bottom-5 left-[-1.5rem] hidden sm:flex"
            icon="line-chart"
            label="Live Prices"
          />
        </motion.div>
      </Container>
    </section>
  );
}

function FloatingBadge({
  icon,
  label,
  className = "",
}: {
  icon: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`glass-card absolute z-10 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-foreground shadow-lg ${className}`}
    >
      <Icon name={icon} className="h-3.5 w-3.5 text-brand-gold-300" />
      {label}
    </div>
  );
}
