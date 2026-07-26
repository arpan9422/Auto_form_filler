"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────── STEP MOCKUPS ─────────────────── */

function StepOneMockup() {
  return (
    <div style={{ position: "relative", padding: "4px" }}>
      <div style={{
        background: "#111114",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)",
        transform: "rotate(0.4deg)",
      }}>
        {/* Title bar */}
        <div style={{
          display: "flex", alignItems: "center", padding: "11px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)", gap: "10px",
          background: "#0e0e11",
        }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
          </div>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: "5px",
            padding: "4px 12px", fontSize: "11px", color: "#52525b",
            textAlign: "center", fontFamily: "'DM Mono', monospace",
          }}>
            linkedin.com/jobs/apply/12345
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "5px",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "4px", padding: "4px 10px",
          }}>
            <span style={{ fontSize: "11px" }}>⚡</span>
            <span style={{
              fontSize: "10px", color: "#d97706", fontWeight: 600,
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>FormPilot</span>
          </div>
        </div>

        {/* Page content — blank form + floating button */}
        <div style={{ padding: "24px", position: "relative", minHeight: "200px" }}>
          {[
            { label: "Full Name" },
            { label: "Phone Number" },
            { label: "Cover Letter", tall: true },
          ].map((field, i) => (
            <div key={i} style={{ marginBottom: "14px" }}>
              <div style={{
                fontSize: "10px", color: "#3f3f46", marginBottom: "5px",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>{field.label}</div>
              <div style={{
                height: field.tall ? "52px" : "28px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "6px",
              }} />
            </div>
          ))}

          {/* Floating Auto Fill button */}
          <div style={{
            position: "absolute", bottom: "20px", right: "20px",
            background: "#f59e0b", color: "#0b0b0c",
            padding: "9px 16px", borderRadius: "4px",
            fontSize: "12px", fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.04em",
            display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
            animation: "amberPulse 2s ease-in-out infinite",
          }}>
            ⚡ Auto Fill
          </div>
        </div>
      </div>
      {/* Amber glow */}
      <div style={{
        position: "absolute", bottom: "-40px", left: "50%",
        transform: "translateX(-50%)", width: "60%", height: "80px",
        background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)",
        filter: "blur(20px)", pointerEvents: "none",
      }} />
    </div>
  );
}

function StepTwoMockup() {
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        background: "#111114",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)",
        transform: "rotate(-0.3deg)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", padding: "11px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)", gap: "10px",
          background: "#0e0e11",
        }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
          </div>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: "5px",
            padding: "4px 12px", fontSize: "11px", color: "#52525b",
            textAlign: "center", fontFamily: "'DM Mono', monospace",
          }}>
            greenhouse.io/apply
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "5px",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "4px", padding: "4px 10px",
          }}>
            <span style={{ fontSize: "11px" }}>⚡</span>
            <span style={{
              fontSize: "10px", color: "#d97706", fontWeight: 600,
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>FormPilot</span>
          </div>
        </div>

        <div style={{ padding: "24px" }}>
          {[
            { label: "Full Name", value: "Arpan Sharma" },
            { label: "Email", value: "arpan@example.com" },
            { label: "Years of Experience", value: "3+" },
          ].map((field, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <label style={{
                display: "block", fontSize: "10px", fontWeight: 500,
                color: "#3f3f46", marginBottom: "5px",
                textTransform: "uppercase", letterSpacing: "0.07em",
                fontFamily: "'DM Mono', monospace",
              }}>{field.label}</label>
              <div style={{
                background: "rgba(245,158,11,0.05)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: "6px", padding: "9px 12px",
                fontSize: "13px", color: "#a1a1aa",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {field.value}
                <span style={{
                  fontSize: "9px", fontWeight: 600, color: "#d97706",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>ai ✓</span>
              </div>
            </div>
          ))}

          {/* Cover letter */}
          <div>
            <label style={{
              display: "block", fontSize: "10px", fontWeight: 500,
              color: "#3f3f46", marginBottom: "5px",
              textTransform: "uppercase", letterSpacing: "0.07em",
              fontFamily: "'DM Mono', monospace",
            }}>Cover Letter</label>
            <div style={{
              background: "rgba(245,158,11,0.05)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: "6px", padding: "9px 12px",
              fontSize: "12px", color: "#71717a",
              lineHeight: 1.55, position: "relative",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              I'm a full-stack engineer with 3+ years building scalable systems, led the development of Wisdomly...
              <span style={{
                position: "absolute", top: "6px", right: "9px",
                fontSize: "9px", fontWeight: 600, color: "#d97706",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>ai ✓</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{
        position: "absolute", bottom: "-40px", left: "50%",
        transform: "translateX(-50%)", width: "60%", height: "80px",
        background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)",
        filter: "blur(20px)", pointerEvents: "none",
      }} />
    </div>
  );
}

function StepThreeMockup() {
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        background: "#111114",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)",
        transform: "rotate(0.2deg)",
      }}>
        {/* Chat panel header */}
        <div style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#0e0e11",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{
              width: "22px", height: "22px", borderRadius: "4px",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px",
            }}>⚡</div>
            <span style={{
              fontSize: "12px", fontWeight: 600, color: "#d4d4d8",
              fontFamily: "'DM Mono', monospace",
            }}>assistant</span>
          </div>
          <span style={{
            fontSize: "9px",
            background: "rgba(245,158,11,0.08)",
            color: "#d97706", padding: "2px 8px", borderRadius: "3px",
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase", letterSpacing: "0.06em",
            border: "1px solid rgba(245,158,11,0.15)",
          }}>4 filled</span>
        </div>

        {/* Messages */}
        <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "2px 8px 8px 8px",
            padding: "10px 12px", fontSize: "12px", color: "#71717a",
            lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif",
            borderLeft: "2px solid rgba(245,158,11,0.2)",
          }}>
            Filled all 4 fields from your profile ✨<br />Anything to refine?
          </div>

          <div style={{
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.12)",
            borderRadius: "8px 2px 8px 8px",
            padding: "10px 12px", fontSize: "12px", color: "#d4d4d8",
            alignSelf: "flex-end", maxWidth: "88%",
            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55,
          }}>
            Make it more professional and add Wisdomly
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "2px 8px 8px 8px",
            padding: "10px 12px", fontSize: "12px", color: "#71717a",
            lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif",
            borderLeft: "2px solid rgba(245,158,11,0.3)",
          }}>
            <span style={{
              color: "#d97706", fontWeight: 600,
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em",
            }}>Updated 3 fields ✓</span><br />
            Added Wisdomly + elevated the experience language.
          </div>
        </div>

        {/* Quick chips */}
        <div style={{
          padding: "8px 12px", display: "flex", gap: "5px", flexWrap: "wrap",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          {["Shorter", "Formal", "Regenerate"].map((a) => (
            <span key={a} className="quick-chip" style={{
              padding: "4px 10px", borderRadius: "4px",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: "10px", color: "#52525b", cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              textTransform: "uppercase", letterSpacing: "0.05em",
              transition: "all 0.15s ease",
            }}>
              {a}
            </span>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(255,255,255,0.03)", borderRadius: "5px",
            padding: "9px 12px",
            border: "1px solid rgba(245,158,11,0.15)",
          }}>
            <span style={{
              flex: 1, fontSize: "12px", color: "#3f3f46",
              fontFamily: "'DM Mono', monospace",
            }}>Type instruction...</span>
            <div style={{
              width: "22px", height: "22px",
              background: "#f59e0b",
              borderRadius: "4px", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "12px", color: "#0b0b0c",
              fontWeight: 700,
            }}>→</div>
          </div>
        </div>
      </div>
      <div style={{
        position: "absolute", bottom: "-40px", left: "50%",
        transform: "translateX(-50%)", width: "60%", height: "80px",
        background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)",
        filter: "blur(20px)", pointerEvents: "none",
      }} />
    </div>
  );
}

