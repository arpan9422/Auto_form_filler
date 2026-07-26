"use client";

import React, { useState, useEffect } from "react";
import {
  Github,
  Zap,
  Brain,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Code2,
  FileText,
  Star,
  RefreshCw,
  Terminal,
  Database,
  Chrome,
  Flame,
  LayoutDashboard,
  Boxes,
  Lock,
} from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/arpan9422/Auto_form_filler";

// ─── DEMO SIMULATOR STATE DATA ──────────────────────────────────────────────
const DEMO_FIELDS = [
  { key: "fullName", label: "Full Name", value: "Arpan Dey", type: "PERSONAL" },
  { key: "email", label: "Email Address", value: "arpan@example.com", type: "PERSONAL" },
  { key: "role", label: "Applying For Position", value: "Full Stack Engineer", type: "EXPERIENCE" },
  { key: "topProject", label: "Showcase Project", value: "FormPilot AI (Priority 5 ★)", type: "PROJECT" },
  { key: "techStack", label: "Primary Tech Stack", value: "TypeScript, Node.js, Next.js, LangGraph, ChromaDB", type: "PROJECT" },
  { key: "coverNote", label: "Why work with us?", value: "Passionate about building agentic AI workflows with strict deterministic grounding.", type: "ANSWER" },
];

const AGENT_STEPS = [
  { name: "Intake", desc: "Scrape DOM fields & pre-fill deterministic inputs (Name, Email)" },
  { name: "Planner", desc: "Categorize pending fields & determine semantic RAG requirements" },
  { name: "RAG Retrieval", desc: "Query ChromaDB vector store for project chunks (Weighted by priority)" },
  { name: "Composer", desc: "Invoke GPT-4o with structured JSON schema & humanized voice instructions" },
  { name: "Validator", desc: "Run JSON validator & repair loop (100% field coverage output)" },
];

