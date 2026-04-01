'use client';

import { CreditCard, CheckCircle, ArrowRight, Zap, BarChart3, Sparkles } from 'lucide-react';

export function BillingSection() {
  const currentPlan = {
    name: 'Free',
    price: 0,
    monthlyQuota: 10,
    formsUsed: 6,
    renewalDate: new Date('2026-04-30'),
  };

  const pct = Math.round((currentPlan.formsUsed / currentPlan.monthlyQuota) * 100);

  const plans = [
    {
      name: 'Free', price: 0, forms: '10',
      features: ['10 forms per month', 'Basic AI assistance', 'Standard context', 'Community support'],
      accent: '#52525b', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', current: true,
    },
    {
      name: 'Pro', price: 19, forms: '100',
      features: ['100 forms per month', 'Advanced AI with RAG', 'Custom answers library', 'Priority support', 'Resume upload & parsing'],
      accent: '#f59e0b', bg: 'rgba(245,158,11,0.04)', border: 'rgba(245,158,11,0.25)', recommended: true,
    },
    {
      name: 'Enterprise', price: 99, forms: 'Unlimited',
      features: ['Unlimited forms', 'Advanced analytics', 'API access', 'Dedicated support', 'Custom integrations'],
      accent: '#8b5cf6', bg: 'rgba(139,92,246,0.04)', border: 'rgba(139,92,246,0.2)',
    },
  ];

  const history = [
    { date: 'Mar 30, 2026', amount: '$0.00', status: 'Free Plan' },
    { date: 'Feb 28, 2026', amount: '$0.00', status: 'Free Plan' },
    { date: 'Jan 31, 2026', amount: '$0.00', status: 'Free Plan' },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes neuralPulse { 0%,100% { opacity:.15; transform:scale(1); } 50% { opacity:.4; transform:scale(1.06); } }

        .bs-card {
          background:#111114; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:24px;
          box-shadow:0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease both; position:relative; overflow:hidden;
        }
        .bs-stat {
          background:#111114; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:20px;
          position:relative; overflow:hidden;
          box-shadow:0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease both;
        }
        .bs-stat::before {
          content:''; position:absolute; top:0; left:0; width:3px; height:36px;
          background:rgba(245,158,11,0.35); border-radius:0 0 2px 0;
        }
        .bs-plan-card {
          border-radius:4px; padding:22px; position:relative; overflow:hidden;
          box-shadow:0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03);
          animation: fadeSlideIn .4s ease both; transition: transform .18s, box-shadow .18s;
        }
        .bs-plan-card:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.4); }
        .bs-upgrade-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:7px;
          width:100%; padding:9px 18px; border-radius:4px;
          font-size:11px; font-weight:700; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.06em; cursor:pointer;
          transition:all .18s;
        }
        .bs-upgrade-btn.primary { background:#f59e0b; color:#0b0b0c; border:2px solid #f59e0b; }
        .bs-upgrade-btn.primary:hover { transform:translateY(-1px); box-shadow:3px 3px 0 rgba(245,158,11,0.35); }
        .bs-upgrade-btn.ghost { background:transparent; color:#52525b; border:1px solid rgba(255,255,255,0.08); }
        .bs-upgrade-btn.ghost:hover { color:#a1a1aa; border-color:rgba(255,255,255,0.15); }
        .bs-history-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 14px; border-radius:4px;
          border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01);
          transition:border-color .15s, background .15s;
        }
        .bs-history-row:hover { border-color:rgba(255,255,255,0.09); background:rgba(255,255,255,0.03); }
        .bs-info-card {
          background:#111114; border:1px solid rgba(99,102,241,0.2); border-radius:4px; padding:22px;
          box-shadow:0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03);
          animation: fadeSlideIn .4s ease .2s both; position:relative; overflow:hidden;
        }
        .bs-info-card::after {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse at top left, rgba(99,102,241,0.05) 0%, transparent 60%);
          pointer-events:none;
        }
        .neural-blob-bs {
          position:absolute; border-radius:50%; pointer-events:none;
          animation: neuralPulse 4s ease-in-out infinite;
        }
        .section-label-bs {
          display:flex; align-items:center; gap:8px;
          font-size:10px; color:#3f3f46;
          font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.08em; margin-bottom:16px;
        }
        .section-label-line-bs { flex:1; height:1px; background:rgba(255,255,255,0.05); }
      `}} />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px' }}>
        <div>
          <div style={{ fontSize:'10px', color:'#a1a1aa', marginBottom:'6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.07em' }}>
            Dashboard · Billing
          </div>
          <h2 style={{ fontSize:'28px', fontWeight:800, lineHeight:1.0, letterSpacing:'-1px', color:'#f0ece4', margin:0, fontFamily:"'Playfair Display',Georgia,serif" }}>
            Billing &{' '}
            <em style={{ fontStyle:'italic', background:'linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)', backgroundSize:'200% 200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Plan
            </em>
          </h2>
          <p style={{ fontSize:'13px', color:'#52525b', marginTop:'6px', fontWeight:300 }}>
            Manage your subscription and usage.
          </p>
        </div>
      </div>

      {/* Current plan stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
        <div className="bs-stat">
          <p style={{ fontSize:'10px', color:'#3f3f46', margin:'0 0 6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Current Plan</p>
          <p style={{ fontSize:'28px', fontWeight:800, color:'#f0ece4', margin:0, fontFamily:"'Playfair Display',serif", letterSpacing:'-1px', lineHeight:1 }}>
            {currentPlan.name}
          </p>
        </div>
        <div className="bs-stat">
          <p style={{ fontSize:'10px', color:'#3f3f46', margin:'0 0 6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Monthly Price</p>
          <p style={{ fontSize:'28px', fontWeight:800, color:'#f0ece4', margin:0, fontFamily:"'Playfair Display',serif", letterSpacing:'-1px', lineHeight:1 }}>
            ${currentPlan.price}<span style={{ fontSize:'14px', color:'#52525b' }}>/mo</span>
          </p>
        </div>
        <div className="bs-stat">
          <p style={{ fontSize:'10px', color:'#3f3f46', margin:'0 0 6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Renews</p>
          <p style={{ fontSize:'18px', fontWeight:800, color:'#f0ece4', margin:0, fontFamily:"'Playfair Display',serif", letterSpacing:'-0.5px', lineHeight:1 }}>
            {currentPlan.renewalDate.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
          </p>
        </div>
      </div>

      {/* Usage card */}
      <div className="bs-card" style={{ marginBottom:'16px' }}>
        <div className="neural-blob-bs" style={{ width:'200px', height:'200px', top:'-80px', right:'-80px', background:'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <CreditCard size={13} style={{ color:'#52525b' }} />
            <span style={{ fontSize:'10px', color:'#3f3f46', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Monthly Usage</span>
          </div>
          <span style={{ fontSize:'10px', color: pct >= 70 ? '#f59e0b' : '#34d399', fontFamily:"'DM Mono',monospace", fontWeight:600 }}>
            {currentPlan.formsUsed} / {currentPlan.monthlyQuota} forms · {pct}%
          </span>
        </div>
        <div style={{ height:'6px', borderRadius:'3px', background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
          <div style={{
            height:'100%', width:`${pct}%`,
            background: pct >= 90 ? 'linear-gradient(90deg,#f87171,#fca5a5)'
                      : pct >= 70 ? 'linear-gradient(90deg,#f59e0b,#fde68a)'
                      : 'linear-gradient(90deg,#34d399,#6ee7b7)',
            borderRadius:'3px', transition:'width .6s ease',
          }} />
        </div>
      </div>

      {/* Plans */}
      <div style={{ marginBottom:'16px' }}>
        <div className="section-label-bs">
          <Zap size={10} /> Upgrade to unlock more <div className="section-label-line-bs" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
          {plans.map((plan, i) => (
            <div key={plan.name} className="bs-plan-card" style={{ background:plan.bg, border:`1px solid ${plan.border}`, animationDelay:`${i*0.07}s` }}>
              {plan.recommended && (
                <div style={{ position:'absolute', top:'12px', right:'12px', padding:'2px 8px', borderRadius:'3px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', fontSize:'9px', color:'#f59e0b', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.06em' }}>
                  Recommended
                </div>
              )}
              <p style={{ fontSize:'10px', color:'#3f3f46', margin:'0 0 8px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>{plan.name}</p>
              <p style={{ fontSize:'28px', fontWeight:800, color:'#f0ece4', margin:'0 0 4px', fontFamily:"'Playfair Display',serif", letterSpacing:'-1px', lineHeight:1 }}>
                ${plan.price}<span style={{ fontSize:'13px', color:'#52525b', fontWeight:400 }}>/mo</span>
              </p>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 8px', borderRadius:'3px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'16px' }}>
                <Zap size={10} style={{ color:plan.accent }} />
                <span style={{ fontSize:'10px', color:'#71717a', fontFamily:"'DM Mono',monospace" }}>{plan.forms} forms/mo</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'18px' }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <CheckCircle size={12} style={{ color:'#34d399', flexShrink:0, marginTop:'2px' }} />
                    <span style={{ fontSize:'12px', color:'#71717a', fontWeight:300, lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className={`bs-upgrade-btn ${plan.recommended ? 'primary' : 'ghost'}`}>
                {plan.current ? 'Current Plan' : 'Upgrade'} <ArrowRight size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing history */}
      <div className="bs-card" style={{ marginBottom:'16px' }}>
        <div className="section-label-bs">
          <BarChart3 size={10} /> Billing History <div className="section-label-line-bs" />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {history.map((item, i) => (
            <div key={i} className="bs-history-row">
              <div>
                <p style={{ fontSize:'12px', color:'#f0ece4', margin:'0 0 2px', fontWeight:400 }}>{item.date}</p>
                <p style={{ fontSize:'11px', color:'#52525b', margin:0, fontFamily:"'DM Mono',monospace" }}>{item.status}</p>
              </div>
              <span style={{ fontSize:'13px', color:'#71717a', fontFamily:"'DM Mono',monospace", fontWeight:500 }}>{item.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div className="bs-info-card">
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'4px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Sparkles size={13} style={{ color:'#818cf8' }} />
          </div>
          <span style={{ fontSize:'10px', color:'#818cf8', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>
            About Your Plan
          </span>
        </div>
        <p style={{ fontSize:'12px', color:'#71717a', margin:'0 0 8px', fontWeight:300, lineHeight:1.65 }}>
          You're on the Free plan. Upgrade to Pro to unlock 100 forms per month, advanced AI with RAG, and a custom answers library.
        </p>
        <p style={{ fontSize:'12px', color:'#52525b', margin:0, fontWeight:300, lineHeight:1.65 }}>
          All plans include a 7-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
