'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Calendar, CheckCircle, Clock, Globe, Sparkles } from 'lucide-react';
import { dashboardApi, type DashboardAnalytics } from '@/lib/services';
import { SKELETON_CSS, SkeletonBlock, SkeletonCard } from './Skeleton';

export function UsageAnalytics() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.analytics().then(r => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const timeSavedDisplay = (() => {
    if (!data) return '—';
    const totalSec = data.stats.timeSavedSec;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  })();

  const stats = [
    { label: 'Forms Filled',           value: loading ? '—' : String(data?.stats.formsFilled ?? 0),       trend: '',       icon: <BarChart3 size={16} />,   accent: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)'  },
    { label: 'Accepted Without Edits', value: loading ? '—' : `${data?.stats.acceptedWithoutEdits ?? 0}%`, trend: '',       icon: <CheckCircle size={16} />, accent: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.18)' },
    { label: 'Time Saved',             value: loading ? '—' : timeSavedDisplay,                            trend: '',       icon: <Clock size={16} />,       accent: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)'  },
    { label: 'Most Used Site',         value: loading ? '—' : (data?.stats.mostUsedSite ?? 'N/A'),         trend: '',       icon: <Globe size={16} />,       accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
  ];

  const topSites = data?.topSites ?? [];
  const weekData = data?.weekData ?? [];
  const insights = data?.insights ?? [];
  const maxForms = weekData.length ? Math.max(...weekData.map(d => d.forms), 1) : 1;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: SKELETON_CSS + `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes neuralPulse { 0%,100% { opacity:.15; transform:scale(1); } 50% { opacity:.4; transform:scale(1.06); } }

        .ua-stat-card {
          background:#111114; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:20px;
          position:relative; overflow:hidden;
          box-shadow:0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease both;
        }
        .ua-stat-card::before {
          content:''; position:absolute; top:0; left:0; width:3px; height:36px;
          background:rgba(245,158,11,0.35); border-radius:0 0 2px 0;
        }
        .ua-card {
          background:#111114; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:24px;
          box-shadow:0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease .1s both; position:relative; overflow:hidden;
        }
        .ua-info-card {
          background:#111114; border:1px solid rgba(99,102,241,0.2); border-radius:4px; padding:22px;
          box-shadow:0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03);
          animation: fadeSlideIn .4s ease .2s both; position:relative; overflow:hidden;
        }
        .ua-info-card::after {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse at top left, rgba(99,102,241,0.05) 0%, transparent 60%);
          pointer-events:none;
        }
        .ua-bar-col:hover .ua-bar-fill { opacity:.8; }
        .ua-site-row { margin-bottom:14px; }
        .ua-site-row:last-child { margin-bottom:0; }
        .neural-blob-ua {
          position:absolute; border-radius:50%; pointer-events:none;
          animation: neuralPulse 4s ease-in-out infinite;
        }
        .section-label-ua {
          display:flex; align-items:center; gap:8px;
          font-size:10px; color:#3f3f46;
          font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.08em; margin-bottom:16px;
        }
        .section-label-line-ua { flex:1; height:1px; background:rgba(255,255,255,0.05); }
      `}} />

      {loading ? (
        <div>
          <SkeletonBlock w="200px" h="28px" mb="28px" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px' }}>
            {[1,2,3,4].map(i => <SkeletonCard key={i}><SkeletonBlock w="80px" h="10px" mb="10px" /><SkeletonBlock w="60px" h="28px" /></SkeletonCard>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
            <SkeletonCard><SkeletonBlock w="100%" h="140px" /></SkeletonCard>
            <SkeletonCard>{[1,2,3,4,5].map(i => <SkeletonBlock key={i} w="100%" h="28px" mb="10px" />)}</SkeletonCard>
          </div>
          <SkeletonCard><SkeletonBlock w="100%" h="60px" /></SkeletonCard>
        </div>
      ) : (
      <>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px' }}>
        <div>
          <div style={{ fontSize:'10px', color:'#a1a1aa', marginBottom:'6px', fontFamily:"'DM Mono', monospace", textTransform:'uppercase', letterSpacing:'0.07em' }}>
            Dashboard · Analytics
          </div>
          <h2 style={{ fontSize:'28px', fontWeight:800, lineHeight:1.0, letterSpacing:'-1px', color:'#f0ece4', margin:0, fontFamily:"'Playfair Display', Georgia, serif" }}>
            Usage &{' '}
            <em style={{ fontStyle:'italic', background:'linear-gradient(135deg,#6366f1 0%,#a5b4fc 55%,#6366f1 100%)', backgroundSize:'200% 200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Analytics
            </em>
          </h2>
          <p style={{ fontSize:'13px', color:'#52525b', marginTop:'6px', fontWeight:300 }}>
            Track your form filling activity and impact.
          </p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px' }}>
        {stats.map((s, i) => (
          <div className="ua-stat-card" key={i} style={{ animationDelay:`${i*0.07}s` }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px' }}>
              <p style={{ fontSize:'10px', color:'#3f3f46', margin:0, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>{s.label}</p>
              <div style={{ width:'32px', height:'32px', borderRadius:'4px', background:s.bg, border:`1px solid ${s.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:s.accent, flexShrink:0 }}>
                {s.icon}
              </div>
            </div>
            <p style={{ fontSize:'28px', fontWeight:800, color:'#f0ece4', margin:'0 0 4px', fontFamily:"'Playfair Display',serif", letterSpacing:'-1px', lineHeight:1 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
        <div className="ua-card">
          <div className="neural-blob-ua" style={{ width:'160px', height:'160px', top:'-60px', right:'-60px', background:'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
          <div className="section-label-ua">
            <Calendar size={10} /> This Week&apos;s Activity <div className="section-label-line-ua" />
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'120px' }}>
            {weekData.length === 0 ? (
              <p style={{ fontSize:'12px', color:'#3f3f46', fontFamily:"'DM Mono',monospace" }}>No data yet</p>
            ) : weekData.map((d, i) => (
              <div key={i} className="ua-bar-col" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', height:'100%', justifyContent:'flex-end' }}>
                <div style={{ width:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', height:'100%' }}>
                  <div className="ua-bar-fill" style={{ width:'100%', borderRadius:'3px 3px 0 0', height:`${(d.forms/maxForms)*100}%`, minHeight:'4px', background:'linear-gradient(180deg,#6366f1,rgba(99,102,241,0.5))', transition:'opacity .15s' }} />
                </div>
                <span style={{ fontSize:'9px', color:'#52525b', fontFamily:"'DM Mono',monospace", textTransform:'uppercase' }}>{d.day}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'14px', paddingTop:'14px', borderTop:'1px solid rgba(255,255,255,0.05)', textAlign:'center' }}>
            <p style={{ fontSize:'11px', color:'#52525b', margin:0, fontFamily:"'DM Mono',monospace" }}>
              Total: <span style={{ color:'#f0ece4', fontWeight:500 }}>{data?.stats.formsFilled ?? 0} forms</span>
            </p>
          </div>
        </div>

        <div className="ua-card">
          <div className="neural-blob-ua" style={{ width:'150px', height:'150px', bottom:'-50px', left:'-40px', background:'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)', animationDelay:'2s' }} />
          <div className="section-label-ua">
            <TrendingUp size={10} /> Most Used Websites <div className="section-label-line-ua" />
          </div>
          {topSites.length === 0 ? (
            <p style={{ fontSize:'12px', color:'#3f3f46', fontFamily:"'DM Mono',monospace" }}>No activity yet</p>
          ) : topSites.map((site, i) => (
            <div key={i} className="ua-site-row">
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={{ fontSize:'12px', color:'#f0ece4', fontWeight:400 }}>{site.name}</span>
                <span style={{ fontSize:'11px', color:'#52525b', fontFamily:"'DM Mono',monospace" }}>{site.count} forms</span>
              </div>
              <div style={{ height:'3px', borderRadius:'2px', background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${site.pct}%`, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:'2px', transition:'width .4s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ua-info-card">
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'4px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Sparkles size={13} style={{ color:'#818cf8' }} />
          </div>
          <span style={{ fontSize:'10px', color:'#818cf8', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.07em' }}>
            Insights
          </span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {insights.map((tip, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
              <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#6366f1', marginTop:'6px', flexShrink:0 }} />
              <p style={{ fontSize:'12px', color:'#71717a', margin:0, fontWeight:300, lineHeight:1.65 }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
