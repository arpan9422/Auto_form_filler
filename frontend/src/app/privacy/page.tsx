import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – Form Pilot',
  description: 'How Form Pilot collects, uses, and protects your personal data.',
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

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0b0b0c', fontFamily: "'DM Sans', sans-serif", paddingTop: '80px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ fontSize: '11px', color: '#52525b', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Form Pilot · Legal
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', color: '#f0ece4', margin: '0 0 12px', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.05 }}>
          Privacy{' '}
          <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#f59e0b,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Policy
          </em>
        </h1>
        <p style={{ fontSize: '14px', color: '#52525b', fontFamily: "'DM Mono', monospace", marginBottom: '48px' }}>
          Last updated: 1 April 2026
        </p>

        <Section title="1. Introduction">
          Form Pilot (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data when you use our browser extension and web application (collectively, &quot;the Service&quot;).
        </Section>

        <Section title="2. Data We Collect">
          <p style={{ marginBottom: '12px' }}>We collect the following categories of data:</p>

          <p style={{ color: '#a1a1aa', fontWeight: 400, marginBottom: '6px' }}>Account Data</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '6px' }}>Email address (used for authentication via OTP)</li>
            <li style={{ marginBottom: '6px' }}>Name and phone number (provided during onboarding)</li>
          </ul>

          <p style={{ color: '#a1a1aa', fontWeight: 400, marginBottom: '6px' }}>Profile &amp; Context Data</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '6px' }}>Professional links (LinkedIn, GitHub, portfolio)</li>
            <li style={{ marginBottom: '6px' }}>Education and work experience</li>
            <li style={{ marginBottom: '6px' }}>Skills, bio, and custom answers</li>
            <li style={{ marginBottom: '6px' }}>Uploaded resume files (stored securely in AWS S3)</li>
          </ul>

          <p style={{ color: '#a1a1aa', fontWeight: 400, marginBottom: '6px' }}>Usage Data</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '6px' }}>Websites where the extension is used (platform name and URL)</li>
            <li style={{ marginBottom: '6px' }}>Number of form fields filled, time saved, and AI edits made</li>
            <li style={{ marginBottom: '6px' }}>Credit consumption per action</li>
          </ul>

          <p style={{ color: '#a1a1aa', fontWeight: 400, marginBottom: '6px' }}>Payment Data</p>
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '6px' }}>Transaction records (amount, credits purchased, payment reference)</li>
            <li>We do not store card numbers or UPI credentials — payments are processed by Razorpay</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>To authenticate your account and maintain session security</li>
            <li style={{ marginBottom: '8px' }}>To power AI form-filling by embedding your profile context into a vector database (Pinecone) for semantic retrieval</li>
            <li style={{ marginBottom: '8px' }}>To generate personalised answers using OpenAI-compatible language models</li>
            <li style={{ marginBottom: '8px' }}>To track credit usage and maintain your wallet balance</li>
            <li style={{ marginBottom: '8px' }}>To send transactional emails (OTP codes, payment confirmations) via Brevo</li>
            <li style={{ marginBottom: '8px' }}>To improve the Service through aggregated, anonymised usage analytics</li>
          </ul>
        </Section>

        <Section title="4. Data Storage and Security">
          <p>Your data is stored on the following infrastructure:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li style={{ marginBottom: '8px' }}><span style={{ color: '#a1a1aa' }}>Database:</span> PostgreSQL hosted on Supabase (encrypted at rest)</li>
            <li style={{ marginBottom: '8px' }}><span style={{ color: '#a1a1aa' }}>Resume files:</span> AWS S3 with server-side encryption</li>
            <li style={{ marginBottom: '8px' }}><span style={{ color: '#a1a1aa' }}>Vector embeddings:</span> Pinecone (used for AI context retrieval only)</li>
            <li style={{ marginBottom: '8px' }}><span style={{ color: '#a1a1aa' }}>Authentication tokens:</span> Short-lived JWTs with rotating refresh tokens</li>
          </ul>
          <p style={{ marginTop: '14px' }}>
            All data is transmitted over HTTPS. We follow industry-standard security practices and conduct regular reviews of our data handling procedures.
          </p>
        </Section>

        <Section title="5. Data Sharing">
          <p>We do not sell your personal data. We share data only with the following third-party service providers, strictly to operate the Service:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li style={{ marginBottom: '8px' }}>OpenAI / AICredits — for AI text generation and embeddings</li>
            <li style={{ marginBottom: '8px' }}>Pinecone — for vector storage and semantic search</li>
            <li style={{ marginBottom: '8px' }}>AWS S3 — for resume file storage</li>
            <li style={{ marginBottom: '8px' }}>Supabase — for database hosting</li>
            <li style={{ marginBottom: '8px' }}>Brevo — for transactional email delivery</li>
            <li style={{ marginBottom: '8px' }}>Razorpay — for payment processing</li>
          </ul>
          <p style={{ marginTop: '14px' }}>
            Each provider is bound by their own privacy policies and data processing agreements.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>We retain your data for as long as your account is active. If you delete your account:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li style={{ marginBottom: '8px' }}>Your profile, education, work, and project data is deleted from our database</li>
            <li style={{ marginBottom: '8px' }}>Your resume files are deleted from AWS S3</li>
            <li style={{ marginBottom: '8px' }}>Your vector embeddings are deleted from Pinecone</li>
            <li style={{ marginBottom: '8px' }}>Transaction records may be retained for up to 7 years for legal and accounting compliance</li>
          </ul>
        </Section>

        <Section title="7. Cookies and Tracking">
          <p>The Service uses minimal cookies:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li style={{ marginBottom: '8px' }}>Authentication cookies (access token and refresh token) — strictly necessary for login sessions</li>
            <li style={{ marginBottom: '8px' }}>No advertising or third-party tracking cookies are used</li>
          </ul>
        </Section>

        <Section title="8. Your Rights">
          <p>You have the right to:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li style={{ marginBottom: '8px' }}>Access the personal data we hold about you</li>
            <li style={{ marginBottom: '8px' }}>Correct inaccurate data via your dashboard profile settings</li>
            <li style={{ marginBottom: '8px' }}>Request deletion of your account and associated data</li>
            <li style={{ marginBottom: '8px' }}>Object to processing of your data for certain purposes</li>
          </ul>
          <p style={{ marginTop: '14px' }}>
            To exercise any of these rights, email us at{' '}
            <a href="mailto:support@formpilot.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@formpilot.app</a>.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          The Service is not directed at children under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us immediately.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the &quot;Last updated&quot; date at the top of this page. Continued use of the Service after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="11. Contact">
          For any privacy-related questions or requests, contact us at{' '}
          <a href="mailto:support@formpilot.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@formpilot.app</a>.
        </Section>
      </div>
    </main>
  );
}
