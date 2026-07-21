import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { termsConditions } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms and conditions governing your use of HANARAD Farmer-Companion.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      meta={`Last updated ${termsConditions.lastUpdated}`}
      intro={termsConditions.intro}
      sections={termsConditions.sections}
      contactNote="Questions about our Terms? We're happy to help."
    />
  );
}