export default function IdentityPage() {
  const [simulating, setSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [filledCount, setFilledCount] = useState(0);
  const [activeRagTab, setActiveRagTab] = useState<string>("PROJECT");

  const runSimulation = () => {
    if (simulating) return;
    setSimulating(true);
    setActiveStep(0);
    setFilledCount(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < AGENT_STEPS.length) {
        setActiveStep(step);
        setFilledCount(Math.min(DEMO_FIELDS.length, Math.ceil((step / (AGENT_STEPS.length - 1)) * DEMO_FIELDS.length)));
      } else {
        setFilledCount(DEMO_FIELDS.length);
        clearInterval(interval);
        setTimeout(() => setSimulating(false), 800);
      }
    }, 900);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0c" }}>
      {/* ─── HEADER / NAVBAR ────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(11, 11, 12, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/logo.png"
            alt="FormPilot Logo"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              objectFit: "contain",
              filter: "invert(1) drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))",
            }}
          />
          <div>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "#f0ece4", letterSpacing: "-0.5px" }}>
              FormPilot
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#f59e0b",
                fontFamily: "'DM Mono', monospace",
                marginLeft: "6px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
              }}
            >
              IDENTITY
            </span>
          </div>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <a href="#overview" style={navLinkStyle}>Overview</a>
          <a href="#simulator" style={navLinkStyle}>Live Demo</a>
          <a href="#agent" style={navLinkStyle}>Agent Flow</a>
          <a href="#rag" style={navLinkStyle}>RAG System</a>
          <a href="#tech" style={navLinkStyle}>Tech Stack</a>
          <a href="#opensource" style={navLinkStyle}>Open Source</a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "6px",
              background: "#18181b",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#f0ece4",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            <Github size={16} />
            <span>GitHub Repository</span>
            <Star size={13} style={{ color: "#f59e0b", marginLeft: "2px" }} />
          </a>
        </div>
      </header>

      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <section
        id="overview"
        style={{
          padding: "100px 24px 80px",
          maxWidth: "1100px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Glow ambient backplate */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "300px",
            background: "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.15) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 75%)",
            pointerEvents: "none",
            filter: "blur(60px)",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "20px",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            color: "#f59e0b",
            fontSize: "12px",
            fontFamily: "'DM Mono', monospace",
            marginBottom: "24px",
          }}
        >
          <img src="/logo.png" alt="FormPilot" style={{ width: "16px", height: "16px", objectFit: "contain", filter: "invert(1)" }} />
          <span>Product Identity & Architecture Showcase</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-2px",
            color: "#f0ece4",
            margin: "0 0 24px",
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          FormPilot — Your Autonomous <br />
          <span
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #fde68a 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Form Copilot Engine
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "#a1a1aa",
            fontWeight: 300,
            maxWidth: "760px",
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          FormPilot eliminates tedious copy-pasting across job applications, portal forms, and surveys.
          Powered by a 5-node <strong>LangGraph stateful agent</strong> and <strong>ChromaDB RAG vector retrieval</strong>, it populates web fields with exact, humanized answers rooted in your profile data.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 28px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#000",
              fontWeight: 700,
              fontSize: "15px",
              textDecoration: "none",
              boxShadow: "0 8px 30px rgba(245, 158, 11, 0.35)",
              transition: "transform 0.2s ease",
            }}
          >
            <Github size={18} />
            <span>Explore Source Code on GitHub</span>
            <ArrowRight size={16} />
          </a>

          <a
            href="#simulator"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 28px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#e5e7eb",
              fontWeight: 600,
              fontSize: "15px",
              textDecoration: "none",
            }}
          >
            <Zap size={18} style={{ color: "#f59e0b" }} />
            <span>Try Live Simulator</span>
          </a>
        </div>
      </section>

      {/* ─── INTERACTIVE DEMO SIMULATOR ─────────────────────────────────────── */}
      <section
        id="simulator"
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#111114",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Interactive Demonstration
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#f0ece4", margin: "4px 0 0", fontFamily: "'Playfair Display', Georgia, serif" }}>
                Form Autofill Engine Simulator
              </h2>
            </div>
            <button
              onClick={runSimulation}
              disabled={simulating}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "6px",
                background: simulating ? "#3f3f46" : "#f59e0b",
                color: "#000",
                fontWeight: 700,
                fontSize: "13px",
                border: "none",
                cursor: simulating ? "not-allowed" : "pointer",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <RefreshCw size={14} style={{ animation: simulating ? "spin 1s linear infinite" : "none" }} />
              <span>{simulating ? "Executing Agent Graph..." : "Simulate Form Fill"}</span>
            </button>
          </div>

          {/* Progress state banner */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#71717a", marginBottom: "8px", fontFamily: "'DM Mono', monospace" }}>
              CURRENT LANGGRAPH NODE: <strong style={{ color: "#f59e0b" }}>[{AGENT_STEPS[activeStep].name}]</strong>
            </div>
            <div style={{ fontSize: "14px", color: "#e5e7eb" }}>{AGENT_STEPS[activeStep].desc}</div>

            <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", marginTop: "12px" }}>
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #f59e0b, #6366f1)",
                  width: `${((activeStep + 1) / AGENT_STEPS.length) * 100}%`,
                  transition: "width 0.4s ease",
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>

          {/* Mock Form Field Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {DEMO_FIELDS.map((field, index) => {
              const isFilled = index < filledCount;
              return (
                <div
                  key={field.key}
                  style={{
                    background: isFilled ? "rgba(245, 158, 11, 0.04)" : "rgba(255, 255, 255, 0.02)",
                    border: isFilled ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "8px",
                    padding: "14px",
                    transition: "all 0.3s ease",
                    boxShadow: isFilled ? "0 4px 16px rgba(245, 158, 11, 0.08)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#71717a", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
                      {field.label}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: isFilled ? "#10b981" : "#52525b",
                        fontFamily: "'DM Mono', monospace",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: isFilled ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      {isFilled ? "✓ FILLED" : "PENDING"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: isFilled ? "#f0ece4" : "#3f3f46",
                      fontWeight: isFilled ? 500 : 400,
                      minHeight: "20px",
                    }}
                  >
                    {isFilled ? field.value : "Waiting for composer node..."}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── LANGGRAPH AGENT PIPELINE ─────────────────────────────────────── */}
      <section
        id="agent"
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Stateful AI Architecture
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#f0ece4", margin: "8px 0", fontFamily: "'Playfair Display', Georgia, serif" }}>
            5-Node LangGraph Agent Pipeline
          </h2>
          <p style={{ fontSize: "15px", color: "#71717a", maxWidth: "600px", margin: "0 auto" }}>
            Rather than relying on generic single-prompt calls, FormPilot executes a deterministic StateGraph that validates every answer before population.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {[
            { step: "01", name: "Intake", icon: <Terminal size={20} />, text: "Filters & pre-fills name/email deterministically without spending LLM tokens." },
            { step: "02", name: "Planner", icon: <Layers size={20} />, text: "Categorizes complex pending inputs (code questions, cover notes, experience)." },
            { step: "03", name: "RAG Retrieval", icon: <Database size={20} />, text: "Queries ChromaDB for weighted user project chunks and past episodic memory." },
            { step: "04", name: "Composer", icon: <Brain size={20} />, text: "Invokes GPT-4o with site-specific tone blocks to produce clean JSON answers." },
            { step: "05", name: "Validator", icon: <CheckCircle2 size={20} />, text: "Validates schema adherence and triggers self-healing repair loops if needed." },
          ].map((node) => (
            <div
              key={node.step}
              style={{
                background: "#111114",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "8px",
                padding: "20px",
                position: "relative",
              }}
            >
              <div style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "'DM Mono', monospace", marginBottom: "12px" }}>
                NODE_{node.step}
              </div>
              <div style={{ color: "#f59e0b", marginBottom: "12px" }}>{node.icon}</div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f0ece4", margin: "0 0 8px" }}>{node.name}</h3>
              <p style={{ fontSize: "13px", color: "#71717a", lineHeight: 1.5, margin: 0 }}>{node.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RAG VECTOR MEMORY SYSTEM ─────────────────────────────────────── */}
      <section
        id="rag"
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#111114",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "12px",
            padding: "36px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "28px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#818cf8", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Knowledge Foundation
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#f0ece4", margin: "6px 0 0", fontFamily: "'Playfair Display', Georgia, serif" }}>
                7-Layer RAG Memory Engine
              </h2>
            </div>

            {/* Chunk selector tabs */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["PERSONAL", "PROJECT", "EXPERIENCE", "EDUCATION", "ANSWER", "RESUME", "EPISODIC"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveRagTab(t)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "'DM Mono', monospace",
                    border: activeRagTab === t ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.06)",
                    background: activeRagTab === t ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.02)",
                    color: activeRagTab === t ? "#a5b4fc" : "#71717a",
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "8px",
              padding: "20px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "13px",
              color: "#a5b4fc",
            }}
          >
            <div style={{ color: "#71717a", marginBottom: "8px" }}>// Vector Store Index Chunk Metadata ({activeRagTab})</div>
            {activeRagTab === "PROJECT" && (
              <div>
                {"{"} <br />
                &nbsp;&nbsp;&quot;type&quot;: &quot;PROJECT&quot;, <br />
                &nbsp;&nbsp;&quot;priority&quot;: 5, <strong style={{ color: "#f59e0b" }}>// ⭐ Showcase Weight Boost (+10 score)</strong> <br />
                &nbsp;&nbsp;&quot;techStacks&quot;: [&quot;TypeScript&quot;, &quot;Node.js&quot;, &quot;Prisma&quot;], <br />
                &nbsp;&nbsp;&quot;embeddingModel&quot;: &quot;text-embedding-3-small&quot; <br />
                {"}"}
              </div>
            )}
            {activeRagTab === "EPISODIC" && (
              <div>
                {"{"} <br />
                &nbsp;&nbsp;&quot;type&quot;: &quot;EPISODIC&quot;, <br />
                &nbsp;&nbsp;&quot;source&quot;: &quot;ChatEpisode&quot;, <br />
                &nbsp;&nbsp;&quot;retrieval&quot;: &quot;Semantic history recall for long-term user voice alignment&quot; <br />
                {"}"}
              </div>
            )}
            {activeRagTab !== "PROJECT" && activeRagTab !== "EPISODIC" && (
              <div>
                {"{"} <br />
                &nbsp;&nbsp;&quot;type&quot;: &quot;{activeRagTab}&quot;, <br />
                &nbsp;&nbsp;&quot;status&quot;: &quot;Synchronized with PostgreSQL & ChromaDB Collection&quot; <br />
                {"}"}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── TECH STACK BREAKDOWN ─────────────────────────────────────────── */}
      <section
        id="tech"
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Technical Composition
          </div>
          <h2 style={{ fontSize: "36px", fontWeight: 800, color: "#f0ece4", margin: "8px 0", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Full Stack Architecture
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          <div style={techCardStyle}>
            <Cpu size={24} style={{ color: "#f59e0b", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "18px", color: "#f0ece4", margin: "0 0 12px" }}>Backend Engine</h3>
            <ul style={techListStyle}>
              <li>Node.js + Express + TypeScript</li>
              <li>Prisma ORM v7 + PostgreSQL 15</li>
              <li>LangGraph (LangChain.js) State Graph</li>
              <li>ChromaDB Vector Store</li>
              <li>AWS S3 PDF Resume Storage</li>
            </ul>
          </div>

          <div style={techCardStyle}>
            <LayoutDashboard size={24} style={{ color: "#818cf8", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "18px", color: "#f0ece4", margin: "0 0 12px" }}>Frontend Dashboard</h3>
            <ul style={techListStyle}>
              <li>Next.js 14 App Router</li>
              <li>TypeScript + React 18</li>
              <li>GSAP + ScrollTrigger Animations</li>
              <li>Lucide React Icon System</li>
              <li>Axios Intercepted Service Layer</li>
            </ul>
          </div>

          <div style={techCardStyle}>
            <Chrome size={24} style={{ color: "#10b981", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "18px", color: "#f0ece4", margin: "0 0 12px" }}>Chrome Extension</h3>
            <ul style={techListStyle}>
              <li>Manifest V3 (MV3)</li>
              <li>Vite Build Pipeline</li>
              <li>Universal DOM Field Scraper</li>
              <li>Progress-state Floating Button</li>
              <li>Background Service Worker</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── OPEN SOURCE COMMUNITY HUB ────────────────────────────────────── */}
      <section
        id="opensource"
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(17, 17, 20, 1) 100%)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: "16px",
            padding: "48px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "grid",
              placeItems: "center",
              color: "#f59e0b",
              margin: "0 auto 20px",
            }}
          >
            <Github size={24} />
          </div>

          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#f0ece4", margin: "0 0 12px", fontFamily: "'Playfair Display', Georgia, serif" }}>
            100% Open Source Project
          </h2>

          <p style={{ fontSize: "16px", color: "#a1a1aa", maxWidth: "640px", margin: "0 auto 28px", lineHeight: 1.6 }}>
            FormPilot is built for the developer community. Contributions, feature proposals, ATS scrapers, and pull requests are warmly welcomed under the MIT License.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 28px",
                borderRadius: "8px",
                background: "#f0ece4",
                color: "#000",
                fontWeight: 700,
                fontSize: "15px",
                textDecoration: "none",
              }}
            >
              <Github size={18} />
              <span>https://github.com/arpan9422/Auto_form_filler</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.07)",
          padding: "32px 24px",
          textAlign: "center",
          color: "#52525b",
          fontSize: "13px",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        <div>FormPilot Product Identity & Architecture © 2025 • Open Source MIT</div>
        <div style={{ marginTop: "8px" }}>
          GitHub Repository:{" "}
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#f59e0b", textDecoration: "none" }}>
            arpan9422/Auto_form_filler
          </a>
        </div>
      </footer>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "13px",
  textDecoration: "none",
  transition: "color 0.2s ease",
};

const techCardStyle: React.CSSProperties = {
  background: "#111114",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  borderRadius: "10px",
  padding: "24px",
};

const techListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  fontSize: "14px",
  color: "#a1a1aa",
  lineHeight: 1.8,
};
