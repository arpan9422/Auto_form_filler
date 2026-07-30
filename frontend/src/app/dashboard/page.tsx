'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { ProfileContext } from '@/components/dashboard/ProfileContext';
import { ProjectsSection } from '@/components/dashboard/ProjectsSection';
import { AnswersLibrary } from '@/components/dashboard/AnswersLibrary';
import { ResumeSection } from '@/components/dashboard/ResumeSection';
import { AIMemory } from '@/components/dashboard/AIMemory';
import { UsageAnalytics } from '@/components/dashboard/UsageAnalytics';
import { ChatAgent } from '@/components/dashboard/ChatAgent';
import { LLMGateway } from '@/components/dashboard/LLMGateway';
import { OutreachCampaign } from '@/components/dashboard/OutreachCampaign';
import { Home, User, Briefcase, MessageSquare, FileText, Brain, BarChart3, LogOut, Bot, Cpu, Mail } from 'lucide-react';
import { removeToken } from '@/lib/auth';
import { getCurrentUser } from '@/lib/currentUser';

type TabId = 'overview' | 'chat' | 'gateway' | 'outreach' | 'profile' | 'projects' | 'answers' | 'resume' | 'memory' | 'analytics';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Overview',  icon: <Home size={14} /> },
  { id: 'chat',      label: 'Chat Agent',icon: <Bot size={14} color="#a855f7" /> },
  { id: 'gateway',   label: 'LLM Gateway', icon: <Cpu size={14} color="#3b82f6" /> },
  { id: 'outreach',  label: 'Cold Outreach', icon: <Mail size={14} color="#d97706" /> },
  { id: 'profile',   label: 'Profile',   icon: <User size={14} /> },
  { id: 'projects',  label: 'Projects',  icon: <Briefcase size={14} /> },
  { id: 'answers',   label: 'Answers',   icon: <MessageSquare size={14} /> },
  { id: 'resume',    label: 'Resume',    icon: <FileText size={14} /> },
  { id: 'memory',    label: 'AI Memory', icon: <Brain size={14} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
];

const PANELS: Record<TabId, React.ReactNode> = {
  overview:  <DashboardOverview />,
  chat:      <ChatAgent />,
  gateway:   <LLMGateway />,
  outreach:  <OutreachCampaign />,
  profile:   <ProfileContext />,
  projects:  <ProjectsSection />,
  answers:   <AnswersLibrary />,
  resume:    <ResumeSection />,
  memory:    <AIMemory />,
  analytics: <UsageAnalytics />,
};

export default function DashboardPage() {
  const [active, setActive] = useState<TabId>('overview');
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const currentUser = await getCurrentUser();

        if (!currentUser.onboardingDone) {
          router.replace('/onboarding');
          return;
        }

        if (mounted) {
          setUserName(currentUser.firstName);
          setCheckingOnboarding(false);
        }
      } catch {
        removeToken();
        router.replace('/');
        return;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const tab = search.get('tab') as TabId;
      if (tab && TABS.some(t => t.id === tab)) {
        setActive(tab);
      } else if (search.has('github')) {
        setActive('profile');
      }
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  if (checkingOnboarding) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0b0c', display: 'grid', placeItems: 'center', color: '#f0ece4', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#d97706', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Loading
          </div>
          <p style={{ margin: 0, color: '#71717a' }}>Checking your workspace setup.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0c', fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.3; transform:scale(1.8); }
        }

        .db-tab {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 12px 18px;
          border: none;
          background: transparent;
          color: #52525b;
          font-size: 11px;
          font-weight: 600;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          cursor: pointer;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
        }
        .db-tab:hover { color: #a1a1aa; }
        .db-tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
        .db-tab.active svg { color: #f59e0b; }

        .tab-bar::-webkit-scrollbar { height: 0; }
      `}} />

      {/* ── Top header ── */}
      <div style={{ background: '#0e0e11', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 36px 0' }}>

          {/* Wordmark row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#3f3f46', marginBottom: '8px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                AI Form Assistant
              </div>
              <h1 style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-1.5px', color: '#f0ece4', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {userName ? `${userName}'s` : 'Your'}{' '}
                <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Dashboard
                </em>
              </h1>
              <p style={{ fontSize: '14px', color: '#52525b', marginTop: '8px', fontWeight: 300 }}>
                Manage your profile, projects, and AI context.
              </p>
            </div>

            {/* Right side actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    background: 'transparent',
                    color: '#a1a1aa',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: "'DM Mono', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.color = '#ef4444';
                    (e.target as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
                    (e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.color = '#a1a1aa';
                    (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                    (e.target as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <LogOut size={12} /> Logout
                </button>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="tab-bar" style={{ display: 'flex', overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`db-tab${active === tab.id ? ' active' : ''}`}
                onClick={() => setActive(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px' }}>
        {PANELS[active]}
      </div>
    </div>
  );
}
