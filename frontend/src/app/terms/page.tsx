import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions – Form Pilot',
  description: 'Terms and conditions for using Form Pilot.',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: '40px' }}>
    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f0ece4', letterSpacing: '-0.3px', margin: '0 0 14px', fontFamily: "'Playfair Display', Georgia, serif" }}>
      {title}
    </h2>
    <div style={{ fontSize: '15px', color: '#71717a', fontWeight: 300, lineHeight: 1.8 }}>
      {children}
    </div>
  </div>
);

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0b0b0c', fontFamily: "'DM Sans', sans-serif", paddingTop: '80px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ fontSize: '11px', color: '#52525b', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Form Pilot · Legal
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', color: '#f0ece4', margin: '0 0 12px', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.05 }}>
          Terms &amp;{' '}
          <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#f59e0b,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Conditions
          </em>
        </h1>
        <p style={{ fontSize: '14px', color: '#52525b', fontFamily: "'DM Mono', monospace", marginBottom: '48px' }}>
          Last updated: 1 April 2026
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using Form Pilot (&quot;the Service&quot;), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service.
        </Section>

        <Section title="2. Description of Service">
          Form Pilot is an AI-powered browser extension and web application that assists users in filling online forms using their stored profile, resume, and custom context. The Service operates on a credit-based system.
        </Section>

        <Section title="3. User Accounts">
          <p>You must create an account to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.</p>
          <p style={{ marginTop: '10px' }}>You agree to provide accurate and complete information when creating your account and to update it as necessary.</p>
        </Section>

        <Section title="4. Credits and Payments">
          <p>The Service uses a prepaid credit system. Credits are purchased in advance and consumed when you use AI-powered features such as form filling, chat refinement, and resume parsing.</p>
          <p style={{ marginTop: '10px' }}>All credit purchases are final. Please refer to our Refund and Cancellation Policy for details.</p>
          <p style={{ marginTop: '10px' }}>Free weekly credits are provided as a courtesy and may be modified or discontinued at any time without notice.</p>
        </Section>

        <Section title="5. Acceptable Use">
          You agree not to:
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li style={{ marginBottom: '6px' }}>Use the Service for any unlawful purpose</li>
            <li style={{ marginBottom: '6px' }}>Attempt to reverse-engineer, scrape, or exploit the Service</li>
            <li style={{ marginBottom: '6px' }}>Upload malicious files or content</li>
            <li style={{ marginBottom: '6px' }}>Impersonate any person or entity</li>
            <li style={{ marginBottom: '6px' }}>Use the Service to generate misleading or fraudulent content</li>
          </ul>
        </Section>

        <Section title="6. Data and Privacy">
          Your profile data, resumes, and custom context are stored securely and used solely to power the AI features of the Service. We do not sell your personal data to third parties. Please review our Privacy Policy for full details.
        </Section>

        <Section title="7. Intellectual Property">
          All content, branding, and technology within the Service are the property of Form Pilot. You retain ownership of the data you upload. By using the Service, you grant Form Pilot a limited licence to process your data to provide the Service.
        </Section>

        <Section title="8. Disclaimer of Warranties">
          The Service is provided &quot;as is&quot; without warranties of any kind. Form Pilot does not guarantee that AI-generated content will be accurate, complete, or suitable for any particular purpose. You are responsible for reviewing all AI-generated output before use.
        </Section>

        <Section title="9. Limitation of Liability">
          To the maximum extent permitted by law, Form Pilot shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
        </Section>

        <Section title="10. Modifications">
          We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
        </Section>

        <Section title="11. Governing Law">
          These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
        </Section>

        <Section title="12. Contact">
          For questions about these Terms, contact us at{' '}
          <a href="mailto:support@formpilot.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@formpilot.app</a>.
        </Section>
      </div>
    </main>
  );
}
