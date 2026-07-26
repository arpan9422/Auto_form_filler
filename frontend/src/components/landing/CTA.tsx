"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const noiseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.to(noiseRef.current, {
      x: 8, y: 6, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut",
    });

    gsap.fromTo(
      contentRef.current,
      { y: 60, opacity: 0, scale: 0.97 },
      {
        y: 0, opacity: 1, scale: 1,
        duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 82%" },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        padding: "clamp(50px, 8vw, 80px) 24px clamp(80px, 15vw, 140px)",
        background: "#0b0b0c",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.3; transform:scale(1.8); }
        }
        .cta-install {
          transition: all 0.2s ease;
        }
        .cta-install:hover {
          transform: translateY(-2px) rotate(-0.5deg);
          box-shadow: 6px 6px 0 rgba(245,158,11,0.4) !important;
        }
        .stat-item-cta {
          transition: transform 0.2s ease;
        }
        .stat-item-cta:hover {
          transform: rotate(-1deg) scale(1.05);
        }
      `}} />

      {/* Noise texture */}
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
        maskImage: "radial-gradient(ellipse 70% 80% at 50% 50%, black 20%, transparent 100%)",
      }} />

      {/* Vertical mono label */}
      <div style={{
        position: "absolute", top: "48px", left: "40px", zIndex: 1,
        fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.1)",
        letterSpacing: "0.1em", writingMode: "vertical-rl",
        textTransform: "uppercase",
      }}>
        section·04
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div
          ref={contentRef}
          style={{
            background: "#111114",
            borderRadius: "4px",
            border: "1px solid rgba(245,158,11,0.2)",
            padding: "72px 56px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            opacity: 0,
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Inner noise */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.02,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px 180px",
          }} />

          {/* Amber top glow */}
          <div style={{
            position: "absolute", top: "-80px", left: "50%",
            transform: "translateX(-50%)",
            width: "500px", height: "240px",
            background: "radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)",
            filter: "blur(40px)", pointerEvents: "none",
          }} />

          {/* Indigo bottom-right blob */}
          <div style={{
            position: "absolute", bottom: "-60px", right: "-60px",
            width: "280px", height: "280px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
            filter: "blur(40px)", pointerEvents: "none",
          }} />

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "4px 14px 4px 8px", borderRadius: "4px",
            border: "1px solid rgba(245,158,11,0.25)",
            background: "rgba(245,158,11,0.05)",
            fontSize: "11px", fontWeight: 500, color: "#d97706",
            marginBottom: "32px",
            fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
            textTransform: "uppercase",
            position: "relative", zIndex: 1,
          }}>
            <span style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "#f59e0b", animation: "heroPulse 2.5s infinite",
              display: "inline-block",
            }} />
            Free to install&ensp;·&ensp;30s setup
          </div>

          {/* Heading */}
          <h2 style={{
            fontSize: "clamp(32px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.0,
            letterSpacing: "-2px", color: "#f0ece4", maxWidth: "620px",
            margin: "0 auto 20px",
            fontFamily: "'Playfair Display', Georgia, serif",
            position: "relative", zIndex: 1,
          }}>
            Stop copy-pasting.{" "}
            <em style={{
              fontStyle: "italic",
              background: "linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Start flying.
            </em>
          </h2>

          {/* Ink underline */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", position: "relative", zIndex: 1 }}>
            <svg width="200" height="12" viewBox="0 0 200 12" fill="none">
              <path d="M4 9 C35 3, 75 11, 110 7 C145 3, 178 10, 196 6"
                stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55" />
              <path d="M18 11 C55 5, 95 12, 130 8 C162 4, 188 10, 198 8"
                stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
            </svg>
          </div>

          {/* Subtext */}
          <p style={{
            fontSize: "17px", lineHeight: 1.7, color: "#71717a",
            maxWidth: "400px", margin: "0 auto 40px",
            fontWeight: 300, position: "relative", zIndex: 1,
          }}>
            Install the extension. Fill your first form{" "}
            <span style={{ color: "#a1a1aa", fontStyle: "italic" }}>in under 30 seconds.</span>
          </p>

          {/* CTAs */}
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: "12px", flexWrap: "wrap",
            position: "relative", zIndex: 1, marginBottom: "52px",
          }}>
            <a href="#" className="cta-install" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#f59e0b", color: "#0b0b0c",
              padding: "13px 28px", borderRadius: "4px",
              fontSize: "14px", fontWeight: 700, textDecoration: "none",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.02em",
              border: "2px solid #f59e0b",
            }}>
              ⚡ Install · Open Source
            </a>
            <a href="#how-it-works" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "transparent", color: "#a1a1aa",
              padding: "13px 22px", borderRadius: "4px",
              fontSize: "14px", fontWeight: 400, textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "'DM Sans', sans-serif",
              transition: "background 0.2s ease",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              See how it works →
            </a>
          </div>

          {/* Stats strip — matches Hero stats bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "20px 0",
            position: "relative", zIndex: 1,
          }}>
            {[
              { value: "2,400+", label: "Forms filled" },
              { value: "150+", label: "Beta users" },
              { value: "4.8★", label: "User rating" },
            ].map((s, i) => (
              <div key={i} className="stat-item-cta" style={{
                textAlign: "center", padding: "0 40px",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
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

          {/* Bottom mono label */}
          <div style={{
            marginTop: "24px", position: "relative", zIndex: 1,
            fontFamily: "'DM Mono', monospace", fontSize: "10px",
            color: "rgba(255,255,255,0.1)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            AI-filled · 0.4s · No copy-paste
          </div>
        </div>
      </div>
    </section>
  );
}