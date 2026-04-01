'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { Briefcase, Plus, Star, Github, Mic, MicOff, X, CheckCircle } from 'lucide-react';
import { projectsApi, type Project as ApiProject } from '@/lib/services';

interface Project {
  id: string;
  name: string;
  description: string;
  stack: string[];
  isPinned: boolean;
  githubUrl?: string;
}

function toUiProject(p: ApiProject): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    stack: p.techStacks,
    isPinned: false,
    githubUrl: p.projectLinks[0],
  };
}

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', stack: '', githubUrl: '' });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [githubStatus, setGithubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [githubError, setGithubError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    projectsApi.list().then(r => {
      setProjects(r.data.map(toUiProject));
      setLoadingProjects(false);
    }).catch(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    if (loadingProjects) return;
    const cards = wrapRef.current?.querySelectorAll('.project-card');
    if (cards) {
      gsap.fromTo(cards, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out', delay: 0.05 });
    }
  }, [loadingProjects]);

  const extractFromGithub = useCallback(async () => {
    const url = newProject.githubUrl.trim();
    if (!url) return;
    const match = url.match(/(?:github\.com\/)?([^/\s]+)\/([^/\s]+)/);
    if (!match) { setGithubStatus('error'); setGithubError('Enter a valid repo path (e.g. user/repo)'); return; }
    const [, owner, repo] = match;
    setGithubStatus('loading'); setGithubError('');
    try {
      const [repoRes, langRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}`),
        fetch(`https://api.github.com/repos/${owner}/${repo}/languages`),
      ]);
      if (!repoRes.ok) throw new Error('Repository not found or private');
      const data = await repoRes.json();
      const langs = langRes.ok ? await langRes.json() : {};
      const topLangs = Object.keys(langs).slice(0, 5);
      setNewProject(prev => ({ ...prev, name: prev.name || data.name || repo, description: data.description || prev.description || '', stack: topLangs.length ? topLangs.join(', ') : prev.stack }));
      setGithubStatus('success');
    } catch (e) { setGithubStatus('error'); setGithubError(e instanceof Error ? e.message : 'Failed to fetch'); }
  }, [newProject.githubUrl]);

  const toggleRecording = useCallback(() => {
    setIsRecording(v => !v);
  }, []);

  const togglePin = (id: string) => setProjects(projects.map(p => p.id === id ? { ...p, isPinned: !p.isPinned } : p));

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    await projectsApi.remove(id).catch(() => {});
  };

  const addProject = async () => {
    if (!newProject.name.trim()) return;
    const links = newProject.githubUrl ? [newProject.githubUrl] : [];
    const stacks = newProject.stack.split(',').map(s => s.trim()).filter(Boolean);
    try {
      const res = await projectsApi.create({ name: newProject.name, description: newProject.description, projectLinks: links, techStacks: stacks });
      setProjects(prev => [...prev, toUiProject(res.data)]);
    } catch {
      // optimistic fallback
      setProjects(prev => [...prev, { id: Date.now().toString(), name: newProject.name, description: newProject.description, stack: stacks, isPinned: false, githubUrl: newProject.githubUrl || undefined }]);
    }
    setNewProject({ name: '', description: '', stack: '', githubUrl: '' });
    setGithubStatus('idle'); setIsRecording(false); setShowAdd(false);
  };

  const closePanel = () => { setIsRecording(false); setShowAdd(false); setGithubStatus('idle'); };
  const pinnedProjects = projects.filter(p => p.isPinned);

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px',
    fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' as const, letterSpacing: '0.07em',
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    background: focusedField === field ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)',
    border: focusedField === field ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.07)',
    borderRadius: '4px', padding: '9px 12px', fontSize: '15px',
    color: '#f0ece4', fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
    outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' as const, caretColor: '#f59e0b',
  });

  return (
    <div ref={wrapRef} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes heroPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.8)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes voicePulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)} 50%{box-shadow:0 0 0 7px rgba(245,158,11,0)} }
        @keyframes waveBar0 { 0%,100%{transform:scaleY(0.25)} 50%{transform:scaleY(1)} }
        @keyframes waveBar1 { 0%,100%{transform:scaleY(0.5)} 50%{transform:scaleY(0.85)} }
        @keyframes waveBar2 { 0%,100%{transform:scaleY(0.35)} 50%{transform:scaleY(1)} }
        @keyframes waveBar3 { 0%,100%{transform:scaleY(0.6)} 50%{transform:scaleY(0.9)} }
        @keyframes waveBar4 { 0%,100%{transform:scaleY(0.2)} 50%{transform:scaleY(1)} }
        @keyframes waveBar5 { 0%,100%{transform:scaleY(0.45)} 50%{transform:scaleY(0.8)} }
        @keyframes waveBar6 { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(0.95)} }
        .wave-bar { width:3px; border-radius:2px; background:#f59e0b; transform-origin:center; transition:opacity 0.3s ease; }
        .wave-bar.idle { transform:scaleY(0.25); opacity:0.25; }
        .wave-bar-0.active{animation:waveBar0 0.55s ease-in-out infinite}
        .wave-bar-1.active{animation:waveBar1 0.60s ease-in-out infinite 0.08s}
        .wave-bar-2.active{animation:waveBar2 0.50s ease-in-out infinite 0.14s}
        .wave-bar-3.active{animation:waveBar3 0.65s ease-in-out infinite 0.06s}
        .wave-bar-4.active{animation:waveBar4 0.52s ease-in-out infinite 0.18s}
        .wave-bar-5.active{animation:waveBar5 0.58s ease-in-out infinite 0.10s}
        .wave-bar-6.active{animation:waveBar6 0.62s ease-in-out infinite 0.04s}
        .project-card {
          background:#111114; border:1px solid rgba(255,255,255,0.07); border-radius:4px; padding:22px;
          position:relative; overflow:hidden;
          box-shadow:0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
          transition:all 0.22s ease; opacity:0;
        }
        .project-card:hover { border-color:rgba(245,158,11,0.18); transform:translateY(-3px) rotate(-0.2deg); box-shadow:0 16px 48px rgba(0,0,0,0.5),4px 4px 0 rgba(245,158,11,0.07); }
        .project-card.pinned { border-color:rgba(245,158,11,0.2); }
        .stack-chip { display:inline-block; padding:3px 9px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); font-size:12px; color:#52525b; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:0.05em; transition:all 0.15s ease; }
        .project-card:hover .stack-chip { border-color:rgba(245,158,11,0.15); color:#71717a; }
        .pin-btn { background:none; border:none; cursor:pointer; padding:5px; border-radius:4px; transition:all 0.15s ease; display:flex; align-items:center; justify-content:center; color:#3f3f46; }
        .pin-btn:hover { background:rgba(245,158,11,0.08); color:#d97706; }
        .pin-btn.active { color:#f59e0b; }
        .action-btn { display:inline-flex; align-items:center; justify-content:center; gap:5px; flex:1; padding:7px 0; border-radius:4px; font-size:12px; font-weight:600; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:0.05em; cursor:pointer; transition:all 0.15s ease; border:1px solid rgba(255,255,255,0.07); background:transparent; color:#52525b; }
        .action-btn:hover { color:#a1a1aa; border-color:rgba(255,255,255,0.14); background:rgba(255,255,255,0.03); }
        .action-btn.danger:hover { color:#f87171; border-color:rgba(248,113,113,0.25); background:rgba(248,113,113,0.04); }
        .add-project-btn { display:inline-flex; align-items:center; gap:7px; padding:8px 18px; border-radius:4px; font-size:13px; font-weight:700; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:0.06em; cursor:pointer; background:#f59e0b; color:#0b0b0c; border:2px solid #f59e0b; transition:all 0.18s ease; }
        .add-project-btn:hover:not(:disabled) { transform:translateY(-1px) rotate(-0.4deg); box-shadow:3px 3px 0 rgba(245,158,11,0.35); }
        .add-project-btn:disabled { opacity:0.45; cursor:not-allowed; }
        .cancel-btn { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:4px; font-size:13px; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:0.06em; cursor:pointer; background:transparent; color:#52525b; border:1px solid rgba(255,255,255,0.08); transition:all 0.15s ease; }
        .cancel-btn:hover { color:#a1a1aa; border-color:rgba(255,255,255,0.15); }
        .section-label { display:flex; align-items:center; gap:8px; font-size:12px; color:#a1a1aa; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:14px; }
        .section-label-line { flex:1; height:1px; background:rgba(255,255,255,0.05); }
        .github-btn { display:inline-flex; align-items:center; gap:6px; padding:0 14px; height:38px; border-radius:4px; flex-shrink:0; font-size:12px; font-weight:600; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; cursor:pointer; transition:all 0.15s ease; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:#71717a; }
        .github-btn:hover:not(:disabled) { border-color:rgba(245,158,11,0.3); color:#d97706; background:rgba(245,158,11,0.04); }
        .github-btn:disabled { opacity:0.45; cursor:not-allowed; }
        .github-btn.success { border-color:rgba(52,211,153,0.35); color:#34d399; background:rgba(52,211,153,0.04); }
        .github-btn.error-state { border-color:rgba(248,113,113,0.3); color:#f87171; background:rgba(248,113,113,0.04); }
        .mic-btn { display:inline-flex; align-items:center; gap:6px; padding:0 14px; height:36px; border-radius:4px; flex-shrink:0; font-size:12px; font-weight:600; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:0.05em; cursor:pointer; transition:all 0.15s ease; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:#71717a; }
        .mic-btn:hover { border-color:rgba(245,158,11,0.3); color:#d97706; }
        .mic-btn.recording { border-color:rgba(245,158,11,0.5); color:#f59e0b; background:rgba(245,158,11,0.06); animation:voicePulse 1.2s ease-in-out infinite; }
      `}} />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px' }}>
        <div>
          <div style={{ fontSize:'12px', color:'#a1a1aa', marginBottom:'6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.07em' }}>
            Dashboard · Projects
          </div>
          <h2 style={{ fontSize:'32px', fontWeight:800, lineHeight:1.0, letterSpacing:'-1px', color:'#f0ece4', margin:0, fontFamily:"'Playfair Display',Georgia,serif" }}>
            Projects &{' '}
            <em style={{ fontStyle:'italic', background:'linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)', backgroundSize:'200% 200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Experience
            </em>
          </h2>
          <p style={{ fontSize:'15px', color:'#52525b', marginTop:'6px', fontWeight:300 }}>
            Pinned projects are prioritised by AI when filling forms.
          </p>
        </div>
        <button className="add-project-btn" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={12} /> Add Project
        </button>
      </div>

      {/* Add Project Panel */}
      {showAdd && (
        <div style={{ background:'#111114', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'4px', padding:'28px', marginBottom:'24px', boxShadow:'0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-50px', right:'-50px', width:'180px', height:'180px', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', filter:'blur(30px)', pointerEvents:'none' }} />

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'22px' }}>
            <div style={{ fontSize:'12px', color:'#d97706', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:'7px' }}>
              <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#f59e0b', animation:'heroPulse 2.5s infinite', display:'inline-block' }} />
              New Project
            </div>
            <button onClick={closePanel} style={{ background:'none', border:'none', cursor:'pointer', color:'#3f3f46', padding:'2px', display:'flex', transition:'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#71717a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}>
              <X size={14} />
            </button>
          </div>

          {/* Name + Stack */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
            <div>
              <label style={labelStyle}>Project Name</label>
              <input placeholder="e.g. Wisdomly" value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                onFocus={() => setFocusedField('np-name')} onBlur={() => setFocusedField(null)}
                style={inputStyle('np-name')} />
            </div>
            <div>
              <label style={labelStyle}>Tech Stack (comma separated)</label>
              <input placeholder="React, Node, Prisma" value={newProject.stack}
                onChange={e => setNewProject({ ...newProject, stack: e.target.value })}
                onFocus={() => setFocusedField('np-stack')} onBlur={() => setFocusedField(null)}
                style={inputStyle('np-stack')} />
            </div>
          </div>

          {/* GitHub */}
          <div style={{ marginBottom:'18px' }}>
            <label style={labelStyle}>
              <Github size={10} style={{ display:'inline', marginRight:'5px', verticalAlign:'middle' }} />
              GitHub Repo
              <span style={{ marginLeft:'8px', padding:'1px 7px', borderRadius:'3px', border:'1px solid rgba(245,158,11,0.2)', background:'rgba(245,158,11,0.05)', fontSize:'11px', color:'#d97706', letterSpacing:'0.05em' }}>auto-fill ✦</span>
            </label>
            <div style={{ display:'flex', gap:'8px' }}>
              <div style={{ flex:1, position:'relative' }}>
                <input placeholder="github.com/user/repo" value={newProject.githubUrl}
                  onChange={e => { setNewProject({ ...newProject, githubUrl: e.target.value }); if (githubStatus !== 'idle') setGithubStatus('idle'); }}
                  onFocus={() => setFocusedField('np-github')} onBlur={() => setFocusedField(null)}
                  onKeyDown={e => e.key === 'Enter' && extractFromGithub()}
                  style={{ ...inputStyle('np-github'), paddingLeft:'36px' }} />
                <div style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color: githubStatus === 'success' ? '#34d399' : githubStatus === 'error' ? '#f87171' : '#3f3f46', transition:'color 0.2s' }}>
                  {githubStatus === 'loading'
                    ? <span style={{ width:'12px', height:'12px', border:'1.5px solid #52525b', borderTopColor:'#d97706', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                    : githubStatus === 'success' ? <CheckCircle size={13} />
                    : <Github size={13} />}
                </div>
              </div>
              <button className={`github-btn ${githubStatus === 'success' ? 'success' : githubStatus === 'error' ? 'error-state' : ''}`}
                onClick={extractFromGithub} disabled={!newProject.githubUrl.trim() || githubStatus === 'loading'}>
                {githubStatus === 'loading' ? <>Fetching…</> : githubStatus === 'success' ? <><CheckCircle size={11} /> Extracted</> : <><Github size={11} /> Extract Info</>}
              </button>
            </div>
            {githubStatus === 'success' && <p style={{ fontSize:'13px', color:'#34d399', marginTop:'5px', fontFamily:"'DM Mono',monospace" }}>✓ Auto-filled from repo</p>}
            {githubStatus === 'error' && <p style={{ fontSize:'13px', color:'#f87171', marginTop:'5px', fontFamily:"'DM Mono',monospace" }}>✗ {githubError}</p>}
          </div>

          {/* Description + Mic */}
          <div style={{ marginBottom:'22px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
              <label style={{ ...labelStyle, marginBottom:0 }}>Description</label>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'3px', height:'18px' }}>
                  {[0,1,2,3,4,5,6].map(i => (
                    <div key={i} className={`wave-bar wave-bar-${i} ${isRecording ? 'active' : 'idle'}`} style={{ height:'14px' }} />
                  ))}
                </div>
                <button className={`mic-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}>
                  {isRecording ? <MicOff size={11} /> : <Mic size={11} />}
                  {isRecording ? 'Stop' : 'Speak'}
                </button>
              </div>
            </div>
            <div style={{ position:'relative' }}>
              <textarea placeholder={isRecording ? 'Listening… speak about your project' : 'What did you build? What problem does it solve?'}
                value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                onFocus={() => setFocusedField('np-desc')} onBlur={() => setFocusedField(null)}
                rows={4}
                style={{ ...inputStyle('np-desc'), resize:'vertical', lineHeight:1.65, minHeight:'96px',
                  border: isRecording ? '1px solid rgba(245,158,11,0.5)' : focusedField === 'np-desc' ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  background: isRecording ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)',
                }} />
              {isRecording && (
                <div style={{ position:'absolute', bottom:'10px', right:'12px', display:'flex', alignItems:'center', gap:'5px', fontFamily:"'DM Mono',monospace", fontSize:'11px', color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.06em', pointerEvents:'none' }}>
                  <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#f59e0b', animation:'heroPulse 1s infinite', display:'inline-block' }} /> rec
                </div>
              )}
            </div>
          </div>

          <div style={{ display:'flex', gap:'10px', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'20px' }}>
            <button className="add-project-btn" onClick={addProject} disabled={!newProject.name.trim()}>Save Project →</button>
            <button className="cancel-btn" onClick={closePanel}>Cancel</button>
          </div>
        </div>
      )}

      {/* Pinned Projects */}
      {pinnedProjects.length > 0 && (
        <div style={{ marginBottom:'28px' }}>
          <div className="section-label">
            <Star size={10} style={{ color:'#f59e0b', fill:'#f59e0b' }} />
            Pinned — used first by AI
            <div className="section-label-line" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'14px' }}>
            {pinnedProjects.map(p => <ProjectCard key={p.id} project={p} onTogglePin={togglePin} onDelete={deleteProject} />)}
          </div>
        </div>
      )}

      {/* All Projects */}
      <div>
        <div className="section-label">
          <Briefcase size={10} />
          All Projects
          <span style={{ padding:'1px 8px', borderRadius:'4px', border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)', fontSize:'11px', color:'#52525b' }}>{projects.length}</span>
          <div className="section-label-line" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'14px' }}>
          {projects.map(p => <ProjectCard key={p.id} project={p} onTogglePin={togglePin} onDelete={deleteProject} />)}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onTogglePin, onDelete }: {
  project: Project;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`project-card${project.isPinned ? ' pinned' : ''}`}>
      {project.isPinned && (
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'120px', height:'120px', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }} />
      )}

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', flex:1, minWidth:0 }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'4px', flexShrink:0, background: project.isPinned ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)', border: project.isPinned ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', color: project.isPinned ? '#d97706' : '#52525b' }}>
            <Briefcase size={14} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'3px' }}>
              <h4 style={{ fontSize:'17px', fontWeight:800, color:'#f0ece4', letterSpacing:'-0.3px', margin:0, fontFamily:"'Playfair Display',Georgia,serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {project.name}
              </h4>
              {project.githubUrl && (
                <a href={`https://${project.githubUrl.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                  style={{ color:'#3f3f46', display:'flex', flexShrink:0, transition:'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#71717a')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}>
                  <Github size={12} />
                </a>
              )}
            </div>
            <p style={{ fontSize:'14px', color:'#71717a', margin:0, fontWeight:300, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const, overflow:'hidden' }}>
              {project.description}
            </p>
          </div>
        </div>
        <button className={`pin-btn${project.isPinned ? ' active' : ''}`} onClick={() => onTogglePin(project.id)} title={project.isPinned ? 'Unpin' : 'Pin'}>
          <Star size={14} style={{ fill: project.isPinned ? '#f59e0b' : 'none' }} />
        </button>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'16px' }}>
        {project.stack.map(tech => <span key={tech} className="stack-chip">{tech}</span>)}
      </div>

      <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', marginBottom:'12px' }} />

      <div style={{ display:'flex', gap:'8px' }}>
        <button className="action-btn danger" onClick={() => onDelete(project.id)}>Delete</button>
      </div>
    </div>
  );
}
