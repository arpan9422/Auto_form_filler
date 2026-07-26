import { useEffect, useState } from 'react';
import {
  MessageSquare, Plus, Edit2, Trash2, Copy, Search, Check, X, Tag, BookOpen,
} from 'lucide-react';
import { answersApi, type Answer as ApiAnswer } from '@/lib/services';
import { SKELETON_CSS, SkeletonBlock, SkeletonCard } from './Skeleton';

interface Answer {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// ─────────────────────────────────────────────
// AnswerCard (inline, same file for portability)
// ─────────────────────────────────────────────
function AnswerCard({
  id,
  question,
  answer,
  category,
  onEdit,
  onDelete,
}: {
  id: string;
  question: string;
  answer: string;
  category: string;
  onEdit: (id: string, data: { question: string; answer: string; category: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [draft, setDraft] = useState({ question, answer, category });

  const isLong = answer.length > 150;

  const handleCopy = () => {
    navigator.clipboard.writeText(answer).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!draft.question.trim() || !draft.answer.trim()) return;
    onEdit(id, draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft({ question, answer, category });
    setIsEditing(false);
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    color: '#f0ece4',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300,
    outline: 'none',
    transition: 'border-color 0.18s, background 0.18s',
    boxSizing: 'border-box' as const,
    caretColor: '#f59e0b',
  };

  const focusedStyle = (f: string): React.CSSProperties =>
    focused === f
      ? { borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.03)' }
      : {};

  return (
    <div className={`answer-card${isEditing ? ' editing' : ''}`}>
      {isEditing && (
        <div className="card-glow" />
      )}

      {!isEditing ? (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <div className="ans-icon-wrap">
              <MessageSquare size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <h4 className="ans-question">{question}</h4>
                <span className="cat-badge">
                  <Tag size={8} />
                  {category}
                </span>
              </div>
            </div>
          </div>

          <div className="ans-divider" />

          {/* Answer */}
          <p className={`ans-body${isLong && !expanded ? ' collapsed' : ''}`}>{answer}</p>
          {isLong && (
            <button className="expand-btn" onClick={() => setExpanded(v => !v)}>
              {expanded ? '↑ collapse' : '↓ read more'}
            </button>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button className={`ans-btn copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="ans-btn edit-btn" onClick={() => setIsEditing(true)}>
              <Edit2 size={10} /> Edit
            </button>
            <button className="ans-btn delete-btn" onClick={() => onDelete(id)}
              style={{ flex: 0, padding: '7px 14px' }}>
              <Trash2 size={10} />
            </button>
          </div>
        </>
      ) : (
        <div style={{ animation: 'fadeSlideIn 0.2s ease' }}>
          {/* Edit header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div className="edit-label">
              <span className="pulse-dot" />
              Editing
            </div>
            <button className="close-x" onClick={handleCancel}
              onMouseEnter={e => (e.currentTarget.style.color = '#71717a')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}>
              <X size={14} />
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">Question</label>
            <input value={draft.question}
              onChange={e => setDraft(d => ({ ...d, question: e.target.value }))}
              onFocus={() => setFocused('q')} onBlur={() => setFocused(null)}
              style={{ ...inputBase, ...focusedStyle('q') }} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">Category</label>
            <input value={draft.category}
              onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
              onFocus={() => setFocused('cat')} onBlur={() => setFocused(null)}
              placeholder="e.g. Interview, Application"
              style={{ ...inputBase, ...focusedStyle('cat') }} />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label className="field-label">Answer</label>
            <textarea value={draft.answer}
              onChange={e => setDraft(d => ({ ...d, answer: e.target.value }))}
              onFocus={() => setFocused('a')} onBlur={() => setFocused(null)}
              rows={5}
              style={{ ...inputBase, ...focusedStyle('a'), resize: 'vertical', lineHeight: 1.65, minHeight: '110px' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <button className="save-btn" onClick={handleSave}
              disabled={!draft.question.trim() || !draft.answer.trim()}>
              Save →
            </button>
            <button className="cancel-edit-btn" onClick={handleCancel}>
              <X size={10} /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Add Answer Panel
// ─────────────────────────────────────────────
function AddAnswerPanel({ onAdd, onClose }: {
  onAdd: (data: { question: string; answer: string; category: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ question: '', answer: '', category: '' });
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
    transition: 'border-color 0.18s, background 0.18s',
    boxSizing: 'border-box' as const,
    caretColor: '#f59e0b',
  };

  const focusedStyle = (f: string): React.CSSProperties =>
    focused === f
      ? { borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.03)' }
      : {};

  return (
    <div className="add-panel">
      <div className="add-panel-glow" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div className="edit-label">
          <span className="pulse-dot" />
          New Answer
        </div>
        <button className="close-x" onClick={onClose}
          onMouseEnter={e => (e.currentTarget.style.color = '#71717a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
        <div>
          <label className="field-label">Question</label>
          <input value={form.question}
            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            onFocus={() => setFocused('q')} onBlur={() => setFocused(null)}
            placeholder="e.g. Tell me about yourself"
            style={{ ...inputBase, ...focusedStyle('q') }} />
        </div>
        <div>
          <label className="field-label">Category</label>
          <input value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            onFocus={() => setFocused('cat')} onBlur={() => setFocused(null)}
            placeholder="e.g. Interview"
            style={{ ...inputBase, ...focusedStyle('cat') }} />
        </div>
      </div>

      <div style={{ marginBottom: '22px' }}>
        <label className="field-label">Answer</label>
        <textarea value={form.answer}
          onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
          onFocus={() => setFocused('a')} onBlur={() => setFocused(null)}
          rows={4} placeholder="Write your pre-crafted answer…"
          style={{ ...inputBase, ...focusedStyle('a'), resize: 'vertical', lineHeight: 1.65, minHeight: '96px' }} />
      </div>

      <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
        <button className="save-btn"
          disabled={!form.question.trim() || !form.answer.trim()}
          onClick={() => { onAdd(form); onClose(); }}>
          Add Answer →
        </button>
        <button className="cancel-edit-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AnswersLibrary — main export
// ─────────────────────────────────────────────
export function AnswersLibrary() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);

  useEffect(() => {
    answersApi.list().then(r => {
      setAnswers(r.data.map((a: ApiAnswer) => ({ id: a.id, question: a.title, answer: a.answer, category: a.category })));
      setLoadingAnswers(false);
    }).catch(() => setLoadingAnswers(false));
  }, []);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const categories = Array.from(new Set(answers.map(a => a.category)));

  const filtered = answers.filter(a => {
    const s = search.toLowerCase();
    const matchSearch = a.question.toLowerCase().includes(s) || a.answer.toLowerCase().includes(s);
    const matchCat = !selectedCategory || a.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleEdit = async (id: string, data: { question: string; answer: string; category: string }) => {
    const finalCategory = data.category.trim() || 'General';
    setAnswers(prev => prev.map(a => a.id === id ? { ...a, ...data, category: finalCategory } : a));
    await answersApi.update(id, { title: data.question, answer: data.answer, category: finalCategory }).catch(() => {});
  };

  const handleDelete = async (id: string) => {
    setAnswers(prev => prev.filter(a => a.id !== id));
    await answersApi.remove(id).catch(() => {});
  };

  const handleAdd = async (data: { question: string; answer: string; category: string }) => {
    const finalCategory = data.category.trim() || 'General';
    try {
      const res = await answersApi.create({ title: data.question, answer: data.answer, category: finalCategory });
      setAnswers(prev => [...prev, { id: res.data.id, question: res.data.title, answer: res.data.answer, category: res.data.category }]);
    } catch {
      setAnswers(prev => [...prev, { id: Date.now().toString(), ...data, category: finalCategory }]);
    }
  };

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
        @keyframes checkPop {
          0%  { transform:scale(0.5); opacity:0; }
          60% { transform:scale(1.2); }
          100%{ transform:scale(1);   opacity:1; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ── Card ── */
        .answer-card {
          background: #111114;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px; padding: 20px;
          position: relative; overflow: hidden;
          transition: border-color .22s, box-shadow .22s, transform .22s;
          box-shadow: 0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .35s ease both;
        }
        .answer-card:hover {
          border-color: rgba(245,158,11,0.15);
          box-shadow: 0 14px 40px rgba(0,0,0,0.45), 3px 3px 0 rgba(245,158,11,0.06);
          transform: translateY(-2px) rotate(-0.15deg);
        }
        .answer-card.editing {
          border-color: rgba(245,158,11,0.3);
          transform: none;
        }
        .answer-card::before {
          content:'';
          position:absolute; top:0; left:0;
          width:3px; height:40px;
          background: rgba(139,92,246,0.4);
          border-radius:0 0 2px 0;
          transition: height .22s, background .22s;
        }
        .answer-card:hover::before,
        .answer-card.editing::before {
          height:64px;
          background: rgba(245,158,11,0.55);
        }
        .card-glow {
          position:absolute; top:-60px; right:-60px;
          width:200px; height:200px; border-radius:50%;
          background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%);
          filter:blur(30px); pointer-events:none;
        }

        /* ── Icon ── */
        .ans-icon-wrap {
          width:32px; height:32px; flex-shrink:0; border-radius:4px;
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.15);
          display:flex; align-items:center; justify-content:center; color:#8b5cf6;
          transition: background .15s, border-color .15s;
        }
        .answer-card:hover .ans-icon-wrap {
          background: rgba(139,92,246,0.14);
          border-color: rgba(139,92,246,0.28);
        }

        /* ── Category badge ── */
        .cat-badge {
          display:inline-flex; align-items:center; gap:4px;
          padding:2px 8px; border-radius:3px;
          background: rgba(139,92,246,0.08);
          border: 1px solid rgba(139,92,246,0.18);
          font-size:9px; font-weight:500; font-family:'DM Mono',monospace;
          color:#a78bfa; text-transform:uppercase; letter-spacing:.06em;
          white-space:nowrap; flex-shrink:0;
        }

        /* ── Typography ── */
        .ans-question {
          font-size:14px; font-weight:700; color:#f0ece4; margin:0;
          font-family:'Playfair Display',Georgia,serif; letter-spacing:-0.2px; line-height:1.3;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
        }
        .ans-body {
          font-size:12px; color:#71717a; line-height:1.65; font-weight:300;
          font-family:'DM Sans',sans-serif; margin:0;
        }
        .ans-body.collapsed {
          display:-webkit-box; -webkit-line-clamp:2;
          -webkit-box-orient:vertical; overflow:hidden;
        }
        .ans-divider { height:1px; background:rgba(255,255,255,0.05); margin-bottom:12px; }

        /* ── Expand ── */
        .expand-btn {
          background:none; border:none; cursor:pointer; padding:0;
          font-size:10px; color:#f59e0b;
          font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.05em;
          margin-top:4px; transition:opacity .15s;
        }
        .expand-btn:hover { opacity:.7; }

        /* ── Action buttons ── */
        .ans-btn {
          display:inline-flex; align-items:center; justify-content:center;
          gap:5px; flex:1; padding:7px 0; border-radius:4px;
          font-size:10px; font-weight:600; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.05em; cursor:pointer;
          border:1px solid rgba(255,255,255,0.07);
          background:transparent; color:#52525b;
          transition:color .15s, border-color .15s, background .15s;
        }
        .ans-btn:hover { color:#a1a1aa; border-color:rgba(255,255,255,0.14); background:rgba(255,255,255,0.03); }
        .copy-btn.copied { color:#34d399; border-color:rgba(52,211,153,0.3); background:rgba(52,211,153,0.05); }
        .copy-btn.copied svg { animation: checkPop 0.3s ease; }
        .edit-btn:hover { color:#fbbf24; border-color:rgba(251,191,36,0.25); background:rgba(251,191,36,0.04); }
        .delete-btn:hover { color:#f87171; border-color:rgba(248,113,113,0.25); background:rgba(248,113,113,0.04); }

        /* ── Edit mode ── */
        .edit-label {
          font-size:10px; color:#d97706; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.07em;
          display:flex; align-items:center; gap:7px;
        }
        .pulse-dot {
          width:4px; height:4px; border-radius:50%;
          background:#f59e0b; display:inline-block;
          animation: heroPulse 2.5s infinite;
        }
        .close-x {
          background:none; border:none; cursor:pointer; color:#3f3f46;
          padding:2px; display:flex; transition:color .15s;
        }
        .field-label {
          display:block; font-size:10px; color:#3f3f46; margin-bottom:6px;
          font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.07em;
        }
        .save-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 18px; border-radius:4px;
          font-size:10px; font-weight:700; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.06em; cursor:pointer;
          background:#f59e0b; color:#0b0b0c; border:2px solid #f59e0b;
          transition:all .18s ease;
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

        /* ── Add panel ── */
        .add-panel {
          background:#111114;
          border:1px solid rgba(245,158,11,0.25); border-radius:4px;
          padding:28px; margin-bottom:24px; position:relative; overflow:hidden;
          box-shadow:0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: fadeSlideIn .25s ease;
        }
        .add-panel-glow {
          position:absolute; top:-50px; right:-50px;
          width:180px; height:180px; border-radius:50%;
          background: radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%);
          filter:blur(30px); pointer-events:none;
        }

        /* ── Header ── */
        .add-project-btn {
          display:inline-flex; align-items:center; gap:7px; padding:8px 18px; border-radius:4px;
          font-size:11px; font-weight:700; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.06em; cursor:pointer;
          background:#f59e0b; color:#0b0b0c; border:2px solid #f59e0b; transition:all .18s ease;
        }
        .add-project-btn:hover { transform:translateY(-1px) rotate(-0.4deg); box-shadow:3px 3px 0 rgba(245,158,11,0.35); }

        /* ── Search ── */
        .search-wrap { position:relative; flex:1; }
        .search-wrap svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#3f3f46; pointer-events:none; }
        .search-input {
          width:100%; background:rgba(255,255,255,0.02);
          border:1px solid rgba(255,255,255,0.07); border-radius:4px;
          padding:9px 12px 9px 36px; font-size:13px; color:#f0ece4;
          font-family:'DM Sans',sans-serif; font-weight:300; outline:none;
          transition:border-color .18s, background .18s;
          box-sizing:border-box; caret-color:#f59e0b;
        }
        .search-input:focus { border-color:rgba(245,158,11,0.35); background:rgba(245,158,11,0.03); }
        .search-input::placeholder { color:#3f3f46; }

        /* ── Category filter pills ── */
        .cat-pill {
          display:inline-flex; align-items:center; padding:5px 14px; border-radius:4px;
          font-size:10px; font-weight:600; font-family:'DM Mono',monospace;
          text-transform:uppercase; letter-spacing:.06em; cursor:pointer;
          border:1px solid rgba(255,255,255,0.08); background:transparent; color:#52525b;
          transition:all .15s ease;
        }
        .cat-pill:hover { color:#a1a1aa; border-color:rgba(255,255,255,0.15); background:rgba(255,255,255,0.03); }
        .cat-pill.active { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.3); color:#f59e0b; }

        /* ── Section label ── */
        .section-label {
          display:flex; align-items:center; gap:8px; font-size:10px; color:#3f3f46;
          font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.08em; margin-bottom:14px;
        }
        .section-label-line { flex:1; height:1px; background:rgba(255,255,255,0.05); }

        /* ── Empty state ── */
        .empty-state {
          background:#111114; border:1px solid rgba(255,255,255,0.05);
          border-radius:4px; padding:64px 32px;
          display:flex; flex-direction:column; align-items:center; gap:12px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }
      `}} />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '6px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Dashboard · Library
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.0, letterSpacing: '-1px', color: '#f0ece4', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
            Answers{' '}
            <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)', backgroundSize: '200% 200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Library
            </em>
          </h2>
          <p style={{ fontSize: '15px', color: '#52525b', marginTop: '6px', fontWeight: 300 }}>
            Pre-written answers for common application questions.
          </p>
        </div>
        <button className="add-project-btn" onClick={() => setShowAdd(v => !v)}>
          <Plus size={12} /> New Answer
        </button>
      </div>

      {/* ── Add Panel ── */}
      {showAdd && <AddAnswerPanel onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      {/* ── Search + Filter ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-wrap">
            <Search size={14} />
            <input
              className="search-input"
              placeholder="Search questions or answers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={`cat-pill${selectedCategory === null ? ' active' : ''}`}
            onClick={() => setSelectedCategory(null)}>
            All
            <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', fontSize: '11px', color: '#52525b' }}>
              {answers.length}
            </span>
          </button>
          {categories.map(cat => (
            <button key={cat}
              className={`cat-pill${selectedCategory === cat ? ' active' : ''}`}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}>
              {cat}
              <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', fontSize: '11px', color: '#52525b' }}>
                {answers.filter(a => a.category === cat).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Section label ── */}
      <div className="section-label">
        <BookOpen size={10} />
        {filtered.length} {filtered.length === 1 ? 'answer' : 'answers'}
        {selectedCategory && <> · {selectedCategory}</>}
        <div className="section-label-line" />
      </div>

      {/* ── Grid ── */}
      {loadingAnswers ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'14px' }}>
          {[1,2,3,4].map(i => (
            <SkeletonCard key={i}>
              <div style={{ display:'flex', gap:'12px', marginBottom:'12px' }}>
                <SkeletonBlock w="32px" h="32px" radius="4px" />
                <div style={{ flex:1 }}><SkeletonBlock w="70%" h="14px" mb="6px" /><SkeletonBlock w="50px" h="18px" /></div>
              </div>
              <SkeletonBlock w="100%" h="1px" mb="12px" />
              <SkeletonBlock w="100%" h="12px" mb="6px" />
              <SkeletonBlock w="80%" h="12px" mb="16px" />
              <div style={{ display:'flex', gap:'8px' }}>
                <SkeletonBlock w="70px" h="30px" radius="4px" />
                <SkeletonBlock w="55px" h="30px" radius="4px" />
                <SkeletonBlock w="36px" h="30px" radius="4px" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {filtered.map((a, i) => (
            <div key={a.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <AnswerCard {...a} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <MessageSquare size={36} style={{ color: '#27272a' }} />
          <p style={{ fontSize: '15px', color: '#52525b', margin: 0, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            No answers found
          </p>
          {search && (
            <button className="expand-btn" onClick={() => setSearch('')}>
              ✕ clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Inject skeleton CSS once
if (typeof document !== 'undefined' && !document.getElementById('sk-css')) {
  const s = document.createElement('style'); s.id = 'sk-css'; s.textContent = SKELETON_CSS; document.head.appendChild(s);
}
