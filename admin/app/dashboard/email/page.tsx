"use client";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Search, X, Check } from "lucide-react";

const bg = "#0f1117";
const bgCard = "#161b27";
const bgHover = "#1e2535";
const border = "#2a3347";
const text = "#e2e8f0";
const muted = "#64748b";
const amber = "#f59e0b";
const green = "#22c55e";
const red = "#ef4444";

type TargetType = "single" | "multiple" | "all";
type UserResult = { id: string; firstName: string; lastName: string; email: string };

// ── User search + select component ────────────────────────────────────
function UserPicker({
  label,
  multi,
  selected,
  onSelect,
  onRemove,
}: {
  label: string;
  multi: boolean;
  selected: UserResult[];
  onSelect: (u: UserResult) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch<UserResult[]>(`/admin/users/search?q=${encodeURIComponent(q)}`);
        setResults(data);
        setOpen(true);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 300);
  };

  const pick = (u: UserResult) => {
    onSelect(u);
    if (!multi) { setQuery(""); setResults([]); setOpen(false); }
    else setQuery("");
  };

  const isSelected = (id: string) => selected.some(s => s.id === id);

  return (
    <div ref={wrapRef} style={{ marginBottom: "16px" }}>
      <label style={{ fontSize: "12px", fontWeight: 500, color: muted, display: "block", marginBottom: "6px" }}>{label}</label>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
          {selected.map(u => (
            <div key={u.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", fontSize: "12px", color: amber }}>
              <span>{u.firstName} {u.lastName}</span>
              <span style={{ fontSize: "10px", color: "rgba(245,158,11,0.6)" }}>({u.email})</span>
              <button onClick={() => onRemove(u.id)} style={{ background: "none", border: "none", cursor: "pointer", color: amber, display: "flex", padding: 0, marginLeft: "2px" }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: muted, pointerEvents: "none" }} />
        <input
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search by name or email…"
          style={{ display: "block", width: "100%", height: "38px", padding: "0 12px 0 32px", borderRadius: "6px", border: `1px solid ${border}`, background: bg, color: text, fontSize: "13px", outline: "none" }}
        />
        {loading && (
          <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: amber, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        )}

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: bgCard, border: `1px solid ${border}`, borderRadius: "6px", zIndex: 50, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            {results.map(u => (
              <div key={u.id}
                onClick={() => pick(u)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", cursor: "pointer", background: isSelected(u.id) ? "rgba(245,158,11,0.08)" : "transparent", transition: "background .1s" }}
                onMouseEnter={e => { if (!isSelected(u.id)) (e.currentTarget as HTMLDivElement).style.background = bgHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected(u.id) ? "rgba(245,158,11,0.08)" : "transparent"; }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: text }}>{u.firstName} {u.lastName}</div>
                  <div style={{ fontSize: "11px", color: muted, marginTop: "1px" }}>{u.email}</div>
                </div>
                {isSelected(u.id) && <Check size={14} style={{ color: amber, flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
export default function EmailPage() {
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [singleUser, setSingleUser] = useState<UserResult[]>([]);
  const [multiUsers, setMultiUsers] = useState<UserResult[]>([]);
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ queued: number; message: string } | null>(null);
  const [error, setError] = useState("");

  const buildTarget = () => {
    if (targetType === "single") return { type: "single" as const, userId: singleUser[0]?.id };
    if (targetType === "multiple") return { type: "multiple" as const, userIds: multiUsers.map(u => u.id) };
    return { type: "all" as const };
  };

  const send = async () => {
    setError(""); setResult(null);
    if (!subject.trim() || !htmlContent.trim()) { setError("Subject and HTML content are required."); return; }
    if (targetType === "single" && singleUser.length === 0) { setError("Select a user."); return; }
    if (targetType === "multiple" && multiUsers.length === 0) { setError("Select at least one user."); return; }

    setSending(true);
    try {
      const res = await apiFetch<{ queued: number; message: string }>("/admin/email/broadcast", {
        method: "POST",
        body: JSON.stringify({ target: buildTarget(), subject, htmlContent, textContent }),
      });
      setResult(res);
    } catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px", borderRadius: "6px", border: "none", cursor: "pointer",
    fontSize: "13px", fontWeight: 500,
    background: active ? amber : bgHover,
    color: active ? "#0f1117" : muted,
    transition: "all .15s",
  });

  const inputStyle: React.CSSProperties = {
    display: "block", width: "100%", padding: "10px 12px",
    borderRadius: "6px", border: `1px solid ${border}`,
    background: bg, color: text, fontSize: "13px", outline: "none", marginTop: "6px",
  };

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: text, marginBottom: "24px" }}>Email Broadcast</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Compose */}
        <Card>
          <CardHeader><CardTitle>Compose</CardTitle></CardHeader>
          <CardContent>
            {/* Target type */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: muted, display: "block", marginBottom: "8px" }}>Send To</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["single", "multiple", "all"] as TargetType[]).map(t => (
                  <button key={t} style={tabStyle(targetType === t)} onClick={() => setTargetType(t)}>
                    {t === "single" ? "One User" : t === "multiple" ? "Multiple" : "All Users"}
                  </button>
                ))}
              </div>
            </div>

            {targetType === "single" && (
              <UserPicker label="Select User" multi={false}
                selected={singleUser}
                onSelect={u => setSingleUser([u])}
                onRemove={() => setSingleUser([])} />
            )}

            {targetType === "multiple" && (
              <UserPicker label="Select Users" multi={true}
                selected={multiUsers}
                onSelect={u => { if (!multiUsers.find(x => x.id === u.id)) setMultiUsers(prev => [...prev, u]); }}
                onRemove={id => setMultiUsers(prev => prev.filter(u => u.id !== id))} />
            )}

            {targetType === "all" && (
              <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "6px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p style={{ fontSize: "12px", color: amber, margin: 0 }}>⚠️ Sends to ALL registered users. Emails are dispatched asynchronously in the background.</p>
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: muted }}>Subject</label>
              <input style={inputStyle} placeholder="e.g. New feature announcement" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: muted }}>HTML Content</label>
              <textarea style={{ ...inputStyle, minHeight: "160px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
                placeholder="<p>Hello,</p><p>...</p>" value={htmlContent} onChange={e => setHtmlContent(e.target.value)} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: muted }}>Plain Text (optional)</label>
              <textarea style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
                placeholder="Plain text fallback…" value={textContent} onChange={e => setTextContent(e.target.value)} />
            </div>

            {error && <p style={{ fontSize: "12px", color: red, marginBottom: "12px" }}>{error}</p>}

            {result && (
              <div style={{ padding: "12px", borderRadius: "6px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", color: green, margin: 0, fontWeight: 500 }}>✓ {result.message}</p>
                <p style={{ fontSize: "12px", color: muted, margin: "4px 0 0" }}>{result.queued} recipient(s) queued</p>
              </div>
            )}

            <button onClick={send} disabled={sending}
              style={{ display: "block", width: "100%", height: "40px", borderRadius: "6px", border: "none", background: sending ? muted : amber, color: "#0f1117", fontSize: "14px", fontWeight: 700, cursor: sending ? "not-allowed" : "pointer" }}>
              {sending ? "Queuing…" : "Send Email →"}
            </button>
          </CardContent>
        </Card>

        {/* Preview + tips */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent>
              {htmlContent ? (
                <div style={{ border: `1px solid ${border}`, borderRadius: "6px", padding: "16px", background: "#fff", minHeight: "200px", maxHeight: "400px", overflowY: "auto" }}>
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
              ) : (
                <div style={{ padding: "40px 0", textAlign: "center", color: muted, fontSize: "13px" }}>HTML preview will appear here</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle style={{ fontSize: "13px" }}>How it works</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  ["One User", "Search by name or email, select one recipient."],
                  ["Multiple", "Search and add multiple recipients one by one."],
                  ["All Users", "Fetches all users in batches of 500. Sent 5 at a time. API returns immediately — emails go out in the background."],
                ].map(([title, desc]) => (
                  <div key={title} style={{ padding: "10px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.02)", border: `1px solid ${border}` }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: text, marginBottom: "3px" }}>{title}</div>
                    <div style={{ fontSize: "12px", color: muted }}>{desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
