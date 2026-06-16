import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — TALOA",
  description: "The terms that govern your use of TALOA.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="16 June 2026">
      <h2>1. Agreement</h2>
      <p>
        By using TALOA you agree to these Terms. If you don&apos;t agree, please
        don&apos;t use the service.
      </p>

      <h2>2. What TALOA is</h2>
      <p>
        A pet-safety service: QR/NFC tags that link to a pet profile, tools to
        help reunite lost pets, and a directory of pet services. TALOA is{" "}
        <strong>not a veterinary service</strong>.
      </p>

      <h2>3. Your account</h2>
      <p>
        You&apos;re responsible for your account and for keeping your login
        secure. Provide accurate information.
      </p>

      <h2>4. Acceptable use</h2>
      <p>
        Don&apos;t misuse the service, scan or activate tags you don&apos;t own,
        upload unlawful or harmful content, or attempt to disrupt or
        reverse-engineer the service.
      </p>

      <h2>5. Your content</h2>
      <p>
        You keep ownership of the pet information and photos you add. You grant us
        the licence needed to display them as part of the service (e.g. on the
        public tag page you enable). You&apos;re responsible for the accuracy and
        legality of what you upload.
      </p>

      <h2>6. The AI assistant is not a vet</h2>
      <p>
        The TALOA assistant offers general guidance only. It does{" "}
        <strong>not</strong> diagnose conditions or prescribe treatment. In an
        emergency, contact a vet immediately.
      </p>

      <h2>7. Directory disclaimer</h2>
      <p>
        The services directory is provided for information only. We don&apos;t
        endorse or guarantee listed providers; always confirm details directly.
        We&apos;re not liable for third-party services.
      </p>

      <h2>8. Subscriptions &amp; payments</h2>
      <p>
        Paid plans are billed through Stripe and renew automatically until
        cancelled. You can cancel at any time, effective at the end of the current
        billing period. Statutory consumer rights apply.
      </p>

      <h2>9. Availability</h2>
      <p>
        The service is provided &quot;as is&quot; and &quot;as available&quot;. We
        don&apos;t guarantee it will be uninterrupted or error-free.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the extent permitted by law, TALOA is not liable for indirect or
        consequential losses, or for the loss of a pet. Nothing limits liability
        that cannot be excluded by law.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may stop using TALOA at any time. We may suspend or end access for
        breach of these Terms.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of <strong>Ireland</strong>, and
        disputes are subject to the jurisdiction of the Irish courts.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update these Terms and will revise the &quot;last updated&quot;
        date.
      </p>

      <h2>14. Contact</h2>
      <p>
        <a href="mailto:hello@taloa.ie">hello@taloa.ie</a>
      </p>
    </LegalPage>
  );
}
