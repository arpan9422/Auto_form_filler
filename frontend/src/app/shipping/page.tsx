import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy – Form Pilot',
  description: 'Shipping policy for Form Pilot — a fully digital service.',
};

export default function ShippingPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0b0b0c', fontFamily: "'DM Sans', sans-serif", paddingTop: '80px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ fontSize: '11px', color: '#52525b', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Form Pilot · Legal
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', color: '#f0ece4', margin: '0 0 12px', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.05 }}>
          Shipping{' '}
          <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#f59e0b,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Policy
          </em>
        </h1>
        <p style={{ fontSize: '14px', color: '#52525b', fontFamily: "'DM Mono', monospace", marginBottom: '48px' }}>
          Last updated: 1 April 2026
        </p>

        <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: '4px', padding: '20px 24px', marginBottom: '40px' }}>
          <p style={{ fontSize: '15px', color: '#34d399', fontWeight: 500, margin: 0, lineHeight: 1.7, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Form Pilot is a 100% digital service. No physical goods are shipped.
          </p>
        </div>

        <div style={{ fontSize: '15px', color: '#71717a', fontWeight: 300, lineHeight: 1.8 }}>
          <p>
            Form Pilot provides a browser extension and web application — both of which are delivered digitally. There are no physical products, hardware, or printed materials associated with any purchase.
          </p>
          <p style={{ marginTop: '16px' }}>
            When you purchase credits, they are instantly credited to your Form Pilot wallet. No delivery, shipping, or waiting period applies.
          </p>
          <p style={{ marginTop: '16px' }}>
            The browser extension is distributed through the Chrome Web Store and other browser extension marketplaces. Installation is immediate and free.
          </p>
          <p style={{ marginTop: '32px', fontSize: '14px', color: '#52525b' }}>
            Questions? Contact us at{' '}
            <a href="mailto:support@formpilot.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@formpilot.app</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
