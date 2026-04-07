'use client';

import { useEffect, useState } from 'react';
import { Github, CheckCircle, Unlink, ExternalLink } from 'lucide-react';
import { githubApi } from '@/lib/services';

type Status = { connected: boolean; login?: string; connectedAt?: string };

export function GitHubConnect() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = () => {
    githubApi.getStatus()
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // If returning from OAuth, refresh status
    if (typeof window !== 'undefined' && window.location.search.includes('github=')) {
      const url = new URL(window.location.href);
      const isError = url.searchParams.get('github') === 'error';
      url.searchParams.delete('github');
      window.history.replaceState({}, '', url.toString());
      if (isError) alert("GitHub connection failed or was cancelled.");
      load();
    }
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      const res = await githubApi.getAuthUrl();
      window.location.href = res.data.url;
    } catch {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await githubApi.disconnect();
      setStatus({ connected: false });
    } catch { /* silent */ }
    finally { setDisconnecting(false); }
  };

  if (loading) {
    return (
      <div style={{ height: '52px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }} />
    );
  }

  if (status?.connected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '4px', border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={15} style={{ color: '#34d399', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#f0ece4' }}>
              GitHub Connected
            </div>
            <div style={{ fontSize: '11px', color: '#52525b', marginTop: '1px', fontFamily: "'DM Mono', monospace" }}>
              @{status.login}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a
            href={`https://github.com/${status.login}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', color: '#52525b', transition: 'color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#a1a1aa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={disconnect}
            disabled={disconnecting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: '#f87171', fontSize: '11px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Unlink size={11} />
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={connecting}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '11px 0', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#a1a1aa', fontSize: '13px', fontWeight: 500, cursor: connecting ? 'not-allowed' : 'pointer', transition: 'all .18s', opacity: connecting ? 0.6 : 1 }}
      onMouseEnter={e => { if (!connecting) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,158,11,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#d97706'; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
    >
      <Github size={15} />
      {connecting ? 'Redirecting to GitHub…' : 'Connect GitHub Account'}
    </button>
  );
}
