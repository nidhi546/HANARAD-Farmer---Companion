import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { privacyPolicy } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How HANARAD Farmer-Companion collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      meta={`Effective ${privacyPolicy.effectiveDate} · Last updated ${privacyPolicy.lastUpdated}`}
      intro={privacyPolicy.intro}
      sections={privacyPolicy.sections}
      contactNote="We respond to all privacy inquiries within 5 business days."
    />
  );
}
