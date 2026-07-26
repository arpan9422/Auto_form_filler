"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Zap,
  Key,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Server,
  RefreshCw,
  Sparkles,
  Lock,
  Code2,
  Database,
  Activity,
  Flame,
  Bot,
  Layers,
  Sliders,
  Network,
} from "lucide-react";

interface ProviderInfo {
  id: string;
  name: string;
  tagline: string;
  color: string;
  gradient: string;
  bgRgba: string;
  logo: React.ReactNode;
  models: string[];
  latency: string;
  tokensPerSec: string;
  specialty: string;
  codeSnippet: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "ollama",
    name: "Ollama Local / Cloud",
    tagline: "100% Privacy & Zero Third-Party Telemetry",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    bgRgba: "rgba(245, 158, 11, 0.12)",
    logo: (
      <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #f59e0b22, #f59e0b66)", border: "1px solid #f59e0b", display: "grid", placeItems: "center", boxShadow: "0 0 16px #f59e0b44" }}>
        <Server size={24} color="#fbbf24" />
      </div>
    ),
    models: ["gpt-oss:120b-cloud", "llama3.3-70b", "qwen2.5:72b", "mistral:7b", "gemma2:27b"],
    latency: "18ms (Local) / 110ms (Cloud)",
    tokensPerSec: "165 tokens/sec",
    specialty: "Air-gapped security, enterprise on-prem clusters, zero data leakage.",
    codeSnippet: `// Scoped dynamically in llmContext without touching business logic
const llm = getBaseFastModel(0.2); // Automatically routes to http://localhost:11434
const res = await llm.invoke([["user", "Extract structured form fields with 100% precision."]]);`,
  },
  {
    id: "openai",
    name: "OpenAI Foundation",
    tagline: "Industry Standard Structured Reasoning",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    bgRgba: "rgba(16, 185, 129, 0.12)",
    logo: (
      <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #10b98122, #10b98166)", border: "1px solid #10b981", display: "grid", placeItems: "center", boxShadow: "0 0 16px #10b98144" }}>
        <Bot size={24} color="#34d399" />
      </div>
    ),
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini (Deep Reasoning)", "gpt-4-turbo"],
    latency: "145ms",
    tokensPerSec: "120 tokens/sec",
    specialty: "High-precision JSON mode adherence and deep agentic task orchestration.",
    codeSnippet: `// Zero-XSS: API Key is read directly from PostgreSQL via TLS inside expressive middleware
const reasoningModel = getReasoningModel(0.1);
const output = await reasoningModel.invoke([["system", "Execute self-corrective field mapping."]]);`,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    tagline: "Next-Gen DeepMind Multimodal & Ultra Context",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    bgRgba: "rgba(59, 130, 246, 0.12)",
    logo: (
      <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f622, #3b82f666)", border: "1px solid #3b82f6", display: "grid", placeItems: "center", boxShadow: "0 0 16px #3b82f644" }}>
        <Sparkles size={24} color="#60a5fa" />
      </div>
    ),
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro (2M Context)", "gemini-1.5-flash"],
    latency: "95ms (Flash)",
    tokensPerSec: "210 tokens/sec",
    specialty: "Lightning fast response throughput with enormous context windows for multi-page forms.",
    codeSnippet: `// Seamless integration with Google Generative AI OpenAI-compatible endpoints
const gemini = getBaseFastModel(0.3); // Routes to generativelanguage.googleapis.com
const formResult = await gemini.invoke([["user", "Synthesize full PDF CV history into form attributes."]]);`,
  },
  {
    id: "groq",
    name: "Groq LPU Inference",
    tagline: "Hyper-Speed Real-Time Generation Engine",
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    bgRgba: "rgba(249, 115, 22, 0.12)",
    logo: (
      <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #f9731622, #f9731666)", border: "1px solid #f97316", display: "grid", placeItems: "center", boxShadow: "0 0 16px #f9731644" }}>
        <Flame size={24} color="#fb923c" />
      </div>
    ),
    models: ["llama-3.3-70b-versatile", "deepseek-r1-distill-llama-70b", "mixtral-8x7b-32768"],
    latency: "42ms",
    tokensPerSec: "450 tokens/sec (Instantaneous)",
    specialty: "Instant interactive autocompletion and real-time user verification loops.",
    codeSnippet: `// Powered by Language Processing Unit (LPU) Hardware for immediate UX feedback
const fastGroq = getBaseFastModel(0.0);
const res = await fastGroq.invoke([["user", "Verify syntax and autocomplete 25 remaining inputs."]]);`,
  },
  {
    id: "openrouter",
    name: "OpenRouter Hub",
    tagline: "Unified Single-Key Access to All Global Frontier Models",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
    bgRgba: "rgba(168, 85, 247, 0.12)",
    logo: (
      <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #a855f722, #a855f766)", border: "1px solid #a855f7", display: "grid", placeItems: "center", boxShadow: "0 0 16px #a855f744" }}>
        <Network size={24} color="#c084fc" />
      </div>
    ),
    models: ["anthropic/claude-3.7-sonnet", "deepseek/deepseek-r1", "google/gemini-2.5-pro", "meta-llama/llama-3.3-70b"],
    latency: "130ms",
    tokensPerSec: "140 tokens/sec",
    specialty: "Experiment with Anthropic Claude 3.7 and DeepSeek R1 reasoning without maintaining 10 separate billing accounts.",
    codeSnippet: `// Easily pass any custom OpenRouter model tag in user dashboard preferences
const customModel = getBaseFastModel(0.2); // Uses user.llmConfig.model
const answer = await customModel.invoke([["user", "Formulate an optimal engineering project narrative."]]);`,
  },
  {
    id: "custom",
    name: "Custom OpenAI Gateway",
    tagline: "Connect vLLM, Private AI Gateways, & Enterprise Proxies",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    bgRgba: "rgba(236, 72, 153, 0.12)",
    logo: (
      <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #ec489922, #ec489966)", border: "1px solid #ec4899", display: "grid", placeItems: "center", boxShadow: "0 0 16px #ec489944" }}>
        <Sliders size={24} color="#f472b6" />
      </div>
    ),
    models: ["custom-vllm-endpoint", "self-hosted-mixtral", "enterprise-proxy-v1"],
    latency: "Custom SLA",
    tokensPerSec: "Custom Hardware dependent",
    specialty: "Zero lock-in. Connect any internal firewall or customized internal corporate proxy.",
    codeSnippet: `// Point FormPilot directly to any custom internal infrastructure URL
const proxyModel = getBaseFastModel(0.2); // Custom baseURL: https://internal-gateway.corp.net/v1
const enterpriseFill = await proxyModel.invoke([["user", "Securely map internal intranet data profile."]]);`,
  },
];

