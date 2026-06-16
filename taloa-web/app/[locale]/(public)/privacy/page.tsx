import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — TALOA",
  description: "How TALOA collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="16 June 2026">
      <h2>1. Who we are</h2>
      <p>
        TALOA (&quot;we&quot;, &quot;us&quot;) provides smart pet-safety tags and a
        directory of pet services, starting in Dublin, Ireland. We are the data
        controller for the personal data described here. Questions or requests:{" "}
        <a href="mailto:hello@taloa.ie">hello@taloa.ie</a>.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your email, and any name, phone number,
          address or Eircode you choose to add.
        </li>
        <li>
          <strong>Pet profiles:</strong> your pet&apos;s name, species, breed,
          colour, photos, and any care notes you add (behaviour, allergies, vet
          details, etc.). You choose what to include.
        </li>
        <li>
          <strong>Tag scan data:</strong> when someone scans a tag, we record the
          time, the action taken, basic device/browser information, and — only if
          the person grants permission — approximate location. We{" "}
          <strong>never store raw IP addresses</strong>; any IP is irreversibly
          hashed (SHA-256).
        </li>
        <li>
          <strong>Found reports:</strong> if someone finds a pet, the optional
          phone number, photo and approximate location they provide.
        </li>
        <li>
          <strong>Service enquiries:</strong> name, email and phone when you
          contact a listed service through us.
        </li>
        <li>
          <strong>AI assistant:</strong> the messages you exchange with the TALOA
          assistant, to provide and improve the feature.
        </li>
        <li>
          <strong>Payments:</strong> handled by Stripe. We do <strong>not</strong>{" "}
          store your card details.
        </li>
      </ul>

      <h2>3. How we use your data</h2>
      <p>
        To provide the service; to help reunite lost pets and notify owners; to
        process subscriptions; to keep the service secure and prevent abuse; to
        communicate with you; and to improve TALOA.
      </p>

      <h2>4. Legal bases (GDPR)</h2>
      <p>
        Performance of our contract with you; your consent (e.g. location,
        optional analytics); our legitimate interests (security, improving the
        service); and compliance with legal obligations.
      </p>

      <h2>5. Who we share it with</h2>
      <p>
        We do <strong>not sell</strong> your data. We use trusted processors who
        act on our instructions: <strong>Supabase</strong> (hosting/database),{" "}
        <strong>Stripe</strong> (payments), <strong>Resend</strong> (email),{" "}
        <strong>PostHog</strong> (privacy-respecting analytics),{" "}
        <strong>Sentry</strong> (error monitoring), and{" "}
        <strong>Anthropic</strong> (AI assistant). When your pet is found, only
        the contact details you chose to make public are shown to the finder.
      </p>

      <h2>6. Public profile visibility</h2>
      <p>
        You control what appears on your pet&apos;s public page. Your{" "}
        <strong>home address and email are never shown publicly</strong>.
        Phone/email contact appears only if you enable it.
      </p>

      <h2>7. Cookies &amp; analytics</h2>
      <p>
        We use essential cookies (login session, language preference). We use
        analytics to understand how the service is used, configured to avoid
        tracking personal data. We do not use third-party advertising cookies.
      </p>

      <h2>8. Data retention</h2>
      <p>
        We keep account and pet data while your account is active and for a
        limited period afterwards. Scan logs are kept only as long as needed for
        safety and analytics, then deleted or anonymised. You can ask us to delete
        your data at any time.
      </p>

      <h2>9. Your rights</h2>
      <p>
        Under GDPR you have the right to access, correct, erase, restrict or
        object to processing, to data portability, and to withdraw consent. To
        exercise these, email <a href="mailto:hello@taloa.ie">hello@taloa.ie</a>.
        You may also complain to the Irish{" "}
        <a href="https://www.dataprotection.ie" target="_blank" rel="noopener noreferrer">
          Data Protection Commission
        </a>
        .
      </p>

      <h2>10. International transfers</h2>
      <p>
        We host within the EU where possible. Where a processor transfers data
        outside the EEA, appropriate safeguards (e.g. Standard Contractual
        Clauses) are applied.
      </p>

      <h2>11. Children</h2>
      <p>TALOA is not directed at children under 16.</p>

      <h2>12. Security</h2>
      <p>
        We protect data with encryption in transit, row-level access controls,
        hashed IPs, and least-privilege access to keys.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update this policy and will revise the &quot;last updated&quot;
        date. Material changes will be highlighted.
      </p>

      <h2>14. Contact</h2>
      <p>
        <a href="mailto:hello@taloa.ie">hello@taloa.ie</a>
      </p>
    </LegalPage>
  );
}
