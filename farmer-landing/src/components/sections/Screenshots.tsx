import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { RevealGroup, RevealItem } from "@/components/Reveal";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ScreenshotVisual } from "@/components/ScreenshotVisual";
import { screenshots } from "@/lib/content";

export function Screenshots() {
  return (
    <section id="screenshots" className="relative py-24 lg:py-32">
      <BackgroundGlow variant="section" />
      <Container className="relative">
        <SectionHeading
          eyebrow="Designed for clarity"
          title="Built to be read in bright sunlight, on the farm"
          description="Clean, high-contrast interfaces designed for real field conditions — not a boardroom demo."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {screenshots.map((screenshot) => (
            <RevealItem key={screenshot.id} className="flex flex-col items-center">
              <PhoneFrame size="compact">
                <ScreenshotVisual screenshot={screenshot} />
              </PhoneFrame>
              <h3 className="mt-6 text-sm font-bold text-foreground">
                {screenshot.title}
              </h3>
              <p className="mt-1 text-center text-xs text-subtext">
                {screenshot.description}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
