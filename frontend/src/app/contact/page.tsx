import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us – Form Pilot',
  description: 'Get in touch with the Form Pilot team.',
};

export default function ContactPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0b0b0c', fontFamily: "'DM Sans', sans-serif", paddingTop: '80px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');
        .contact-card { background:#111114; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:28px; }
        .contact-link { color:#f59e0b; text-decoration:none; }
        .contact-link:hover { text-decoration:underline; }
      `}</style>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ fontSize: '11px', color: '#52525b', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Form Pilot · Contact
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', color: '#f0ece4', margin: '0 0 12px', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.05 }}>
          Contact <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#f59e0b,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Us</em>
        </h1>
        <p style={{ fontSize: '16px', color: '#71717a', fontWeight: 300, marginBottom: '48px', lineHeight: 1.7 }}>
          Have a question, issue, or feedback? We&apos;re here to help.
        </p>

        <div className="contact-card" style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: '#52525b', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Email</p>
          <a href="mailto:support@formpilot.app" className="contact-link" style={{ fontSize: '18px', fontWeight: 500, color: '#f59e0b' }}>
            support@formpilot.app
          </a>
          <p style={{ fontSize: '14px', color: '#52525b', margin: '8px 0 0', fontWeight: 300 }}>
            We typically respond within 24–48 business hours.
          </p>
        </div>

        <div className="contact-card" style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: '#52525b', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Business</p>
          <p style={{ fontSize: '15px', color: '#a1a1aa', fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
            Form Pilot<br />
            India<br />
            <a href="mailto:support@formpilot.app" className="contact-link">support@formpilot.app</a>
          </p>
        </div>

        <div className="contact-card">
          <p style={{ fontSize: '11px', color: '#52525b', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Response Time</p>
          <p style={{ fontSize: '15px', color: '#a1a1aa', fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
            Support requests are handled Monday – Friday, 10 AM – 6 PM IST. We aim to respond to all queries within 2 business days.
          </p>
        </div>
      </div>
    </main>
  );
}
