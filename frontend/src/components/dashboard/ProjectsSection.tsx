'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { Briefcase, Plus, Github, Mic, MicOff, X, CheckCircle, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { projectsApi, githubApi, type Project as ApiProject } from '@/lib/services';

interface Project {
  id: string;
  name: string;
  description: string;
  stack: string[];
  githubUrl?: string;
  deployedUrl?: string;
}

function toUiProject(p: ApiProject): Project {
  const links = p.projectLinks ?? [];
  const github = links.find(l => l.includes('github.com'));
  const deployed = links.find(l => !l.includes('github.com'));
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    stack: p.techStacks,
    githubUrl: github,
    deployedUrl: deployed,
  };
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeStr(36, 'data'); view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

type FormState = { name: string; description: string; stack: string; githubUrl: string; deployedUrl: string };
const emptyForm = (): FormState => ({ name: '', description: '', stack: '', githubUrl: '', deployedUrl: '' });

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [githubStatus, setGithubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [githubError, setGithubError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    projectsApi.list().then(r => {
      setProjects(r.data.map(toUiProject));
      setLoadingProjects(false);
    }).catch(() => setLoadingProjects(false));
    // Check GitHub connection status
    githubApi.getStatus().then(r => setGithubConnected(r.data.connected)).catch(() => {});
  }, []);

  useEffect(() => {
    if (loadingProjects) return;
    const cards = wrapRef.current?.querySelectorAll('.project-card');
    if (cards) gsap.fromTo(cards, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out', delay: 0.05 });
  }, [loadingProjects]);

  const extractFromGithub = useCallback(async () => {
    const url = form.githubUrl.trim();
    if (!url) return;
    setGithubStatus('loading'); setGithubError('');
    try {
      const res = await projectsApi.githubAnalyze(url);
      const d = res.data;
      setForm(prev => ({
        ...prev,
        name: prev.name || d.name,
        description: [
          d.description,
          d.problemSolved ? `\n\nProblem: ${d.problemSolved}` : '',
          d.howItWorks ? `\n\nHow it works: ${d.howItWorks}` : '',
          d.keyFeatures?.length ? `\n\nKey features: ${d.keyFeatures.join(', ')}` : '',
        ].filter(Boolean).join('').trim(),
        stack: prev.stack || (d.techStack?.join(', ') ?? d.languages?.join(', ') ?? ''),
        deployedUrl: prev.deployedUrl,
      }));
      setGithubStatus('success');
      if (d.warning) setGithubError(`⚠️ ${d.warning}`);
    } catch (e) {
      setGithubStatus('error');
      setGithubError(e instanceof Error ? e.message : 'Failed to fetch');
    }
  }, [form.githubUrl]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } as MediaTrackConstraints });
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      const pcmChunks: Float32Array[] = [];
      processor.onaudioprocess = (e) => pcmChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      source.connect(processor); processor.connect(audioCtx.destination);
      mediaRecorderRef.current = {
        stop: () => {
          processor.disconnect(); source.disconnect();
          stream.getTracks().forEach(t => t.stop()); audioCtx.close();
          const totalLen = pcmChunks.reduce((s, c) => s + c.length, 0);
          const pcm = new Float32Array(totalLen);
          let off = 0; for (const c of pcmChunks) { pcm.set(c, off); off += c.length; }
          const wavBuffer = encodeWav(pcm, 16000);
          const bytes = new Uint8Array(wavBuffer);
          let binary = ''; const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunkSize)));
          const base64 = btoa(binary);
          setVoiceLoading(true);
          projectsApi.voiceDescribe(base64, form.name || undefined)
            .then(res => { setForm(prev => ({ ...prev, description: res.data.description })); if (res.data.warning) console.warn('[voice]', res.data.warning); })
            .catch(err => alert(`Voice error: ${err?.data?.error ?? err?.message ?? 'Failed'}`))
            .finally(() => setVoiceLoading(false));
        },
      } as unknown as MediaRecorder;
      setIsRecording(true);
    } catch { alert('Microphone access denied.'); }
  }, [isRecording, form.name]);

  const buildLinks = (f: FormState) => [f.githubUrl, f.deployedUrl].filter(Boolean) as string[];
  const buildStacks = (f: FormState) => f.stack.split(',').map(s => s.trim()).filter(Boolean);

  const openAdd = () => { setForm(emptyForm()); setGithubStatus('idle'); setEditingId(null); setShowAdd(true); };
  const openEdit = (p: Project) => {
    setForm({ name: p.name, description: p.description, stack: p.stack.join(', '), githubUrl: p.githubUrl ?? '', deployedUrl: p.deployedUrl ?? '' });
    setGithubStatus('idle'); setEditingId(p.id); setShowAdd(true);
  };
  const closePanel = () => { setIsRecording(false); setShowAdd(false); setEditingId(null); setGithubStatus('idle'); };

  const saveProject = async () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name, description: form.description, projectLinks: buildLinks(form), techStacks: buildStacks(form) };
    if (editingId) {
      try {
        const res = await projectsApi.update(editingId, payload);
        setProjects(prev => prev.map(p => p.id === editingId ? toUiProject(res.data) : p));
      } catch { setProjects(prev => prev.map(p => p.id === editingId ? { ...p, ...{ name: form.name, description: form.description, stack: buildStacks(form), githubUrl: form.githubUrl || undefined, deployedUrl: form.deployedUrl || undefined } } : p)); }
    } else {
      try {
        const res = await projectsApi.create(payload);
        setProjects(prev => [...prev, toUiProject(res.data)]);
      } catch { setProjects(prev => [...prev, { id: Date.now().toString(), name: form.name, description: form.description, stack: buildStacks(form), githubUrl: form.githubUrl || undefined, deployedUrl: form.deployedUrl || undefined }]); }
    }
    closePanel();
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    await projectsApi.remove(id).catch(() => {});
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', background: focusedField === field ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)',
    border: focusedField === field ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.07)',
    borderRadius: '4px', padding: '9px 12px', fontSize: '15px', color: '#f0ece4',
    fontFamily: "'DM Sans', sans-serif", fontWeight: 300, outline: 'none',
    transition: 'all 0.2s ease', boxSizing: 'border-box' as const, caretColor: '#f59e0b',
  });
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' as const, letterSpacing: '0.07em' };

  return (
    <div ref={wrapRef} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@0,300;0,400;0,500;0,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes heroPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(1.8)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes voicePulse{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)}50%{box-shadow:0 0 0 7px rgba(245,158,11,0)}}
        @keyframes waveBar0{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}
        @keyframes waveBar1{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(0.85)}}
        @keyframes waveBar2{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}
        @keyframes waveBar3{0%,100%{transform:scaleY(0.6)}50%{transform:scaleY(0.9)}}
        @keyframes waveBar4{0%,100%{transform:scaleY(0.2)}50%{transform:scaleY(1)}}
        @keyframes waveBar5{0%,100%{transform:scaleY(0.45)}50%{transform:scaleY(0.8)}}
        @keyframes waveBar6{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(0.95)}}
        .wave-bar{width:3px;border-radius:2px;background:#f59e0b;transform-origin:center;transition:opacity 0.3s ease}
        .wave-bar.idle{transform:scaleY(0.25);opacity:0.25}
        .wave-bar-0.active{animation:waveBar0 0.55s ease-in-out infinite}
        .wave-bar-1.active{animation:waveBar1 0.60s ease-in-out infinite 0.08s}
        .wave-bar-2.active{animation:waveBar2 0.50s ease-in-out infinite 0.14s}
        .wave-bar-3.active{animation:waveBar3 0.65s ease-in-out infinite 0.06s}
        .wave-bar-4.active{animation:waveBar4 0.52s ease-in-out infinite 0.18s}
        .wave-bar-5.active{animation:waveBar5 0.58s ease-in-out infinite 0.10s}
        .wave-bar-6.active{animation:waveBar6 0.62s ease-in-out infinite 0.04s}
        .project-card{background:#111114;border:1px solid rgba(255,255,255,0.07);border-radius:4px;padding:22px;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04);transition:all 0.22s ease}
        .project-card:hover{border-color:rgba(245,158,11,0.18);transform:translateY(-3px) rotate(-0.2deg);box-shadow:0 16px 48px rgba(0,0,0,0.5),4px 4px 0 rgba(245,158,11,0.07)}
        .stack-chip{display:inline-block;padding:3px 9px;border-radius:4px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);font-size:12px;color:#52525b;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.05em;transition:all 0.15s ease}
        .project-card:hover .stack-chip{border-color:rgba(245,158,11,0.15);color:#71717a}
        .action-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;flex:1;padding:7px 0;border-radius:4px;font-size:12px;font-weight:600;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.05em;cursor:pointer;transition:all 0.15s ease;border:1px solid rgba(255,255,255,0.07);background:transparent;color:#a1a1aa}
        .action-btn:hover{color:#f0ece4;border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.04)}
        .action-btn.edit:hover{color:#fbbf24;border-color:rgba(251,191,36,0.35);background:rgba(251,191,36,0.06)}
        .action-btn.danger:hover{color:#f87171;border-color:rgba(248,113,113,0.35);background:rgba(248,113,113,0.06)}
        .add-project-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:4px;font-size:13px;font-weight:700;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;background:#f59e0b;color:#0b0b0c;border:2px solid #f59e0b;transition:all 0.18s ease}
        .add-project-btn:hover:not(:disabled){transform:translateY(-1px) rotate(-0.4deg);box-shadow:3px 3px 0 rgba(245,158,11,0.35)}
        .add-project-btn:disabled{opacity:0.45;cursor:not-allowed}
        .cancel-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:4px;font-size:13px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;background:transparent;color:#52525b;border:1px solid rgba(255,255,255,0.08);transition:all 0.15s ease}
        .cancel-btn:hover{color:#a1a1aa;border-color:rgba(255,255,255,0.15)}
        .section-label{display:flex;align-items:center;gap:8px;font-size:12px;color:#a1a1aa;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px}
        .section-label-line{flex:1;height:1px;background:rgba(255,255,255,0.05)}
        .github-btn{display:inline-flex;align-items:center;gap:6px;padding:0 14px;height:38px;border-radius:4px;flex-shrink:0;font-size:12px;font-weight:600;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap;cursor:pointer;transition:all 0.15s ease;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#71717a}
        .github-btn:hover:not(:disabled){border-color:rgba(245,158,11,0.3);color:#d97706;background:rgba(245,158,11,0.04)}
        .github-btn:disabled{opacity:0.45;cursor:not-allowed}
        .github-btn.success{border-color:rgba(52,211,153,0.35);color:#34d399;background:rgba(52,211,153,0.04)}
        .github-btn.error-state{border-color:rgba(248,113,113,0.3);color:#f87171;background:rgba(248,113,113,0.04)}
        .mic-btn{display:inline-flex;align-items:center;gap:6px;padding:0 14px;height:36px;border-radius:4px;flex-shrink:0;font-size:12px;font-weight:600;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.05em;cursor:pointer;transition:all 0.15s ease;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#71717a}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .skeleton{border-radius:4px;background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);background-size:400px 100%;animation:shimmer 1.4s ease-in-out infinite}
        .mic-btn.recording{border-color:rgba(245,158,11,0.5);color:#f59e0b;background:rgba(245,158,11,0.06);animation:voicePulse 1.2s ease-in-out infinite}
      `}} />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px' }}>
        <div>
          <div style={{ fontSize:'12px', color:'#a1a1aa', marginBottom:'6px', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.07em' }}>Dashboard · Projects</div>
          <h2 style={{ fontSize:'32px', fontWeight:800, lineHeight:1.0, letterSpacing:'-1px', color:'#f0ece4', margin:0, fontFamily:"'Playfair Display',Georgia,serif" }}>
            Projects &{' '}
            <em style={{ fontStyle:'italic', background:'linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)', backgroundSize:'200% 200%', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Experience</em>
          </h2>
          <p style={{ fontSize:'15px', color:'#52525b', marginTop:'6px', fontWeight:300 }}>Add your projects with GitHub repos and deployed links.</p>
        </div>
        <button className="add-project-btn" onClick={openAdd}><Plus size={12} /> Add Project</button>
      </div>

      {/* Add / Edit Panel */}
      {showAdd && (
        <div style={{ background:'#111114', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'4px', padding:'28px', marginBottom:'24px', boxShadow:'0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-50px', right:'-50px', width:'180px', height:'180px', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', filter:'blur(30px)', pointerEvents:'none' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'22px' }}>
            <div style={{ fontSize:'12px', color:'#d97706', fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:'7px' }}>
              <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#f59e0b', animation:'heroPulse 2.5s infinite', display:'inline-block' }} />
              {editingId ? 'Edit Project' : 'New Project'}
            </div>
            <button onClick={closePanel} style={{ background:'none', border:'none', cursor:'pointer', color:'#3f3f46', padding:'2px', display:'flex' }} onMouseEnter={e=>(e.currentTarget.style.color='#71717a')} onMouseLeave={e=>(e.currentTarget.style.color='#3f3f46')}><X size={14} /></button>
          </div>

          {/* Name + Stack */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
            <div>
              <label style={labelStyle}>Project Name</label>
              <input placeholder="e.g. Wisdomly" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} onFocus={()=>setFocusedField('name')} onBlur={()=>setFocusedField(null)} style={inputStyle('name')} />
            </div>
            <div>
              <label style={labelStyle}>Tech Stack (comma separated)</label>
              <input placeholder="React, Node, Prisma" value={form.stack} onChange={e=>setForm({...form,stack:e.target.value})} onFocus={()=>setFocusedField('stack')} onBlur={()=>setFocusedField(null)} style={inputStyle('stack')} />
            </div>
          </div>

          {/* GitHub */}
          <div style={{ marginBottom:'16px' }}>
            <label style={labelStyle}>
              <Github size={10} style={{ display:'inline', marginRight:'5px', verticalAlign:'middle' }} />
              GitHub Repo
              <span style={{ marginLeft:'8px', padding:'1px 7px', borderRadius:'3px', border:'1px solid rgba(245,158,11,0.2)', background:'rgba(245,158,11,0.05)', fontSize:'11px', color:'#d97706' }}>deep analyse ✦</span>
              {githubConnected && (
                <span style={{ marginLeft:'6px', padding:'1px 7px', borderRadius:'3px', border:'1px solid rgba(52,211,153,0.2)', background:'rgba(52,211,153,0.05)', fontSize:'11px', color:'#34d399' }}>✓ GitHub connected</span>
              )}
            </label>
            <div style={{ display:'flex', gap:'8px' }}>
              <div style={{ flex:1, position:'relative' }}>
                <input placeholder="github.com/user/repo" value={form.githubUrl} onChange={e=>{setForm({...form,githubUrl:e.target.value});if(githubStatus!=='idle')setGithubStatus('idle');}} onFocus={()=>setFocusedField('github')} onBlur={()=>setFocusedField(null)} onKeyDown={e=>e.key==='Enter'&&extractFromGithub()} style={{...inputStyle('github'),paddingLeft:'36px'}} />
                <div style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:githubStatus==='success'?'#34d399':githubStatus==='error'?'#f87171':'#3f3f46', transition:'color 0.2s' }}>
                  {githubStatus==='loading'?<span style={{width:'12px',height:'12px',border:'1.5px solid #52525b',borderTopColor:'#d97706',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}}/>:githubStatus==='success'?<CheckCircle size={13}/>:<Github size={13}/>}
                </div>
              </div>
              <button className={`github-btn ${githubStatus==='success'?'success':githubStatus==='error'?'error-state':''}`} onClick={extractFromGithub} disabled={!form.githubUrl.trim()||githubStatus==='loading'}>
                {githubStatus==='loading'?<>Analysing…</>:githubStatus==='success'?<><CheckCircle size={11}/> Extracted</>:<><Github size={11}/> Deep Analyse</>}
              </button>
            </div>
            {githubStatus==='success'&&<p style={{fontSize:'13px',color:'#34d399',marginTop:'5px',fontFamily:"'DM Mono',monospace"}}>✓ Deep analysis complete</p>}
            {githubStatus==='error'&&<p style={{fontSize:'13px',color:'#f87171',marginTop:'5px',fontFamily:"'DM Mono',monospace"}}>✗ {githubError}</p>}
            {!githubConnected && (
              <p style={{ fontSize:'11px', color:'#52525b', marginTop:'6px', fontFamily:"'DM Mono',monospace" }}>
                Tip: <a href="/dashboard?tab=profile" style={{ color:'#f59e0b', textDecoration:'none' }}>Connect your GitHub account</a> in Profile for private repo access &amp; higher rate limits.
              </p>
            )}
          </div>

          {/* Deployed URL */}
          <div style={{ marginBottom:'16px' }}>
            <label style={labelStyle}><ExternalLink size={10} style={{ display:'inline', marginRight:'5px', verticalAlign:'middle' }} />Deployed / Live URL</label>
            <input placeholder="https://yourproject.com" value={form.deployedUrl} onChange={e=>setForm({...form,deployedUrl:e.target.value})} onFocus={()=>setFocusedField('deployed')} onBlur={()=>setFocusedField(null)} style={inputStyle('deployed')} />
          </div>

          {/* Description + Mic */}
          <div style={{ marginBottom:'22px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
              <label style={{...labelStyle,marginBottom:0}}>Description</label>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'3px', height:'18px' }}>
                  {[0,1,2,3,4,5,6].map(i=><div key={i} className={`wave-bar wave-bar-${i} ${isRecording?'active':'idle'}`} style={{height:'14px'}}/>)}
                </div>
                <button className={`mic-btn ${isRecording?'recording':''}`} onClick={toggleRecording} disabled={voiceLoading}>
                  {voiceLoading?<span style={{width:'11px',height:'11px',border:'1.5px solid #52525b',borderTopColor:'#d97706',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}}/>:isRecording?<MicOff size={11}/>:<Mic size={11}/>}
                  {voiceLoading?'Processing…':isRecording?'Stop':'Speak'}
                </button>
              </div>
            </div>
            <textarea placeholder={isRecording?'Listening…':'What did you build? What problem does it solve?'} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} onFocus={()=>setFocusedField('desc')} onBlur={()=>setFocusedField(null)} rows={4}
              style={{...inputStyle('desc'),resize:'vertical',lineHeight:1.65,minHeight:'96px',border:isRecording?'1px solid rgba(245,158,11,0.5)':focusedField==='desc'?'1px solid rgba(245,158,11,0.35)':'1px solid rgba(255,255,255,0.07)',background:isRecording?'rgba(245,158,11,0.04)':'rgba(255,255,255,0.02)'}} />
          </div>

          <div style={{ display:'flex', gap:'10px', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'20px' }}>
            <button className="add-project-btn" onClick={saveProject} disabled={!form.name.trim()}>{editingId?'Save Changes →':'Save Project →'}</button>
            <button className="cancel-btn" onClick={closePanel}>Cancel</button>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div>
        <div className="section-label">
          <Briefcase size={10} />
          All Projects
          <span style={{ padding:'1px 8px', borderRadius:'4px', border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)', fontSize:'11px', color:'#52525b' }}>{projects.length}</span>
          <div className="section-label-line" />
        </div>
        {loadingProjects && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'14px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background:'#111114', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'4px', padding:'22px' }}>
                <div style={{ display:'flex', gap:'12px', marginBottom:'14px' }}>
                  <div className="skeleton" style={{ width:'32px', height:'32px', borderRadius:'4px', flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div className="skeleton" style={{ height:'16px', width:'60%', marginBottom:'8px' }} />
                    <div className="skeleton" style={{ height:'12px', width:'90%', marginBottom:'4px' }} />
                    <div className="skeleton" style={{ height:'12px', width:'70%' }} />
                  </div>
                </div>
                <div style={{ display:'flex', gap:'6px', marginBottom:'16px' }}>
                  {[40,55,45].map((w,j) => <div key={j} className="skeleton" style={{ height:'22px', width:`${w}px`, borderRadius:'4px' }} />)}
                </div>
                <div className="skeleton" style={{ height:'1px', marginBottom:'12px' }} />
                <div style={{ display:'flex', gap:'8px' }}>
                  <div className="skeleton" style={{ height:'32px', flex:1, borderRadius:'4px' }} />
                  <div className="skeleton" style={{ height:'32px', flex:1, borderRadius:'4px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {projects.length === 0 && !loadingProjects && (
          <div style={{ padding:'48px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
            <Briefcase size={32} style={{ color:'#27272a' }} />
            <p style={{ fontSize:'14px', color:'#52525b', margin:0, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'.06em' }}>No projects yet</p>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'14px' }}>
          {projects.map(p => <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={deleteProject} />)}        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete }: {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="project-card">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', flex:1, minWidth:0 }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'4px', flexShrink:0, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', color:'#52525b' }}>
            <Briefcase size={14} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'3px', flexWrap:'wrap' }}>
              <h4 style={{ fontSize:'17px', fontWeight:800, color:'#f0ece4', letterSpacing:'-0.3px', margin:0, fontFamily:"'Playfair Display',Georgia,serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {project.name}
              </h4>
              {project.githubUrl && (
                <a href={project.githubUrl.startsWith('http') ? project.githubUrl : `https://${project.githubUrl}`} target="_blank" rel="noopener noreferrer" style={{ color:'#3f3f46', display:'flex', flexShrink:0, transition:'color 0.15s' }} onMouseEnter={e=>(e.currentTarget.style.color='#71717a')} onMouseLeave={e=>(e.currentTarget.style.color='#3f3f46')}>
                  <Github size={12} />
                </a>
              )}
              {project.deployedUrl && (
                <a href={project.deployedUrl.startsWith('http') ? project.deployedUrl : `https://${project.deployedUrl}`} target="_blank" rel="noopener noreferrer" style={{ color:'#3f3f46', display:'flex', flexShrink:0, transition:'color 0.15s' }} onMouseEnter={e=>(e.currentTarget.style.color='#34d399')} onMouseLeave={e=>(e.currentTarget.style.color='#3f3f46')}>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            <p style={{ fontSize:'14px', color:'#d4d4d8', margin:0, fontWeight:300, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const, overflow:'hidden' }}>
              {project.description}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'16px' }}>
        {project.stack.slice(0, 3).map(tech => <span key={tech} className="stack-chip">{tech}</span>)}
        {project.stack.length > 3 && (
          <span className="stack-chip" style={{ color: '#71717a', borderColor: 'transparent', background: 'transparent', paddingLeft: 0, paddingRight: 0 }}>
            +{project.stack.length - 3}
          </span>
        )}
      </div>

      <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', marginBottom:'12px' }} />

      <div style={{ display:'flex', gap:'8px' }}>
        <button className="action-btn edit" onClick={() => onEdit(project)}><Edit2 size={11} /> Edit</button>
        <button className="action-btn danger" onClick={() => onDelete(project.id)}><Trash2 size={11} /> Delete</button>
      </div>
    </div>
  );
}
