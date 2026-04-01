'use client';

import { Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function UsageStats() {
  const formsUsed = 6;
  const formsTotal = 10;
  const pct = Math.round((formsUsed / formsTotal) * 100);

  const status =
    pct >= 90 ? { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', icon: <AlertTriangle size={14} /> }
    : pct >= 70 ? { label: 'High',   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  icon: <TrendingUp size={14} /> }
    :             { label: 'Good',   color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.18)', icon: <CheckCircle size={14} /> };

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes heroPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(1.8); } }
        @keyframes fillBar { from { width:0; } to { width:var(--bar-w); } }

        .us-card {
          background:#111114; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:24px;
          box-shadow:0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease both; position:relative; overflow:hidden;
        }
        .us-stat {
          background:#111114; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:20px;
          position:relative; overflow:hidden;
          box-shadow:0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease both;
        }
        .us-stat::before {
          content:''; position:absolute; top:0; left:0; width:3px; height:36px;
          background:rgba(245,158,11,0.35); border-radius:0 0 2px 0;
        }
        .us-upgrade-btn {
          display:inline-flex; align-items:center; gap:7px; padding:8px 18px; border-radius:4px;
          font-size:11px; font-weight:700; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.06em; cursor:pointer;
          background:#f59e0b; color:#0b0b0c; border:2px solid #f59e0b; transition:all .18s;
        }
        .us-upgrade-btn:hover { transform:translateY(-1px) rotate(-0.4deg); box-shadow:3px 3px 0 rgba(245,158,11,0.35); }
        .us-pulse { width:4px; height:4px; border-radius:50%; background:#f59e0b; display:inline-block; animation:heroPulse 2.5s infinite; }
      `}} />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px' }}>
        <div>
          <div style={{ fontSize:'10px', color:'#a1a1aa', marginBottom:'6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.07em' }}>
            Dashboard · Usage
          </div>
          <h2 style={{ fontSize:'28px', fontWeight:800, lineHeight:1.0, letterSpacing:'-1px', color:'#f0ece4', margin:0, fontFamily:"'Playfair Display',Georgia,serif" }}>
            Usage{' '}
            <em style={{ fontStyle:'italic', background:'linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)', backgroundSize:'200% 200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Stats
            </em>
          </h2>
          <p style={{ fontSize:'13px', color:'#52525b', marginTop:'6px', fontWeight:300 }}>
            Your monthly form fill quota at a glance.
          </p>
        </div>
        <button className="us-upgrade-btn">
          <Zap size={12} /> Upgrade
        </button>
      </div>

      {/* Stat row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
        <div className="us-stat">
          <p style={{ fontSize:'10px', color:'#3f3f46', margin:'0 0 6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Forms Used</p>
          <p style={{ fontSize:'32px', fontWeight:800, color:'#f0ece4', margin:0, fontFamily:"'Playfair Display',serif", letterSpacing:'-1px', lineHeight:1 }}>
            {formsUsed}<span style={{ fontSize:'16px', color:'#52525b' }}>/{formsTotal}</span>
          </p>
        </div>
        <div className="us-stat">
          <p style={{ fontSize:'10px', color:'#3f3f46', margin:'0 0 6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Remaining</p>
          <p style={{ fontSize:'32px', fontWeight:800, color:'#f0ece4', margin:0, fontFamily:"'Playfair Display',serif", letterSpacing:'-1px', lineHeight:1 }}>
            {formsTotal - formsUsed}
          </p>
        </div>
        <div className="us-stat">
          <p style={{ fontSize:'10px', color:'#3f3f46', margin:'0 0 6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Status</p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'4px', background:status.bg, border:`1px solid ${status.border}`, color:status.color, fontSize:'11px', fontFamily:"'DM Mono',monospace", fontWeight:500, marginTop:'4px' }}>
            {status.icon} {status.label}
          </div>
        </div>
      </div>

      {/* Progress card */}
      <div className="us-card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span className="us-pulse" />
            <span style={{ fontSize:'10px', color:'#3f3f46', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>Monthly Quota</span>
          </div>
          <span style={{ fontSize:'10px', color: pct >= 90 ? '#f87171' : pct >= 70 ? '#f59e0b' : '#34d399', fontFamily:"'DM Mono',monospace", fontWeight:600 }}>
            {pct}% used
          </span>
        </div>

        {/* Bar */}
        <div style={{ height:'6px', borderRadius:'3px', background:'rgba(255,255,255,0.05)', overflow:'hidden', marginBottom:'12px' }}>
          <div style={{
            height:'100%',
            width:`${pct}%`,
            background: pct >= 90 ? 'linear-gradient(90deg,#f87171,#fca5a5)'
                      : pct >= 70 ? 'linear-gradient(90deg,#f59e0b,#fde68a)'
                      : 'linear-gradient(90deg,#34d399,#6ee7b7)',
            borderRadius:'3px',
            transition:'width .6s ease',
          }} />
        </div>

        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:'11px', color:'#52525b', fontFamily:"'DM Mono',monospace" }}>0</span>
          <span style={{ fontSize:'11px', color:'#52525b', fontFamily:"'DM Mono',monospace" }}>{formsTotal} forms</span>
        </div>

        {pct >= 70 && (
          <div style={{ marginTop:'16px', padding:'12px 14px', borderRadius:'4px', background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.15)' }}>
            <p style={{ fontSize:'12px', color:'#d97706', margin:0, fontWeight:300, lineHeight:1.6 }}>
              {pct >= 90
                ? "You're almost out of forms. Upgrade now to keep going without interruption."
                : "You're using up your quota quickly. Consider upgrading to Pro for 100 forms/month."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