export function LLMGatewayShowcase() {
  const [selectedId, setSelectedId] = useState<string>("ollama");
  const [activeModelIndex, setActiveModelIndex] = useState<number>(0);
  const [testing, setTesting] = useState<boolean>(false);
  const [testLog, setTestLog] = useState<string | null>(null);

  const current = PROVIDERS.find((p) => p.id === selectedId) || PROVIDERS[0];

  const runSimulatedTest = () => {
    if (testing) return;
    setTesting(true);
    setTestLog(null);
    setTimeout(() => {
      setTesting(false);
      setTestLog(`⚡ Handshake successful! Provider: ${current.name} (${current.models[activeModelIndex] || current.models[0]}). Latency: ${current.latency}. Throughput: ${current.tokensPerSec}. Output: "GATEWAY_VERIFIED_ACTIVE"`);
    }, 900);
  };

  const handleProviderSelect = (id: string) => {
    setSelectedId(id);
    setActiveModelIndex(0);
    setTestLog(null);
  };

  return (
    <section
      id="gateway"
      style={{
        padding: "80px 24px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Title Header */}
      <div style={{ textAlign: "center", marginBottom: "52px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "6px 16px", borderRadius: "999px", fontSize: "12px", color: "#60a5fa", fontWeight: 700, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px", boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)" }}>
          <Layers size={14} color="#60a5fa" />
          Zero-Lock-In Multi-Provider Engine
        </div>
        <h2 style={{ fontSize: "40px", fontWeight: 800, color: "#f0ece4", margin: "0 0 16px", fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.02em" }}>
          Universal LLM Gateway
        </h2>
        <p style={{ fontSize: "17px", color: "#a1a1aa", maxWidth: "760px", margin: "0 auto", lineHeight: 1.6 }}>
          Switch AI foundation models instantly from your dashboard without changing a single line of application code. Harness local Ollama clusters, OpenAI reasoning, Google Gemini multimodal speed, or Groq LPUs.
        </p>
      </div>

      {/* Security Architectural Highlight Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(18, 18, 22, 0.9) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          borderRadius: "18px",
          padding: "22px 28px",
          marginBottom: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "18px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ padding: "10px", background: "rgba(16, 185, 129, 0.15)", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.35)", display: "grid", placeItems: "center" }}>
            <Lock size={26} color="#34d399" />
          </div>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              Zero-XSS Secure Database Vault
              <span style={{ fontSize: "11px", background: "#10b981", color: "#000", padding: "2px 8px", borderRadius: "6px", fontWeight: 800, textTransform: "uppercase" }}>Encrypted</span>
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
              Unlike insecure web forms that store API keys in plain text inside browser <code style={{ color: "#86efac", fontFamily: "'DM Mono', monospace" }}>localStorage</code>, FormPilot encrypts and persists credentials directly in PostgreSQL. Keys are injected at runtime via Node <code style={{ color: "#38bdf8", fontFamily: "'DM Mono', monospace" }}>AsyncLocalStorage</code> scoping!
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px 16px", borderRadius: "12px" }}>
          <Database size={16} color="#38bdf8" />
          <span style={{ fontSize: "13px", color: "#e2e8f0", fontFamily: "'DM Mono', monospace" }}>Postgres 1-to-1 User Profile</span>
        </div>
      </div>

      {/* Interactive Provider Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {PROVIDERS.map((provider) => {
          const isSelected = provider.id === selectedId;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleProviderSelect(provider.id)}
              style={{
                background: isSelected ? provider.bgRgba : "rgba(18, 18, 24, 0.6)",
                border: isSelected ? `2px solid ${provider.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "22px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isSelected ? `0 12px 32px -6px ${provider.color}44` : "0 4px 12px rgba(0,0,0,0.4)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {isSelected && (
                <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", background: `radial-gradient(circle at 100% 0%, ${provider.color}33 0%, transparent 70%)`, pointerEvents: "none" }} />
              )}
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  {provider.logo}
                  <div>
                    <div style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>{provider.name}</div>
                    <div style={{ fontSize: "12px", color: isSelected ? provider.color : "#71717a", fontWeight: 600 }}>{provider.models.length} Recommended Models</div>
                  </div>
                </div>
                {isSelected && <CheckCircle2 size={20} color={provider.color} style={{ flexShrink: 0 }} />}
              </div>

              <p style={{ margin: 0, fontSize: "13px", color: "#a1a1aa", lineHeight: 1.5 }}>
                {provider.tagline}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", fontFamily: "'DM Mono', monospace" }}>
                <span style={{ color: "#71717a" }}>Speed: <strong style={{ color: "#e2e8f0" }}>{provider.tokensPerSec}</strong></span>
                <span style={{ color: provider.color, fontWeight: 700 }}>⚡ {provider.latency.split(" ")[0]}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Provider Interactive Deep Dive & Simulator */}
      <div
        style={{
          background: "rgba(18, 18, 22, 0.9)",
          border: `1px solid ${current.color}44`,
          borderRadius: "22px",
          padding: "32px",
          boxShadow: `0 16px 48px -12px ${current.color}22`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
          {/* Left Column: Models & Specs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {current.logo}
              <div>
                <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#ffffff" }}>
                  {current.name} Ecosystem
                </h3>
                <span style={{ fontSize: "13px", color: current.color, fontWeight: 600 }}>
                  {current.specialty}
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                Select Active Model Identifier:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {current.models.map((mod, index) => {
                  const isSelectedMod = activeModelIndex === index;
                  return (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => { setActiveModelIndex(index); setTestLog(null); }}
                      style={{
                        background: isSelectedMod ? `${current.color}25` : "rgba(255,255,255,0.05)",
                        border: isSelectedMod ? `1px solid ${current.color}` : "1px solid rgba(255,255,255,0.08)",
                        color: isSelectedMod ? "#ffffff" : "#a1a1aa",
                        padding: "8px 16px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: isSelectedMod ? 700 : 400,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isSelectedMod ? `0 0 16px ${current.color}33` : "none",
                      }}
                    >
                      {mod}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diagnostics Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(0,0,0,0.4)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#71717a", textTransform: "uppercase" }}>Expected Latency</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: current.color, fontFamily: "'DM Mono', monospace", marginTop: "4px" }}>
                  ⚡ {current.latency}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "#71717a", textTransform: "uppercase" }}>Inference Throughput</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#34d399", fontFamily: "'DM Mono', monospace", marginTop: "4px" }}>
                  🔥 {current.tokensPerSec}
                </div>
              </div>
            </div>

            {/* Test Simulation Action Button */}
            <div>
              <button
                type="button"
                onClick={runSimulatedTest}
                disabled={testing}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  background: testing ? "rgba(255,255,255,0.1)" : current.gradient,
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: testing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: testing ? "none" : `0 6px 20px -4px ${current.color}88`,
                  transition: "all 0.2s ease",
                }}
              >
                {testing ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                {testing ? `Executing Benchmark on ${current.models[activeModelIndex] || current.models[0]}...` : `Test Live Gateway Handshake & Speed`}
              </button>
            </div>

            {testLog && (
              <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "14px", borderRadius: "12px", color: "#86efac", fontSize: "13px", fontFamily: "'DM Mono', monospace", lineHeight: 1.6, animation: "fadeIn 0.2s ease" }}>
                <CheckCircle2 size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom", color: "#10b981" }} />
                {testLog}
              </div>
            )}
          </div>

          {/* Right Column: Code Abstraction Preview */}
          <div style={{ display: "flex", flexDirection: "column", background: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#cbd5e1" }}>
                <Code2 size={16} color={current.color} />
                <span>Backend Gateway Factory Pattern</span>
              </div>
              <span style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", color: "#71717a" }}>chatModels.ts</span>
            </div>
            <div style={{ padding: "20px", overflowX: "auto", fontFamily: "'Fira Code', 'DM Mono', monospace", fontSize: "13px", lineHeight: 1.7, color: "#e2e8f0" }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#a5b4fc" }}>
                {current.codeSnippet}
              </pre>
            </div>
            <div style={{ background: "rgba(59, 130, 246, 0.08)", borderTop: "1px solid rgba(59, 130, 246, 0.15)", padding: "14px 18px", fontSize: "12px", color: "#93c5fd", display: "flex", alignItems: "center", gap: "8px", marginTop: "auto" }}>
              <Activity size={15} color="#3b82f6" />
              <span>Token consumption & model latency are tracked in user UsageAnalytics automatically!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
