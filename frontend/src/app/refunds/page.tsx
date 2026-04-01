import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy – Form Pilot',
  description: 'Refund and cancellation policy for Form Pilot credits.',
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

export default function RefundsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0b0b0c', fontFamily: "'DM Sans', sans-serif", paddingTop: '80px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ fontSize: '11px', color: '#52525b', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Form Pilot · Legal
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', color: '#f0ece4', margin: '0 0 12px', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.05 }}>
          Refund &amp;{' '}
          <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#f59e0b,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cancellation
          </em>
        </h1>
        <p style={{ fontSize: '14px', color: '#52525b', fontFamily: "'DM Mono', monospace", marginBottom: '48px' }}>
          Last updated: 1 April 2026
        </p>

        {/* Key policy callout */}
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '4px', padding: '20px 24px', marginBottom: '40px' }}>
          <p style={{ fontSize: '15px', color: '#d97706', fontWeight: 500, margin: 0, lineHeight: 1.7, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            All credit purchases are non-refundable. There is no subscription to cancel.
          </p>
        </div>

        <Section title="1. Credit-Based Model">
          Form Pilot operates on a prepaid credit system. You purchase credits in advance and spend them as you use AI-powered features. There is no recurring subscription — you only pay for what you buy.
        </Section>

        <Section title="2. No Refund Policy">
          <p>All credit purchases are <strong style={{ color: '#f0ece4', fontWeight: 500 }}>final and non-refundable</strong>. Once credits are added to your wallet, they cannot be converted back to cash or transferred to another account.</p>
          <p style={{ marginTop: '10px' }}>This policy exists because:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li style={{ marginBottom: '6px' }}>Credits are a digital consumable with no physical equivalent</li>
            <li style={{ marginBottom: '6px' }}>AI compute costs are incurred at the time of use and cannot be reversed</li>
            <li style={{ marginBottom: '6px' }}>Free weekly credits are provided to let you evaluate the Service before purchasing</li>
          </ul>
        </Section>

        <Section title="3. No Cancellation Required">
          Because Form Pilot does not offer a subscription plan, there is nothing to cancel. Your purchased credits remain in your wallet until used. They do not expire.
        </Section>

        <Section title="4. Free Credits">
          Every account receives free weekly credits to use the Service at no cost. These free credits reset weekly and are provided as a courtesy. They have no monetary value and cannot be refunded or transferred.
        </Section>

        <Section title="5. Exceptions">
          Refunds will only be considered in the following exceptional circumstances:
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li style={{ marginBottom: '6px' }}>Duplicate payment due to a technical error on our payment gateway</li>
            <li style={{ marginBottom: '6px' }}>Credits were not added to your account after a successful payment</li>
          </ul>
          <p style={{ marginTop: '10px' }}>
            To raise an exception request, email us at{' '}
            <a href="mailto:support@formpilot.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@formpilot.app</a>{' '}
            within 7 days of the transaction with your payment reference number.
          </p>
        </Section>

        <Section title="6. Contact">
          For any billing queries, contact us at{' '}
          <a href="mailto:support@formpilot.app" style={{ color: '#f59e0b', textDecoration: 'none' }}>support@formpilot.app</a>.
        </Section>
      </div>
    </main>
  );
}
