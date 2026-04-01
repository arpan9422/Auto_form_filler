'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Copy, Gift, History, Sparkles, TrendingUp, Wallet, Zap } from 'lucide-react';
import { walletApi, referralApi, type WalletSummary, type WalletAnalytics, type WalletBreakdown, type Transaction, type Purchase, type ReferralStats } from '@/lib/services';

const packs = [
  { credits: 50, price: 'INR 99', popular: false },
  { credits: 120, price: 'INR 199', popular: true },
  { credits: 350, price: 'INR 499', popular: false },
];

export function WalletSection() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null);
  const [breakdown, setBreakdown] = useState<WalletBreakdown | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referral, setReferral] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      walletApi.summary(),
      walletApi.analytics(),
      walletApi.breakdown(),
      walletApi.transactions(),
      referralApi.me(),
    ]).then(([s, a, b, t, r]) => {
      setSummary(s.data);
      setAnalytics(a.data);
      setBreakdown(b.data);
      setTransactions(t.data.transactions.slice(0, 4));
      setReferral(r.data);
    }).catch(() => {});
  }, []);

  const usageStats = [
    { label: 'Today',     value: analytics ? String(analytics.today)    : '—' },
    { label: 'This Week', value: analytics ? String(analytics.thisWeek) : '—' },
    { label: 'Lifetime',  value: analytics ? String(analytics.lifetime) : '—' },
    { label: 'Avg / Day', value: analytics ? String(analytics.avgPerDay): '—' },
  ];

  const breakdownItems = [
    { label: 'Form Fill',    value: breakdown?.formFill    ?? 0, accent: '#f59e0b' },
    { label: 'Chat Refine',  value: breakdown?.chatRefine  ?? 0, accent: '#34d399' },
    { label: 'Regenerate',   value: breakdown?.regenerate  ?? 0, accent: '#818cf8' },
    { label: 'Resume Parse', value: breakdown?.resumeParse ?? 0, accent: '#f87171' },
  ];

  const freeLeft = summary ? Math.max(summary.weeklyFreeCredits - (analytics?.thisWeek ?? 0), 0) : 0;
  const paidCredits = summary ? Math.max(summary.credits - freeLeft, 0) : 0;

  const referralLink = referral ? `ref.ai-form.app/${referral.referralCode}` : '—';

  const handleCopyReferral = () => {
    if (!referral) return;
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes heroPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(1.8); } }

        .wallet-card {
          background:#111114; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:24px;
          box-shadow:0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease both; position:relative; overflow:hidden;
        }
        .wallet-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:7px;
          padding:9px 16px; border-radius:4px; font-size:11px; font-weight:700;
          font-family:'DM Mono', monospace; text-transform:uppercase; letter-spacing:.06em;
          cursor:pointer; transition:all .18s ease;
        }
        .wallet-btn.primary { background:#f59e0b; color:#0b0b0c; border:2px solid #f59e0b; }
        .wallet-btn.primary:hover { transform:translateY(-1px); box-shadow:3px 3px 0 rgba(245,158,11,0.35); }
        .wallet-btn.ghost { background:transparent; color:#52525b; border:1px solid rgba(255,255,255,0.08); }
        .wallet-btn.ghost:hover { color:#a1a1aa; border-color:rgba(255,255,255,0.15); background:rgba(255,255,255,0.03); }
        .wallet-row {
          display:flex; align-items:center; justify-content:space-between; gap:14px;
          padding:12px 14px; border-radius:4px;
          border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01);
        }
      `}} />

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px' }}>
        <div>
          <div style={{ fontSize:'10px', color:'#a1a1aa', marginBottom:'6px', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'0.07em' }}>
            Dashboard / Wallet
          </div>
          <h2 style={{ fontSize:'28px', fontWeight:800, lineHeight:1, letterSpacing:'-1px', color:'#f0ece4', margin:0, fontFamily:"'Playfair Display', Georgia, serif" }}>
            Credits{' '}
            <em style={{ fontStyle:'italic', background:'linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)', backgroundSize:'200% 200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Wallet
            </em>
          </h2>
          <p style={{ fontSize:'13px', color:'#52525b', marginTop:'6px', fontWeight:300 }}>
            Track balance, usage, transactions, referrals, and top up credits.
          </p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.35fr .9fr', gap:'16px', marginBottom:'16px' }}>
        <div className="wallet-card" style={{ borderColor:'rgba(245,158,11,0.18)', background:'linear-gradient(180deg, rgba(245,158,11,0.06), rgba(17,17,20,0.98))' }}>
          <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'180px', height:'180px', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.16) 0%, transparent 72%)' }} />
          <div style={{ position:'relative' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
              <Wallet size={13} style={{ color:'#f59e0b' }} />
              <span style={{ fontSize:'10px', color:'#d97706', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Credits Balance</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'10px' }}>
              <span style={{ fontSize:'52px', fontWeight:800, color:'#f0ece4', lineHeight:1, letterSpacing:'-2px', fontFamily:"'Playfair Display', Georgia, serif" }}>
                {summary?.credits ?? '—'}
              </span>
              <span style={{ fontSize:'22px', color:'#f59e0b' }}>⚡</span>
            </div>
            <p style={{ fontSize:'14px', color:'#71717a', margin:'0 0 16px', fontWeight:300 }}>
              {freeLeft} free left this week
            </p>
            <div style={{ display:'flex', gap:'18px', flexWrap:'wrap', marginBottom:'18px' }}>
              <span style={{ fontSize:'12px', color:'#a1a1aa', fontFamily:"'DM Mono', monospace" }}>Free Weekly: {freeLeft} left</span>
              <span style={{ fontSize:'12px', color:'#a1a1aa', fontFamily:"'DM Mono', monospace" }}>Paid Credits: {paidCredits}</span>
            </div>
            <button className="wallet-btn primary"><Zap size={12} /> Buy Credits</button>
          </div>
        </div>

        <div className="wallet-card">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <Gift size={13} style={{ color:'#34d399' }} />
            <span style={{ fontSize:'10px', color:'#34d399', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Referral Rewards</span>
          </div>
          <h3 style={{ fontSize:'22px', color:'#f0ece4', margin:'0 0 8px', fontFamily:"'Playfair Display', Georgia, serif" }}>Invite Friends</h3>
          <p style={{ fontSize:'13px', color:'#71717a', margin:'0 0 18px', fontWeight:300, lineHeight:1.6 }}>
            Earn 10 credits for every signup that comes from your referral link.
          </p>
          <div className="wallet-row" style={{ marginBottom:'16px' }}>
            <span style={{ fontSize:'12px', color:'#a1a1aa', fontFamily:"'DM Mono', monospace" }}>{referralLink}</span>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#34d399', animation:'heroPulse 2.5s infinite', display:'inline-block' }} />
          </div>
          <button className="wallet-btn ghost" onClick={handleCopyReferral}>
            <Copy size={12} /> {copied ? 'Copied!' : 'Copy Referral Link'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px' }}>
        {usageStats.map(stat => (
          <div key={stat.label} className="wallet-card" style={{ padding:'20px' }}>
            <p style={{ fontSize:'10px', color:'#3f3f46', margin:'0 0 8px', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>{stat.label}</p>
            <p style={{ fontSize:'30px', fontWeight:800, color:'#f0ece4', margin:0, lineHeight:1, letterSpacing:'-1px', fontFamily:"'Playfair Display', Georgia, serif" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
        <div className="wallet-card">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <TrendingUp size={12} style={{ color:'#818cf8' }} />
            <span style={{ fontSize:'10px', color:'#818cf8', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Credit Consumption Breakdown</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {breakdownItems.map(item => (
              <div key={item.label} className="wallet-row">
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:item.accent, display:'inline-block' }} />
                  <span style={{ fontSize:'14px', color:'#71717a', fontWeight:300 }}>{item.label}</span>
                </div>
                <span style={{ fontSize:'14px', color:'#f0ece4', fontFamily:"'DM Mono', monospace" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="wallet-card">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <History size={12} style={{ color:'#f59e0b' }} />
            <span style={{ fontSize:'10px', color:'#d97706', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Transaction History</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {transactions.length === 0 ? (
              <p style={{ fontSize:'12px', color:'#3f3f46', fontFamily:"'DM Mono',monospace" }}>No transactions yet</p>
            ) : transactions.map(item => (
              <div key={item.id} className="wallet-row">
                <div>
                  <p style={{ fontSize:'13px', color:'#f0ece4', margin:'0 0 3px', fontWeight:400 }}>{item.reason.replace(/_/g, ' ')}</p>
                  <p style={{ fontSize:'11px', color:'#52525b', margin:0, fontFamily:"'DM Mono', monospace" }}>
                    {new Date(item.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                  </p>
                </div>
                <span style={{ fontSize:'13px', color: item.type === 'CREDIT' ? '#34d399' : '#f87171', fontFamily:"'DM Mono', monospace", fontWeight:600 }}>
                  {item.type === 'CREDIT' ? '+' : '-'}{item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wallet-card">
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'18px' }}>
          <Sparkles size={12} style={{ color:'#f59e0b' }} />
          <span style={{ fontSize:'10px', color:'#d97706', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Buy Credits</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
          {packs.map(pack => (
            <div key={pack.credits} className="wallet-card" style={{ padding:'22px', background: pack.popular ? 'rgba(245,158,11,0.04)' : '#111114', borderColor: pack.popular ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)' }}>
              {pack.popular && (
                <div style={{ position:'absolute', top:'12px', right:'12px', padding:'2px 8px', borderRadius:'3px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', fontSize:'9px', color:'#f59e0b', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'.06em' }}>
                  Popular
                </div>
              )}
              <p style={{ fontSize:'10px', color:'#3f3f46', margin:'0 0 8px', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Credit Pack</p>
              <p style={{ fontSize:'30px', fontWeight:800, color:'#f0ece4', margin:'0 0 6px', lineHeight:1, letterSpacing:'-1px', fontFamily:"'Playfair Display', Georgia, serif" }}>{pack.credits}</p>
              <p style={{ fontSize:'13px', color:'#71717a', margin:'0 0 18px', fontWeight:300 }}>{pack.price}</p>
              <button className={`wallet-btn ${pack.popular ? 'primary' : 'ghost'}`} style={{ width:'100%' }}>
                Buy Now <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