/* ─────────────────── STEPS DATA ─────────────────── */

const steps = [
  {
    number: "01",
    title: 'Click "Auto Fill"',
    description:
      "Hit the floating ⚡ button on any form page. FormPilot detects every input, textarea, and dropdown — instantly.",
    mockup: <StepOneMockup />,
  },
  {
    number: "02",
    title: "AI Fills in Seconds",
    description:
      "Using your stored projects, experience, and custom answers — AI generates perfect contextual responses and populates every field.",
    mockup: <StepTwoMockup />,
  },
  {
    number: "03",
    title: "Review & Submit",
    description:
      "Inspect the generated fields, verify answers tailored from your knowledge base, and submit with complete confidence.",
    mockup: <StepThreeMockup />,
  },
];

/* ─────────────────── MAIN COMPONENT ─────────────────── */

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const noiseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Noise drift — matches Hero
    gsap.to(noiseRef.current, {
      x: 8, y: 6, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut",
    });

    gsap.fromTo(
      headingRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
      }
    );

    const rows = sectionRef.current?.querySelectorAll(".step-row");
    rows?.forEach((row, i) => {
      gsap.fromTo(
        row,
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.85, ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 82%" },
          delay: i * 0.05,
        }
      );
    });
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      style={{
        position: "relative",
        padding: "clamp(60px, 10vw, 120px) 24px clamp(60px, 10vw, 140px)",
        background: "#0b0b0c",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Import fonts — same as Hero */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes amberPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(245,158,11,0.3); }
          50%       { box-shadow: 0 4px 32px rgba(245,158,11,0.6); }
        }
        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.3; transform:scale(1.8); }
        }
        .quick-chip:hover {
          background: rgba(245,158,11,0.08) !important;
          border-color: rgba(245,158,11,0.25) !important;
          color: #fbbf24 !important;
        }
        .step-number-badge {
          transition: transform 0.2s ease;
        }
        .step-number-badge:hover {
          transform: rotate(-2deg) scale(1.06);
        }
        
        @media (max-width: 767px) {
          .step-row {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          
          .step-mockup {
            display: none !important;
          }
        }
        
        @media (min-width: 768px) {
          .step-mockup {
            display: block !important;
          }
        }
      `}} />

      {/* Noise texture overlay — matches Hero */}
      <div ref={noiseRef} style={{
        position: "absolute", inset: "-40px", zIndex: 0, pointerEvents: "none", opacity: 0.028,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: "180px 180px",
      }} />

      {/* Dot grid — matches Hero */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 100%)",
      }} />

      {/* Ambient blobs — matches Hero palette */}
      <div style={{
        position: "absolute", top: "80px", right: "5%", zIndex: 0,
        width: "340px", height: "340px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "120px", left: "10%", zIndex: 0,
        width: "400px", height: "260px",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)",
        filter: "blur(70px)", pointerEvents: "none",
      }} />

      {/* Top-left version label — matches Hero */}
      <div style={{
        position: "absolute", top: "48px", left: "40px", zIndex: 1,
        fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.1)",
        letterSpacing: "0.1em", writingMode: "vertical-rl",
        textTransform: "uppercase",
      }}>
        section·02
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── Section heading ── */}
        <div ref={headingRef} style={{ textAlign: "center", marginBottom: "90px", opacity: 0 }}>
          {/* Badge — matches Hero badge style */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "4px 14px 4px 8px", borderRadius: "4px",
            border: "1px solid rgba(245,158,11,0.25)",
            background: "rgba(245,158,11,0.05)",
            fontSize: "11px", fontWeight: 500, color: "#d97706",
            marginBottom: "28px",
            fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            <span style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "#f59e0b", animation: "heroPulse 2.5s infinite",
              display: "inline-block",
            }} />
            How It Works
          </div>

          {/* Heading — Playfair Display, matches Hero */}
          <h2 style={{
            fontSize: "clamp(28px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.0,
            letterSpacing: "-2px", color: "#f0ece4", maxWidth: "640px",
            margin: "0 auto 20px",
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            Three steps.{" "}
            <em style={{
              fontStyle: "italic",
              background: "linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Zero friction.
            </em>
          </h2>

          {/* Ink underline — matches Hero */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <svg width="200" height="12" viewBox="0 0 200 12" fill="none">
              <path d="M4 9 C35 3, 75 11, 110 7 C145 3, 178 10, 196 6"
                stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55" />
              <path d="M18 11 C55 5, 95 12, 130 8 C162 4, 188 10, 198 8"
                stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
            </svg>
          </div>

          <p style={{
            fontSize: "clamp(14px, 3vw, 17px)", lineHeight: 1.7, color: "#71717a",
            maxWidth: "420px", margin: "0 auto",
            fontWeight: 300,
          }}>
            From blank form to perfect answers in{" "}
            <span style={{ color: "#a1a1aa", fontStyle: "italic" }}>under 10 seconds.</span>
          </p>
        </div>

        {/* ── Steps ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(60px, 15vw, 100px)" }}>
          {steps.map((step, i) => (
            <div
              key={i}
              className="step-row"
              style={{
                display: "grid",
                gridTemplateColumns: i % 2 === 0 ? "1fr 1.2fr" : "1.2fr 1fr",
                gap: "64px",
                alignItems: "center",
                opacity: 0,
              }}
            >
              {/* Text side */}
              <div style={{ order: i % 2 === 0 ? 1 : 2 }}>
                {/* Step badge — matches Hero badge style */}
                <div className="step-number-badge" style={{
                  display: "inline-flex", alignItems: "center", gap: "10px",
                  marginBottom: "24px",
                  padding: "4px 14px 4px 8px", borderRadius: "4px",
                  border: "1px solid rgba(245,158,11,0.25)",
                  background: "rgba(245,158,11,0.05)",
                }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 500, color: "#d97706",
                    fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}>
                    Step {step.number}
                  </span>
                </div>

                {/* Step title — Playfair, matches Hero heading hierarchy */}
                <h3 style={{
                  fontSize: "clamp(24px, 2.8vw, 38px)", fontWeight: 800, lineHeight: 1.1,
                  letterSpacing: "-1px", color: "#f0ece4",
                  marginBottom: "18px",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}>
                  {step.title}
                </h3>

                {/* Divider line */}
                <div style={{
                  width: "40px", height: "1px",
                  background: "rgba(245,158,11,0.4)",
                  marginBottom: "18px",
                }} />

                <p style={{
                  fontSize: "16px", lineHeight: 1.75, color: "#71717a",
                  fontWeight: 300,
                }}>
                  {step.description}
                </p>

                {/* Step connector dots — decorative, matches Hero mono aesthetic */}
                {i < steps.length - 1 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    marginTop: "32px",
                  }}>
                    {[0, 1, 2].map((dot) => (
                      <div key={dot} style={{
                        width: dot === 0 ? "20px" : "5px",
                        height: "1px",
                        background: dot === 0
                          ? "rgba(245,158,11,0.5)"
                          : "rgba(255,255,255,0.08)",
                        borderRadius: "1px",
                      }} />
                    ))}
                    <span style={{
                      fontSize: "10px", color: "rgba(255,255,255,0.15)",
                      fontFamily: "'DM Mono', monospace",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      marginLeft: "4px",
                    }}>
                      next →
                    </span>
                  </div>
                )}
              </div>

              {/* Mockup side */}
              <div style={{ order: i % 2 === 0 ? 2 : 1 }} className="step-mockup">
                {step.mockup}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom stat strip — mirrors Hero stats bar ── */}
        <div style={{
          marginTop: "100px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 0",
        }}>
          {[
            { value: "100%", label: "Field coverage" },
            { value: "Instant", label: "RAG matching" },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: "center", padding: "0 40px",
              borderRight: i < 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}>
              <div style={{
                fontSize: "22px", fontWeight: 700, color: "#f0ece4",
                fontFamily: "'Playfair Display', serif",
                letterSpacing: "-0.5px",
              }}>{s.value}</div>
              <div style={{
                fontSize: "11px", color: "#52525b", marginTop: "3px",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}