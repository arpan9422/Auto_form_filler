"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Clean SVG icons — stroke-based, minimal
const Icons = {
  Bolt: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Chat: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Brain: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2a2.5 2.5 0 0 1 5 0v.5" />
      <path d="M9 2.5C6.5 3 4 5.5 4 9c0 2 .8 3.8 2 5" />
      <path d="M15 2.5C17.5 3 20 5.5 20 9c0 2-.8 3.8-2 5" />
      <path d="M4 14a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-1a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v1z" />
      <line x1="12" y1="13" x2="12" y2="22" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  Globe: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

const features = [
  {
    Icon: Icons.Bolt,
    title: "Instant Autofill",
    description: "One click. Every field filled. AI fills forms the moment you ask — no previews, no delays.",
    tag: "core",
    preview: (active: boolean) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "20px" }}>
        {["Full Name", "Email", "Experience"].map((f, i) => (
          <div key={i} style={{
            height: "24px",
            background: active ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)",
            border: active ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(255,255,255,0.05)",
            borderRadius: "4px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 8px",
            transition: "all 0.3s ease",
          }}>
            <span style={{ fontSize: "10px", color: "#52525b", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>{f}</span>
            <span style={{ fontSize: "9px", color: active ? "#d97706" : "#3f3f46", fontFamily: "'DM Mono', monospace", transition: "color 0.3s ease" }}>ai ✓</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    Icon: Icons.Chat,
    title: "Chat Refinement",
    description: 'Say "make it shorter" or "add project Wisdomly" — AI updates fields live without restarting.',
    tag: "interaction",
    preview: (active: boolean) => (
      <div style={{
        marginTop: "20px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "6px", padding: "10px",
        border: "1px solid rgba(255,255,255,0.05)",
        borderLeft: active ? "2px solid rgba(245,158,11,0.4)" : "2px solid transparent",
        transition: "border-color 0.3s ease",
      }}>
        {[
          { role: "ai", text: "Form filled. Refine?" },
          { role: "user", text: "Make it formal" },
          { role: "ai", text: "Updated 3 fields ✓" },
        ].map((m, i) => (
          <div key={i} style={{
            padding: "5px 8px", borderRadius: "4px",
            fontSize: "10px",
            color: m.role === "user" ? "#d4d4d8" : "#52525b",
            background: m.role === "user" ? "rgba(245,158,11,0.07)" : "transparent",
            marginBottom: "4px",
            maxWidth: m.role === "user" ? "80%" : "100%",
            marginLeft: m.role === "user" ? "auto" : 0,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {m.text}
          </div>
        ))}
      </div>
    ),
  },
  {
    Icon: Icons.Brain,
    title: "RAG Context Engine",
    description: "Your projects and answers are embedded as vectors and retrieved dynamically per form field.",
    tag: "ai",
    preview: (active: boolean) => (
      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "7px" }}>
        {["Project: Wisdomly", "Skill: TypeScript", "Experience: 3 yrs"].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px" }}>
            <div style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: active ? "#f59e0b" : "#27272a",
              flexShrink: 0, transition: "background 0.3s ease",
            }} />
            <span style={{ color: "#52525b", fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em" }}>{item}</span>
            <div style={{ flex: 1, height: "1px", background: active ? "linear-gradient(to right, rgba(245,158,11,0.2), transparent)" : "rgba(255,255,255,0.04)", transition: "all 0.3s ease" }} />
            <span style={{ color: active ? "#d97706" : "#3f3f46", fontFamily: "'DM Mono', monospace", transition: "color 0.3s ease" }}>matched</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    Icon: Icons.TrendingUp,
    title: "Learns From You",
    description: "Every edit you make improves future results. Your personal AI gets smarter over time.",
    tag: "adaptive",
    preview: (active: boolean) => (
      <div style={{ marginTop: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "10px", color: "#3f3f46", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>Accuracy</span>
          <span style={{ fontSize: "10px", color: active ? "#d97706" : "#3f3f46", fontFamily: "'DM Mono', monospace", transition: "color 0.3s ease" }}>87%</span>
        </div>
        <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "100px", overflow: "hidden" }}>
          <div style={{
            width: active ? "87%" : "60%", height: "100%",
            background: "linear-gradient(to right, #f59e0b, #fde68a)",
            borderRadius: "100px", transition: "width 0.6s ease",
          }} />
        </div>
      </div>
    ),
  },
  {
    Icon: Icons.Shield,
    title: "Privacy First",
    description: "We never auto-submit forms. Sensitive fields require your confirmation before filling.",
    tag: "security",
    preview: (active: boolean) => (
      <div style={{
        marginTop: "20px", display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 12px",
        background: active ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)",
        borderRadius: "5px",
        border: active ? "1px solid rgba(245,158,11,0.15)" : "1px solid rgba(255,255,255,0.05)",
        transition: "all 0.3s ease",
      }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "4px",
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icons.Shield />
        </div>
        <div>
          <div style={{ fontSize: "10px", color: "#d4d4d8", fontWeight: 600, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>Zero auto-submit</div>
          <div style={{ fontSize: "10px", color: "#3f3f46", marginTop: "2px", fontFamily: "'DM Sans', sans-serif" }}>You always stay in control</div>
        </div>
      </div>
    ),
  },
  {
    Icon: Icons.Globe,
    title: "Works Everywhere",
    description: "LinkedIn, Naukri, Google Forms, Greenhouse — any form on the web, automatically detected.",
    tag: "universal",
    preview: (active: boolean) => (
      <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {["LinkedIn", "Naukri", "Greenhouse", "Notion", "Google Forms", "Lever"].map((site) => (
          <span key={site} style={{
            padding: "3px 9px", borderRadius: "3px",
            border: active ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(255,255,255,0.06)",
            fontSize: "9px", color: active ? "#d97706" : "#3f3f46",
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase", letterSpacing: "0.05em",
            transition: "all 0.3s ease",
          }}>
            {site}
          </span>
        ))}
      </div>
    ),
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(headingRef.current, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
    });

    const cards = gridRef.current?.querySelectorAll(".feature-card");
    if (cards) {
      gsap.fromTo(cards, { y: 50, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: "power3.out",
        scrollTrigger: { trigger: gridRef.current, start: "top 85%" },
      });
    }
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        .feature-card {
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        @media (hover: hover) {
          .feature-card:hover {
            transform: translateY(-3px) rotate(-0.2deg);
            border-color: rgba(245,158,11,0.2) !important;
            box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.08) !important;
          }
          .feature-card:hover .card-icon-wrap {
            border-color: rgba(245,158,11,0.3) !important;
            background: rgba(245,158,11,0.08) !important;
            color: #d97706 !important;
          }
          .feature-card:hover .card-tag {
            color: #d97706 !important;
            border-color: rgba(245,158,11,0.2) !important;
          }
        }
        @media (max-width: 768px) {
          .feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1023px) {
          .feature-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}} />

      <section
        id="features"
        ref={sectionRef}
        style={{ padding: "clamp(60px, 10vw, 120px) 24px", maxWidth: "full", margin: "0 auto", backgroundColor: "#0b0b0c" }}
      >
        {/* Heading */}
        <div ref={headingRef} style={{ textAlign: "center", marginBottom: "72px", opacity: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
            <div style={{ height: "1px", width: "36px", background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08))" }} />
            <span style={{
              fontSize: "10px", fontWeight: 500, color: "#3f3f46",
              textTransform: "uppercase", letterSpacing: "0.12em",
              fontFamily: "'DM Mono', monospace",
            }}>
              Features
            </span>
            <div style={{ height: "1px", width: "36px", background: "linear-gradient(to left, transparent, rgba(255,255,255,0.08))" }} />
          </div>

          <h2 style={{
            fontSize: "clamp(28px, 6vw, 52px)", fontWeight: 800, color: "#f0ece4",
            letterSpacing: "-1.5px", marginBottom: "16px", lineHeight: 1.05,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            Everything you need to fill{" "}
            <br />
            forms{" "}
            <em style={{
              fontStyle: "italic",
              background: "linear-gradient(135deg, #f59e0b, #fde68a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              10× faster.
            </em>
          </h2>

          <p style={{
            fontSize: "clamp(14px, 3vw, 15px)", color: "#52525b", maxWidth: "420px", margin: "0 auto",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 300, lineHeight: 1.65,
          }}>
            Not a gimmick. A serious productivity system built for professionals.
          </p>
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="feature-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(12px, 2vw, 16px)",
          }}
        >
          {features.map((feature, i) => {
            const [hovered, setHovered] = (function () {
              // We use a closure trick — actual hover state handled via CSS class
              return [false, () => { }];
            })();

            return (
              <FeatureCard key={i} feature={feature} index={i} />
            );
          })}
        </div>
      </section>
    </>
  );
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [hovered, setHovered] = (function () {
    const { useState } = require("react");
    return useState(false);
  })();

  return (
    <div
      className="feature-card "
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#111114",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.05)",
        padding: "clamp(16px, 4vw, 26px) clamp(14px, 3vw, 22px)",
        opacity: 0,
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top row: icon + tag */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div
          className="card-icon-wrap"
          style={{
            width: "36px", height: "36px", borderRadius: "6px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#52525b",
            transition: "all 0.22s ease",
            flexShrink: 0,
          }}
        >
          <feature.Icon />
        </div>

        <span
          className="card-tag"
          style={{
            fontSize: "9px", color: "#3f3f46",
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase", letterSpacing: "0.08em",
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "2px 7px", borderRadius: "3px",
            transition: "all 0.22s ease",
          }}
        >
          {feature.tag}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: "18px", fontWeight: 700, color: "#d4d4d8",
        marginBottom: "8px", letterSpacing: "-0.3px",
        fontFamily: "'Playfair Display', Georgia, serif",
      }}>
        {feature.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: "12px", lineHeight: 1.65, color: "#d4d4d8",
        fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
      }}>
        {feature.description}
      </p>

      {/* Preview */}
      {feature.preview(hovered)}

      {/* Corner glow */}
      <div style={{
        position: "absolute", top: "-30px", right: "-30px",
        width: "100px", height: "100px",
        background: hovered
          ? "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
        transition: "background 0.3s ease",
        pointerEvents: "none",
      }} />

      {/* Bottom index */}
      <div style={{
        position: "absolute", bottom: "14px", right: "16px",
        fontSize: "9px", color: "#27272a",
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.06em",
      }}>
        0{index + 1}
      </div>
    </div>
  );
}