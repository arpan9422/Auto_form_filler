import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Copy, Check, ShieldCheck, Plus, MessageSquare, Trash2, Clock, Brain } from 'lucide-react';
import { aiChatApi, ChatEpisodeSummary } from '@/lib/services';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  timestamp: string;
}

const SUGGESTIONS = [
  "Write a reply to a LinkedIn recruiter asking about my experience with LLMs and AI Agents.",
  "Craft a confident cover letter paragraph highlighting my top TypeScript and React projects.",
  "Write a succinct 3-bullet elevator pitch summarizing my recent work experience.",
  "Draft an excited email follow-up checking on the status of my engineering application."
];

export function ChatAgent() {
  const [episodes, setEpisodes] = useState<ChatEpisodeSummary[]>([]);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: "Hello! I am your **LangGraph-powered Chat Agent** with **Episodic Memory**.\n\nI retain learnings and preferences across your conversation episodes. Select a previous chat session on the left or start a new conversation to draft tailored LinkedIn messages, cover letters, or job replies!",
      sources: ['LangGraph Engine', 'Pinecone & Chroma RAG', 'Episodic RAG Memory'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch episodes list on mount
  const fetchEpisodes = async () => {
    try {
      const res = await aiChatApi.listEpisodes();
      if (res.data && Array.isArray(res.data.episodes)) {
        setEpisodes(res.data.episodes);
      }
    } catch (err) {
      console.error('Failed to load conversation episodes:', err);
    }
  };

  useEffect(() => {
    fetchEpisodes();
  }, []);

  // Switch to or load an episode
  const handleSelectEpisode = async (episodeId: string) => {
    if (loading || episodeId === currentEpisodeId) return;
    setLoadingEpisodes(true);
    setCurrentEpisodeId(episodeId);

    try {
      const res = await aiChatApi.getEpisode(episodeId);
      if (res.data && res.data.episode) {
        const loadedMessages: Message[] = res.data.episode.messages.map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'ai',
          content: m.content,
          sources: m.sources ? (Array.isArray(m.sources) ? m.sources : []) : undefined,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(loadedMessages.length > 0 ? loadedMessages : [
          {
            id: 'welcome-empty',
            role: 'ai',
            content: "This conversation episode has been opened. Ask me anything to continue!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load episode details:', err);
      setMessages([
        {
          id: 'err-load',
          role: 'ai',
          content: "⚠️ Could not load history for this episode. Starting a clean view.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleNewEpisode = () => {
    if (loading || currentEpisodeId === null) return;
    setCurrentEpisodeId(null);
    setInput('');
    setMessages([
      {
        id: 'welcome-new',
        role: 'ai',
        content: "Started a **New Conversation Episode**! I have semantic access to our past episodes and your real career facts. What would you like to work on today?",
        sources: ['LangGraph Engine', 'Episodic Memory Base'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleDeleteEpisode = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await aiChatApi.deleteEpisode(id);
      setEpisodes(prev => prev.filter(ep => ep.id !== id));
      if (currentEpisodeId === id) {
        handleNewEpisode();
      }
    } catch (err) {
      console.error('Failed to delete episode:', err);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend !== undefined ? textToSend : input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (textToSend === undefined) setInput('');
    setLoading(true);

    const history = messages
      .filter(m => !m.id.startsWith('welcome') && !m.id.startsWith('err'))
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));

    try {
      const response = await aiChatApi.chat({
        message: query,
        history,
        episodeId: currentEpisodeId || undefined,
      });

      const returnedEpisodeId = response.data.episodeId;
      if (!currentEpisodeId && returnedEpisodeId) {
        setCurrentEpisodeId(returnedEpisodeId);
        // Refresh episode sidebar to show the new conversation title
        fetchEpisodes();
      } else {
        // Just update timestamp in list
        setEpisodes(prev => prev.map(ep => 
          ep.id === returnedEpisodeId ? { ...ep, updatedAt: new Date().toISOString() } : ep
        ));
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: response.data.response || "No response generated.",
        sources: response.data.sources || ['Episodic & Semantic RAG'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Failed to get chat response:', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: "⚠️ **Connection issue**: Unable to complete LangGraph execution. Please verify your backend server is active and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 120px)',
      background: '#0b0b0c',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
      color: '#f0ece4',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    }}>
      {/* ── Left Sidebar: Conversation Episodes ──────────────────────────── */}
      <div style={{
        width: '280px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.012)',
        flexShrink: 0
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleNewEpisode}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              background: currentEpisodeId === null ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
              border: currentEpisodeId === null ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: currentEpisodeId === null ? '0 4px 15px rgba(99,102,241,0.25)' : 'none'
            }}
          >
            <Plus size={16} />
            <span>New Conversation</span>
          </button>
        </div>

        <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Brain size={13} color="#a855f7" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'DM Mono', monospace" }}>
            Past Chat Episodes ({episodes.length})
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {episodes.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#52525b', fontSize: '12px' }}>
              No past episodes yet. Start messaging to build episodic memory!
            </div>
          ) : (
            episodes.map((ep) => {
              const active = ep.id === currentEpisodeId;
              return (
                <div
                  key={ep.id}
                  onClick={() => handleSelectEpisode(ep.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s',
                    position: 'relative'
                  }}
                  onMouseOver={e => {
                    if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseOut={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: active ? 600 : 400,
                      color: active ? '#ffffff' : '#d4d4d8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {ep.title || "Conversation"}
                    </span>
                    <button
                      onClick={(evt) => handleDeleteEpisode(evt, ep.id)}
                      title="Delete Episode"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#71717a',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseOut={e => e.currentTarget.style.color = '#71717a'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#52525b', fontFamily: "'DM Mono', monospace" }}>
                    <Clock size={10} />
                    <span>{new Date(ep.updatedAt || ep.createdAt).toLocaleDateString()}</span>
                    {ep.summary && <span style={{ color: '#a855f7' }}>• Synced to Memory</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Area: Chat Workspace ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.05) 0%, transparent 60%)',
        position: 'relative'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.015)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(168,85,247,0.3)'
            }}>
              <Bot size={22} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f0ece4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                LangGraph Career Copilot
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(52,211,153,0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.3)',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.04em'
                }}>
                  ● EPISODIC MEMORY ONLINE
                </span>
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
                Autonomous RAG retrieval across past chat episodes, projects, and user identity
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#a1a1aa', fontFamily: "'DM Mono', monospace", background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <ShieldCheck size={14} color="#6366f1" />
            <span>Humanized & Concise Guardrails</span>
          </div>
        </div>

        {/* Messages Box */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {loadingEpisodes ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#71717a', gap: '8px', fontSize: '13px' }}>
              <Sparkles size={16} color="#818cf8" className="animate-spin" /> Loading episode trajectory...
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  gap: '6px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 4px',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  {msg.role === 'ai' && <Bot size={13} color="#a855f7" />}
                  <span style={{ fontSize: '11px', color: '#71717a', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
                    {msg.role === 'user' ? 'YOU' : 'LANGGRAPH AGENT'} • {msg.timestamp}
                  </span>
                </div>

                <div style={{
                  padding: '16px 20px',
                  borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                    : 'rgba(255,255,255,0.03)',
                  border: msg.role === 'user'
                    ? '1px solid rgba(255,255,255,0.2)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: '#f0ece4',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: msg.role === 'user' ? '0 4px 20px rgba(99,102,241,0.2)' : 'none',
                  position: 'relative'
                }}>
                  {msg.content}

                  {msg.role === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a1a1aa',
                        transition: 'all 0.2s'
                      }}
                      title="Copy response"
                      onMouseOver={e => e.currentTarget.style.color = '#f0ece4'}
                      onMouseOut={e => e.currentTarget.style.color = '#a1a1aa'}
                    >
                      {copiedId === msg.id ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', padding: '0 4px' }}>
                    <span style={{ fontSize: '10px', color: '#52525b', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'DM Mono', monospace" }}>
                      <Sparkles size={11} color="#d97706" /> SOURCES UTILIZED:
                    </span>
                    {msg.sources.map((src, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: src.includes("Episodic") ? 'rgba(168,85,247,0.1)' : 'rgba(245,158,11,0.08)',
                          border: src.includes("Episodic") ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(245,158,11,0.2)',
                          color: src.includes("Episodic") ? '#d8b4fe' : '#fbbf24',
                          fontFamily: "'DM Mono', monospace"
                        }}
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px' }}>
                <Bot size={13} color="#a855f7" />
                <span style={{ fontSize: '11px', color: '#71717a', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
                  LANGGRAPH AGENT • THINKING & RETRIEVING EPISODIC CONTEXT
                </span>
              </div>
              <div style={{
                padding: '16px 24px',
                borderRadius: '14px 14px 14px 2px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span>
                  <span style={{ width: '6px', height: '6px', background: '#a855f7', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></span>
                  <span style={{ width: '6px', height: '6px', background: '#ec4899', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></span>
                </div>
                <span style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: "'DM Mono', monospace" }}>
                  Querying episodic memory vectors & career profile history...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions Pills (shown only on new/empty chats) */}
        {currentEpisodeId === null && messages.length < 3 && (
          <div style={{ padding: '0 24px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug)}
                disabled={loading}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  color: '#d4d4d8',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onMouseOver={e => {
                  if (!loading) {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <Sparkles size={11} color="#818cf8" />
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Input Box */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.01)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to write a LinkedIn response, cover letter, or continue a past discussion..."
            disabled={loading || loadingEpisodes}
            rows={2}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#f0ece4',
              fontSize: '14px',
              fontFamily: "'DM Sans', sans-serif",
              resize: 'none',
              outline: 'none',
              lineHeight: 1.4,
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading || loadingEpisodes}
            style={{
              background: !input.trim() || loading || loadingEpisodes ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: !input.trim() || loading || loadingEpisodes ? '#52525b' : '#ffffff',
              border: 'none',
              borderRadius: '10px',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !input.trim() || loading || loadingEpisodes ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: !input.trim() || loading || loadingEpisodes ? 'none' : '0 4px 15px rgba(99,102,241,0.3)',
              flexShrink: 0
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
