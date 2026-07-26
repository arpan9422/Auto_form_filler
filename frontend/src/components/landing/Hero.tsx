"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const noiseRef = useRef<HTMLDivElement>(null);
  const [activeField, setActiveField] = useState(1);

  useEffect(() => {
    // Noise drift
    gsap.to(noiseRef.current, {
      x: 8, y: 6, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut",
    });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(badgeRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.2 })
      .fromTo(headingRef.current, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, "-=0.3")
      .fromTo(subtextRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.5")
      .fromTo(ctaRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
      .fromTo(statsRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.3")
      .fromTo(mockupRef.current, { y: 60, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "power2.out" }, "-=0.3");

    gsap.to(mockupRef.current, {
      y: -8, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.8,
    });

    const interval = setInterval(() => {
      setActiveField((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const fields = [
    { label: "Full Name", value: "Arpan Sharma" },
    { label: "Email", value: "arpan@example.com" },
    { label: "Why hire you?", value: "I'm a full-stack engineer with 3+ years building scalable systems, led the development of Wisdomly..." },
    { label: "Years of Experience", value: "3+" },
  ];

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "clamp(60px, 10vw, 140px) 24px clamp(40px, 8vw, 80px)",
        overflow: "hidden", textAlign: "center",
        background: "#0b0b0c",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Import fonts */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(1.8); } }
        @keyframes tickerSlide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes inkAppear { from { width: 0; } to { width: 100%; } }
        @keyframes fieldBlink { 0%,100% { opacity:1; } 50% { opacity:0; } }

        .cta-primary {
          transition: all 0.2s ease;
        }
        .cta-primary:hover {
          transform: translateY(-2px) rotate(-0.5deg);
          box-shadow: 6px 6px 0 #f59e0b;
        }
        .cta-secondary:hover {
          background: rgba(255,255,255,0.06) !important;
        }
        .quick-chip:hover {
          background: rgba(245,158,11,0.08) !important;
          border-color: rgba(245,158,11,0.25) !important;
          color: #fbbf24 !important;
        }
        .stat-item {
          transition: transform 0.2s ease;
        }
        .stat-item:hover {
          transform: rotate(-1deg) scale(1.04);
        }
        
        @media (max-width: 767px) {
          .hero-mockup {
            display: none !important;
          }
        }
        
        @media (min-width: 768px) {
          .hero-mockup {
            display: block !important;
          }
        }
      `}} />

      {/* Noise texture overlay */}
      <div ref={noiseRef} style={{
        position: "absolute", inset: "-40px", zIndex: 0, pointerEvents: "none", opacity: 0.028,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: "180px 180px",
      }} />

      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
        maskImage: "radial-gradient(ellipse 75% 65% at 50% 10%, black 30%, transparent 100%)",
      }} />

      {/* Top-left decorative number */}
      <div style={{
        position: "absolute", top: "100px", left: "40px", zIndex: 1,
        fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.1)",
        letterSpacing: "0.1em", writingMode: "vertical-rl",
        textTransform: "uppercase",
      }}>
        v0.9.1-beta&nbsp;·&nbsp;2025
      </div>

      {/* Amber smear accent — top right */}
      <div style={{
        position: "absolute", top: "60px", right: "80px", zIndex: 0,
        width: "240px", height: "240px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "120px", left: "20%", zIndex: 0,
        width: "500px", height: "300px",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      {/* Badge */}
      <div ref={badgeRef} style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: "4px 14px 4px 8px", borderRadius: "4px",
        border: "1px solid rgba(245,158,11,0.25)",
        background: "rgba(245,158,11,0.05)",
        fontSize: "11px", fontWeight: 500, color: "#d97706",
        marginBottom: "32px", position: "relative", zIndex: 1, opacity: 0,
        fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}>
        <span style={{
          width: "5px", height: "5px", borderRadius: "50%",
          background: "#f59e0b", animation: "heroPulse 2.5s infinite",
          display: "inline-block",
        }} />
        Public Beta&ensp;·&ensp;150+ users
      </div>

      {/* Heading */}
      <h1 ref={headingRef} style={{
        fontSize: "clamp(44px, 6.5vw, 82px)", fontWeight: 800, lineHeight: 1.0,
        letterSpacing: "-2px", color: "#f0ece4", maxWidth: "780px",
        marginBottom: "28px", position: "relative", zIndex: 1, opacity: 0,
        fontFamily: "'Playfair Display', Georgia, serif",
      }}>
        Your Form{" "}
        <em style={{
          fontStyle: "italic",
          background: "linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)",
          backgroundSize: "200% 200%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Copilot.
        </em>
        <br />
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontStyle: "normal",
          fontWeight: 300,
          fontSize: "clamp(32px, 4.5vw, 56px)",
          color: "rgba(240,236,228,0.5)",
          letterSpacing: "-1px",
          display: "inline-block",
          marginTop: "4px",
        }}>
          Anywhere you work.
        </span>
      </h1>

      {/* Ink underline decoration */}
      <div style={{
        position: "relative", zIndex: 1, marginBottom: "28px", marginTop: "-8px",
        display: "flex", justifyContent: "center",
      }}>
        <svg width="220" height="12" viewBox="0 0 220 12" fill="none">
          <path d="M4 9 C40 3, 80 11, 120 7 C160 3, 195 10, 216 6"
            stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M20 11 C60 5, 100 12, 140 8 C175 4, 205 10, 218 8"
            stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
        </svg>
      </div>

      {/* Subtext */}
      <p ref={subtextRef} style={{
        fontSize: "17px", lineHeight: 1.7, color: "#71717a",
        maxWidth: "460px", marginBottom: "40px", position: "relative", zIndex: 1, opacity: 0,
        fontWeight: 300,
      }}>
        Fill any form instantly with AI. Refine answers via chat.{" "}
        <span style={{ color: "#a1a1aa", fontStyle: "italic" }}>No copy-paste. No tabs.</span> Just done.
      </p>

      {/* CTAs */}
      <div ref={ctaRef} style={{
        display: "flex", alignItems: "center", gap: "12px",
        marginBottom: "44px", position: "relative", zIndex: 1, opacity: 0,
        flexWrap: "wrap", justifyContent: "center",
      }}>
        <a href="#" className="cta-primary" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "#f59e0b", color: "#0b0b0c",
          padding: "13px 26px", borderRadius: "4px",
          fontSize: "14px", fontWeight: 700, textDecoration: "none",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.02em",
          border: "2px solid #f59e0b",
        }}>
          ⚡ Install · Open Source
        </a>
        <a href="#how-it-works" className="cta-secondary" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "transparent", color: "#a1a1aa",
          padding: "13px 22px", borderRadius: "4px",
          fontSize: "14px", fontWeight: 400, textDecoration: "none",
          border: "1px solid rgba(255,255,255,0.08)",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.2s ease",
        }}>
          See how it works →
        </a>
      </div>

      {/* Stats */}
      <div ref={statsRef} style={{
        display: "flex", alignItems: "center", gap: "0",
        marginBottom: "60px", position: "relative", zIndex: 1, opacity: 0,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 0",
      }}>
        {[
          { value: "2,400+", label: "Forms filled" },
          { value: "4.9★", label: "User rating" },
        ].map((s, i) => (
          <div key={i} className="stat-item" style={{
            textAlign: "center", padding: "0 32px",
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

      {/* Mockup */}
      <div ref={mockupRef} style={{
        maxWidth: "880px", width: "100%",
        position: "relative", zIndex: 1, opacity: 0,
      }} className="hero-mockup">
        {/* Slight tilt frame */}
        <div style={{
          background: "#111114",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)",
          overflow: "hidden",
          transform: "rotate(-0.3deg)",
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
              greenhouse.io/jobs/apply?id=123456
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

          <div style={{ display: "flex" }}>
            {/* Left: Form */}
            <div style={{ flex: 1, padding: "28px 32px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ marginBottom: "22px" }}>
                <h3 style={{
                  fontSize: "17px", fontWeight: 700, color: "#e4e4e7",
                  marginBottom: "4px",
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: "-0.3px",
                }}>
                  Software Engineer – Application
                </h3>
                <p style={{
                  fontSize: "11px", color: "#52525b",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Acme Corp&ensp;·&ensp;Full-time&ensp;·&ensp;Remote
                </p>
              </div>

              {fields.map((field, i) => (
                <div key={i} style={{ marginBottom: "14px" }}>
                  <label style={{
                    display: "block", fontSize: "10px", fontWeight: 500,
                    color: "#3f3f46", marginBottom: "5px",
                    textTransform: "uppercase", letterSpacing: "0.07em",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {field.label}
                  </label>
                  <div style={{
                    background: activeField === i ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)",
                    border: activeField === i
                      ? "1px solid rgba(245,158,11,0.3)"
                      : "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "6px",
                    padding: "9px 12px",
                    fontSize: "13px",
                    color: "#a1a1aa",
                    minHeight: i === 2 ? "60px" : "auto",
                    transition: "all 0.4s ease",
                    position: "relative",
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.5,
                  }}>
                    {field.value}
                    {activeField === i && (
                      <span style={{
                        display: "inline-block",
                        width: "1px", height: "13px",
                        background: "#f59e0b",
                        marginLeft: "2px",
                        verticalAlign: "middle",
                        animation: "fieldBlink 1s infinite",
                      }} />
                    )}
                    <span style={{
                      position: "absolute", top: "6px", right: "9px",
                      fontSize: "9px", fontWeight: 600,
                      color: activeField === i ? "#d97706" : "rgba(245,158,11,0.25)",
                      transition: "color 0.3s ease",
                      fontFamily: "'DM Mono', monospace",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      ai ✓
                    </span>
                  </div>
                </div>
              ))}

              <button style={{
                marginTop: "10px", padding: "9px 22px", borderRadius: "5px",
                background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                color: "#52525b", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                Submit Application
              </button>
            </div>

            {/* Right: Chat panel */}
            <div style={{ width: "288px", display: "flex", flexDirection: "column", background: "#0d0d10" }}>
              <div style={{
                padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
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
                }}>
                  4 filled
                </span>
              </div>

              <div style={{
                flex: 1, padding: "14px 12px",
                display: "flex", flexDirection: "column", gap: "8px",
              }}>
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
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.55,
                }}>
                  Add Wisdomly project and make it more senior
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
                  }}>Updated 2 fields ✓</span><br />
                  Added Wisdomly + elevated the experience language.
                </div>
              </div>

              {/* Quick actions */}
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
          </div>
        </div>

        {/* Amber glow under mockup */}
        <div style={{
          position: "absolute", bottom: "-50px", left: "50%",
          transform: "translateX(-50%)", width: "60%", height: "100px",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)",
          filter: "blur(25px)", pointerEvents: "none",
        }} />

        {/* Small rotated label — bottom right */}
        <div style={{
          position: "absolute", bottom: "-18px", right: "16px",
          fontFamily: "'DM Mono', monospace", fontSize: "10px",
          color: "rgba(255,255,255,0.1)", transform: "rotate(1.5deg)",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          AI-filled · 0.4s
        </div>
      </div>
    </section>
  );
}