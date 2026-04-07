import { useEffect, useState } from 'react';
import { Brain, Plus, Trash2, Edit2, TrendingUp, X, Check, Clock, Sparkles } from 'lucide-react';
import { memoryApi, type Memory as ApiMemory } from '@/lib/services';
import { SKELETON_CSS, SkeletonBlock, SkeletonCard } from './Skeleton';

interface Memory {
  id: string;
  type: string;
  value: string;
  mentions: number;
}

// ── Inline memory row ──────────────────────────────────────────────────
function MemoryRow({
  memory,
  onEdit,
  onDelete,
}: {
  memory: Memory;
  onEdit: (id: string, data: { type: string; value: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ type: memory.type, value: memory.value });
  const [focused, setFocused] = useState<string | null>(null);

  const inputBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '14px',
    color: '#f0ece4',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300,
    outline: 'none',
    transition: 'border-color .18s, background .18s',
    caretColor: '#f59e0b',
    boxSizing: 'border-box' as const,
  };

  const focusedStyle = (f: string): React.CSSProperties =>
    focused === f
      ? { borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.03)' }
      : {};

  const strengthColor =
    memory.mentions >= 25 ? '#34d399'
    : memory.mentions >= 15 ? '#f59e0b'
    : '#71717a';

  const strengthLabel =
    memory.mentions >= 25 ? 'Strong'
    : memory.mentions >= 15 ? 'Growing'
    : 'New';

  return (
    <div className={`mem-row${isEditing ? ' editing' : ''}`}>
      {!isEditing ? (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f0ece4', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.05em' }}>
                {memory.type}
              </span>
              <span className="mem-badge" style={{ borderColor: `${strengthColor}33`, color: strengthColor, background: `${strengthColor}0d` }}>
                <TrendingUp size={8} />
                {memory.mentions} uses · {strengthLabel}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#71717a', margin: 0, fontWeight: 300, lineHeight: 1.55 }}>
              {memory.value}
            </p>
          </div>

          {/* strength bar */}
          <div style={{ width: '52px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (memory.mentions / 30) * 100)}%`, background: strengthColor, borderRadius: '2px', transition: 'width .4s ease' }} />
            </div>
            <div className="mem-actions">
              <button className="mem-icon-btn edit" onClick={() => setIsEditing(true)} title="Edit">
                <Edit2 size={11} />
              </button>
              <button className="mem-icon-btn delete" onClick={() => onDelete(memory.id)} title="Delete">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={draft.type}
            onChange={e => setDraft(d => ({ ...d, type: e.target.value }))}
            style={{ ...inputBase, width: '130px', flexShrink: 0, cursor: 'pointer', appearance: 'none' as const }}
          >
            {MEMORY_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} style={{ background: '#111114' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            value={draft.value}
            onChange={e => setDraft(d => ({ ...d, value: e.target.value }))}
            onFocus={() => setFocused('val')} onBlur={() => setFocused(null)}
            placeholder="Value"
            style={{ ...inputBase, ...focusedStyle('val'), flex: 1 }}
          />
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button className="mem-icon-btn confirm"
              onClick={() => { onEdit(memory.id, draft); setIsEditing(false); }}
              disabled={!draft.type.trim() || !draft.value.trim()}>
              <Check size={11} />
            </button>
            <button className="mem-icon-btn cancel"
              onClick={() => { setDraft({ type: memory.type, value: memory.value }); setIsEditing(false); }}>
              <X size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Memory Panel ───────────────────────────────────────────────────
const MEMORY_TYPE_OPTIONS: { label: string; value: ApiMemory['type'] }[] = [
  { label: 'Personal',    value: 'PERSONAL'   },
  { label: 'Project',     value: 'PROJECT'    },
  { label: 'Answer',      value: 'ANSWER'     },
  { label: 'Resume',      value: 'RESUME'     },
  { label: 'Preference',  value: 'PREFERENCE' },
  { label: 'Custom',      value: 'CUSTOM'     },
];

function AddMemoryPanel({ onAdd, onClose }: {
  onAdd: (data: { type: string; value: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<{ type: ApiMemory['type']; value: string }>({ type: 'CUSTOM', value: '' });
  const [focused, setFocused] = useState<string | null>(null);

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '4px',
    padding: '9px 12px',
    fontSize: '15px',
    color: '#f0ece4',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300,
    outline: 'none',
    transition: 'border-color .18s, background .18s',
    caretColor: '#f59e0b',
    boxSizing: 'border-box' as const,
  };

  const focusedStyle = (f: string): React.CSSProperties =>
    focused === f
      ? { borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.03)' }
      : {};

  return (
    <div className="add-panel">
      <div className="add-panel-glow" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div className="edit-label">
          <span className="pulse-dot" /> New Memory
        </div>
        <button className="close-x" onClick={onClose}
          onMouseEnter={e => (e.currentTarget.style.color = '#71717a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '16px' }}>
        <div>
          <label className="field-label">Category</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as ApiMemory['type'] }))}
            style={{ ...inputBase, cursor: 'pointer', appearance: 'none' as const }}
          >
            {MEMORY_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} style={{ background: '#111114' }}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Value</label>
          <input value={form.value}
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            onFocus={() => setFocused('val')} onBlur={() => setFocused(null)}
            placeholder="e.g. Prefers concise answers"
            style={{ ...inputBase, ...focusedStyle('val') }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '18px' }}>
        <button className="save-btn"
          disabled={!form.value.trim()}
          onClick={() => { onAdd(form); onClose(); }}>
          Add Memory →
        </button>
        <button className="cancel-edit-btn" onClick={onClose}>
          <X size={10} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export function AIMemory() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    memoryApi.list().then(r => {
      setMemories(r.data.map((m: ApiMemory) => ({ id: m.id, type: m.type, value: m.value, mentions: 1 })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleEdit = async (id: string, data: { type: string; value: string }) => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    await memoryApi.update(id, { type: data.type as ApiMemory['type'], value: data.value }).catch(() => {});
  };

  const handleDelete = async (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    await memoryApi.remove(id).catch(() => {});
  };

  const handleAdd = async (data: { type: string; value: string }) => {
    try {
      const res = await memoryApi.create({ type: data.type as ApiMemory['type'], value: data.value });
      setMemories(prev => [...prev, { id: res.data.id, type: res.data.type, value: res.data.value, mentions: 1 }]);
    } catch {
      setMemories(prev => [...prev, { id: Date.now().toString(), mentions: 1, ...data }]);
    }
  };

  const totalMentions = memories.reduce((s, m) => s + m.mentions, 0);
  const strength = memories.length
    ? Math.min(100, Math.round((totalMentions / (memories.length * 30)) * 100))
    : 0;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.3; transform:scale(1.8); }
        }
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes neuralPulse {
          0%,100% { opacity:.15; transform:scale(1); }
          50%      { opacity:.4; transform:scale(1.06); }
        }

        /* ── Stat card ── */
        .stat-card {
          background: #111114;
          border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; padding: 20px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease both;
        }
        .stat-card::before {
          content:''; position:absolute; top:0; left:0;
          width:3px; height:36px;
          background: rgba(245,158,11,0.35); border-radius:0 0 2px 0;
        }

        /* ── Memory list card ── */
        .mem-card {
          background: #111114;
          border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; padding: 24px;
          box-shadow: 0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .4s ease .1s both;
          position: relative; overflow: hidden;
        }

        /* ── Memory row ── */
        .mem-row {
          display: flex; align-items: center; gap: 16px;
          padding: 14px 16px; border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.01);
          transition: border-color .18s, background .18s;
          animation: fadeSlideIn .3s ease both;
        }
        .mem-row:hover {
          border-color: rgba(245,158,11,0.12);
          background: rgba(245,158,11,0.02);
        }
        .mem-row.editing {
          border-color: rgba(245,158,11,0.3);
          background: rgba(245,158,11,0.03);
        }

        /* ── Badge ── */
        .mem-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:2px 7px; border-radius:3px;
          font-size:9px; font-weight:500; font-family:'DM Mono',monospace;
          letter-spacing:.05em; border:1px solid; white-space:nowrap;
        }

        /* ── Row action buttons (revealed on hover) ── */
        .mem-actions {
          display: flex; gap: 4px;
          opacity: 0; transition: opacity .15s;
        }
        .mem-row:hover .mem-actions { opacity: 1; }

        .mem-icon-btn {
          width:26px; height:26px; border-radius:3px; border:none;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all .15s; background:transparent; color:#3f3f46;
        }
        .mem-icon-btn:disabled { opacity:.3; cursor:not-allowed; }
        .mem-icon-btn.edit:hover { color:#fbbf24; background:rgba(251,191,36,0.08); }
        .mem-icon-btn.delete:hover { color:#f87171; background:rgba(248,113,113,0.08); }
        .mem-icon-btn.confirm { color:#34d399; }
        .mem-icon-btn.confirm:hover { background:rgba(52,211,153,0.08); }
        .mem-icon-btn.cancel:hover { color:#a1a1aa; background:rgba(255,255,255,0.05); }

        /* ── Info card ── */
        .info-card {
          background: #111114;
          border: 1px solid rgba(99,102,241,0.2); border-radius: 4px; padding: 22px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03);
          animation: fadeSlideIn .4s ease .2s both;
          position: relative; overflow: hidden;
        }
        .info-card::after {
          content:'';
          position:absolute; inset:0;
          background: radial-gradient(ellipse at top left, rgba(99,102,241,0.05) 0%, transparent 60%);
          pointer-events:none;
        }

        /* ── Add panel ── */
        .add-panel {
          background:#111114;
          border:1px solid rgba(245,158,11,0.25); border-radius:4px;
          padding:24px; margin-bottom:20px; position:relative; overflow:hidden;
          box-shadow:0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .22s ease;
        }
        .add-panel-glow {
          position:absolute; top:-50px; right:-50px; width:180px; height:180px; border-radius:50%;
          background: radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%);
          filter:blur(30px); pointer-events:none;
        }
        .edit-label {
          font-size:10px; color:#d97706; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.07em;
          display:flex; align-items:center; gap:7px;
        }
        .pulse-dot { width:4px; height:4px; border-radius:50%; background:#f59e0b; display:inline-block; animation:heroPulse 2.5s infinite; }
        .close-x { background:none; border:none; cursor:pointer; color:#3f3f46; padding:2px; display:flex; transition:color .15s; }
        .field-label { display:block; font-size:10px; color:#3f3f46; margin-bottom:6px; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.07em; }
        .save-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 18px; border-radius:4px;
          font-size:10px; font-weight:700; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.06em; cursor:pointer;
          background:#f59e0b; color:#0b0b0c; border:2px solid #f59e0b; transition:all .18s;
        }
        .save-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:2px 2px 0 rgba(245,158,11,0.35); }
        .save-btn:disabled { opacity:.4; cursor:not-allowed; }
        .cancel-edit-btn {
          display:inline-flex; align-items:center; gap:5px;
          padding:8px 14px; border-radius:4px;
          font-size:10px; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.06em; cursor:pointer;
          background:transparent; color:#52525b;
          border:1px solid rgba(255,255,255,0.08); transition:all .15s;
        }
        .cancel-edit-btn:hover { color:#a1a1aa; border-color:rgba(255,255,255,0.15); }

        /* ── Top button ── */
        .add-project-btn {
          display:inline-flex; align-items:center; gap:7px; padding:8px 18px; border-radius:4px;
          font-size:11px; font-weight:700; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.06em; cursor:pointer;
          background:#f59e0b; color:#0b0b0c; border:2px solid #f59e0b; transition:all .18s;
        }
        .add-project-btn:hover { transform:translateY(-1px) rotate(-0.4deg); box-shadow:3px 3px 0 rgba(245,158,11,0.35); }

        /* ── Section label ── */
        .section-label {
          display:flex; align-items:center; gap:8px;
          font-size:10px; color:#3f3f46;
          font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.08em; margin-bottom:12px;
        }
        .section-label-line { flex:1; height:1px; background:rgba(255,255,255,0.05); }

        /* ── Neural bg blob ── */
        .neural-blob {
          position:absolute; border-radius:50%; pointer-events:none;
          animation: neuralPulse 4s ease-in-out infinite;
        }
      `}} />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '6px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Dashboard · Memory
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-1px', color: '#f0ece4', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
            AI{' '}
            <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Memory
            </em>
          </h2>
          <p style={{ fontSize: '15px', color: '#52525b', marginTop: '6px', fontWeight: 300 }}>
            How AI remembers and adapts to you over time.
          </p>
        </div>
        <button className="add-project-btn" onClick={() => setShowAdd(v => !v)}>
          <Plus size={12} /> Add Memory
        </button>
      </div>

      {/* ── Add Panel ── */}
      {showAdd && <AddMemoryPanel onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      {loading ? (
        <div>
          <style dangerouslySetInnerHTML={{ __html: SKELETON_CSS }} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'16px' }}>
            {[1,2,3].map(i => <SkeletonCard key={i}><SkeletonBlock w="100px" h="10px" mb="8px" /><SkeletonBlock w="60px" h="32px" /></SkeletonCard>)}
          </div>
          <SkeletonCard>
            {[1,2,3,4].map(i => <SkeletonBlock key={i} w="100%" h="52px" mb="8px" />)}
          </SkeletonCard>
        </div>
      ) : (
      <>
      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>

        {/* Total */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#3f3f46', margin: 0, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.07em' }}>Total Memories</p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: '#f0ece4', margin: '6px 0 0', fontFamily: "'Playfair Display', serif", letterSpacing: '-1px', lineHeight: 1 }}>
                {memories.length}
              </p>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={16} style={{ color: '#8b5cf6' }} />
            </div>
          </div>
        </div>

        {/* Strength */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#3f3f46', margin: 0, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.07em' }}>Memory Strength</p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: '#f0ece4', margin: '6px 0 0', fontFamily: "'Playfair Display', serif", letterSpacing: '-1px', lineHeight: 1 }}>
                {strength}<span style={{ fontSize: '16px', color: '#52525b' }}>%</span>
              </p>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} style={{ color: '#34d399' }} />
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${strength}%`, background: strength >= 70 ? '#34d399' : strength >= 40 ? '#f59e0b' : '#71717a', borderRadius: '2px', transition: 'width .6s ease' }} />
          </div>
        </div>

        {/* Last updated */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#3f3f46', margin: 0, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.07em' }}>Last Updated</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#f0ece4', margin: '6px 0 0', fontFamily: "'Playfair Display', serif", letterSpacing: '-0.5px', lineHeight: 1 }}>
                Today
              </p>
              <p style={{ fontSize: '15px', color: '#52525b', margin: '4px 0 0', fontFamily: "'DM Mono', monospace" }}>
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} style={{ color: '#f59e0b' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Memory list ── */}
      <div className="mem-card" style={{ marginBottom: '16px' }}>
        {/* bg blobs */}
        <div className="neural-blob" style={{ width: '200px', height: '200px', top: '-80px', right: '-80px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', animationDelay: '0s' }} />
        <div className="neural-blob" style={{ width: '150px', height: '150px', bottom: '-60px', left: '-40px', background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)', animationDelay: '2s' }} />

        <div className="section-label">
          <Brain size={10} />
          Stored Preferences
          <span style={{ padding: '1px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', fontSize: '11px', color: '#52525b' }}>
            {memories.length}
          </span>
          <div className="section-label-line" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {memories.map((m, i) => (
            <div key={m.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <MemoryRow memory={m} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          ))}
          {memories.length === 0 && (
            <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Brain size={32} style={{ color: '#27272a' }} />
              <p style={{ fontSize: '14px', color: '#52525b', margin: 0, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em' }}>
                No memories yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Info card ── */}
      <div className="info-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={13} style={{ color: '#818cf8' }} />
          </div>
          <span style={{ fontSize: '14px', color: '#818cf8', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.07em' }}>
            How AI Memory Works
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 8px', fontWeight: 300, lineHeight: 1.65 }}>
          Your AI assistant learns from your interactions and stores patterns about your preferences, writing style, and common themes. These memories improve accuracy and personalization over time.
        </p>
        <p style={{ fontSize: '14px', color: '#52525b', margin: 0, fontWeight: 300, lineHeight: 1.65 }}>
          You can manually add, edit, or remove memories at any time to refine how the AI adapts to you.
        </p>
      </div>
      </>
      )}
    </div>
  );
}
