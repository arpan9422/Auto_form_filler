'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileText, Zap, Clock, TrendingUp, ArrowRight, Wallet, Gift } from 'lucide-react';
import { dashboardApi, type DashboardOverview as DashboardOverviewData } from '@/lib/services';
import { SKELETON_CSS, SkeletonBlock, SkeletonCard } from './Skeleton';

gsap.registerPlugin(ScrollTrigger);

export function DashboardOverview() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.overview().then(r => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const cards = statsRef.current?.querySelectorAll('.stat-card');
    if (cards) {
      gsap.fromTo(cards,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.1 }
      );
    }
    const bottom = bottomRef.current?.querySelectorAll('.bottom-card');
    if (bottom) {
      gsap.fromTo(bottom,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.4 }
      );
    }
  }, [loading]);

  const stats = [
    {
      label: 'Credits Used',
      value: data ? String(data.stats.creditsUsedThisWeek) : '—',
      suffix: 'this week',
      icon: <FileText size={15} />,
      progress: data ? Math.min(100, Math.round((data.stats.creditsUsedThisWeek / (data.wallet.weeklyFreeCredits || 10)) * 100)) : null,
      sub: null,
    },
    {
      label: 'Free Left',
      value: data ? String(data.stats.freeLeftThisWeek) : '—',
      suffix: 'this week',
      icon: <Zap size={15} />,
      progress: null,
      sub: 'Resets on Monday',
    },
    {
      label: 'Time Saved',
      value: data ? String(data.stats.timeSavedMinutesThisWeek) : '—',
      suffix: 'mins',
      icon: <Clock size={15} />,
      progress: null,
      sub: 'This week',
    },
    {
      label: 'Paid Credits',
      value: data ? String(data.stats.paidCredits) : '—',
      suffix: null,
      icon: <TrendingUp size={15} />,
      progress: null,
      sub: null,
      cta: true,
    },
  ];

  const recentSites = data?.recentSites ?? [];

  return (
    <div ref={wrapRef} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: SKELETON_CSS + `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.3; transform:scale(1.8); }
        }

        .stat-card {
          background: #111114;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px;
          padding: clamp(16px, 4vw, 24px);
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
          transition: all 0.22s ease;
          opacity: 0;
        }
        .stat-card:hover {
          border-color: rgba(245,158,11,0.2);
          transform: translateY(-3px) rotate(-0.2deg);
          box-shadow: 0 16px 48px rgba(0,0,0,0.5), 4px 4px 0 rgba(245,158,11,0.08);
        }

        .bottom-card {
          background: #111114;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px;
          padding: clamp(20px, 5vw, 28px);
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
          opacity: 0;
        }

        .site-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.04);
          background: rgba(255,255,255,0.02);
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .site-row:hover {
          background: rgba(245,158,11,0.04);
          border-color: rgba(245,158,11,0.15);
        }
        .site-row:hover .site-name {
          color: #d4d4d8 !important;
        }

        .upgrade-btn {
          width: 100%;
          padding: 9px 0;
          background: transparent;
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 4px;
          color: #d97706;
          font-size: 13px;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.18s ease;
          margin-top: 16px;
        }
        .upgrade-btn:hover {
          background: rgba(245,158,11,0.06);
          border-color: rgba(245,158,11,0.5);
          transform: translateY(-1px);
          box-shadow: 3px 3px 0 rgba(245,158,11,0.2);
        }

        .view-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: none;
          color: #52525b;
          font-size: 13px;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }
        .view-all-btn:hover { color: #a1a1aa; }

        .wallet-hero {
          background: linear-gradient(180deg, rgba(245,158,11,0.06), #111114 70%);
          border: 1px solid rgba(245,158,11,0.18);
          border-radius: 4px;
          padding: clamp(20px, 4vw, 28px);
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
          marginBottom: 20px;
        }
      `}} />

      {loading ? (
        <div>
          {/* Wallet hero skeleton */}
          <SkeletonCard>
            <SkeletonBlock w="140px" h="12px" mb="16px" />
            <SkeletonBlock w="100px" h="52px" mb="10px" />
            <SkeletonBlock w="200px" h="14px" mb="14px" />
            <div style={{ display:'flex', gap:'16px' }}>
              <SkeletonBlock w="120px" h="12px" />
              <SkeletonBlock w="120px" h="12px" />
            </div>
          </SkeletonCard>
          {/* Stat cards skeleton */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'16px', margin:'20px 0' }}>
            {[1,2,3,4].map(i => (
              <SkeletonCard key={i}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
                  <SkeletonBlock w="80px" h="10px" />
                  <SkeletonBlock w="28px" h="28px" radius="4px" />
                </div>
                <SkeletonBlock w="60px" h="36px" mb="8px" />
                <SkeletonBlock w="100%" h="2px" />
              </SkeletonCard>
            ))}
          </div>
          {/* Bottom cards skeleton */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'16px' }}>
            {[1,2].map(i => (
              <SkeletonCard key={i}>
                <SkeletonBlock w="120px" h="12px" mb="20px" />
                {[1,2,3].map(j => <SkeletonBlock key={j} w="100%" h="40px" mb="8px" />)}
              </SkeletonCard>
            ))}
          </div>
        </div>
      ) : (
      <>
      <div className="wallet-hero">
        <div style={{
          position: 'absolute', top: '-70px', right: '-60px',
          width: '190px', height: '190px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.16) 0%, transparent 72%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', position: 'relative' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Wallet size={13} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '12px', color: '#d97706', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Credits Balance
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: 'clamp(40px, 8vw, 56px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px', color: '#f0ece4', fontFamily: "'Playfair Display', Georgia, serif" }}>
                {loading ? '—' : (data?.wallet.credits ?? 0)}
              </span>
              <span style={{ fontSize: '22px', color: '#f59e0b' }}>⚡</span>
            </div>
            <p style={{ fontSize: '15px', color: '#71717a', margin: '0 0 14px', fontWeight: 300 }}>
              {loading ? '—' : `${data?.wallet.freeLeftThisWeek ?? 0} free left this week`}
            </p>
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: "'DM Mono', monospace" }}>
                Free Weekly: {loading ? '—' : `${data?.wallet.freeLeftThisWeek ?? 0} left`}
              </span>
              <span style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: "'DM Mono', monospace" }}>
                Paid Credits: {loading ? '—' : (data?.wallet.paidCredits ?? 0)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px 4px 7px', borderRadius: '4px', border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.05)' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399', animation: 'heroPulse 2.5s infinite', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: '#34d399', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Wallet Active
              </span>
            </div>
            <button className="upgrade-btn" style={{ marginTop: 0, minWidth: '170px' }}>
              Buy Credits
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Gift size={12} style={{ color: '#34d399' }} />
              <span style={{ fontSize: '12px', color: '#71717a', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Earn 10 per referral
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div ref={statsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'clamp(12px, 2vw, 16px)', marginBottom: '20px' }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {s.label}
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                {s.icon}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-1.5px', color: '#f0ece4', fontFamily: "'Playfair Display', Georgia, serif" }}>
                {s.value}
              </span>
              {s.suffix && (
                <span style={{ fontSize: '14px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>
                  {s.suffix}
                </span>
              )}
            </div>

            {s.progress !== null && (
              <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '12px' }}>
                <div style={{ height: '2px', borderRadius: '2px', background: 'linear-gradient(90deg, #f59e0b, #fde68a)', width: `${s.progress}%`, boxShadow: '0 0 8px rgba(245,158,11,0.4)' }} />
              </div>
            )}

            {s.sub && (
              <p style={{ fontSize: '13px', color: '#3f3f46', marginTop: '10px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.sub}
              </p>
            )}

            {s.cta && (
              <button className="upgrade-btn">Buy Credits</button>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Row */}
      <div ref={bottomRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(12px, 2vw, 16px)' }}>
        {/* Recent Sites */}
        <div className="bottom-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Activity
              </div>
              <h3 style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 800, color: '#f0ece4', letterSpacing: '-0.5px', fontFamily: "'Playfair Display', Georgia, serif", margin: 0 }}>
                Last Used{' '}
                <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Websites
                </em>
              </h3>
            </div>
            <button className="view-all-btn">
              View All <ArrowRight size={11} />
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <svg width="120" height="8" viewBox="0 0 120 8" fill="none">
              <path d="M2 6 C20 2, 48 7, 72 4 C92 2, 108 6, 118 4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentSites.length === 0 && !loading && (
              <p style={{ fontSize: '13px', color: '#3f3f46', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                No activity yet
              </p>
            )}
            {recentSites.map((site, i) => (
              <div key={i} className="site-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: i === 0 ? '#f59e0b' : 'rgba(255,255,255,0.1)', display: 'inline-block', animation: i === 0 ? 'heroPulse 2.5s infinite' : 'none', flexShrink: 0 }} />
                  <span className="site-name" style={{ fontSize: '15px', color: '#71717a', fontWeight: 300, transition: 'color 0.15s ease' }}>
                    {site.name}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#3f3f46', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {site.timeLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Edits */}
        <div className="bottom-card">
          <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            This week
          </div>

          <h3 style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 800, color: '#f0ece4', letterSpacing: '-0.5px', fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '16px' }}>
            AI{' '}
            <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Edits
            </em>
          </h3>

          <div style={{ fontSize: 'clamp(48px, 10vw, 64px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-3px', color: '#f0ece4', fontFamily: "'Playfair Display', Georgia, serif", marginBottom: '4px' }}>
            {loading ? '—' : (data?.aiEdits.thisWeek ?? 0)}
          </div>

          <p style={{ fontSize: '15px', color: '#52525b', fontWeight: 300, marginBottom: '20px' }}>
            Applied this week
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px 4px 7px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)', marginBottom: '16px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', animation: 'heroPulse 2.5s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: '#d97706', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              {loading ? '—' : `${data?.aiEdits.quotaPercent ?? 0}% of quota`}
            </span>
          </div>

          <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
            <div style={{ height: '2px', borderRadius: '2px', background: 'linear-gradient(90deg, #f59e0b, #fde68a)', width: `${data?.aiEdits.quotaPercent ?? 0}%`, boxShadow: '0 0 8px rgba(245,158,11,0.4)' }} />
          </div>

          <div style={{ marginTop: '20px', fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.08)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            AI-powered · real-time
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
