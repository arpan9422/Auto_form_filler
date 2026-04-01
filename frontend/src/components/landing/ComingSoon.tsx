"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";

export default function ComingSoon() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const els = wrapRef.current?.querySelectorAll(".cs-anim");
    if (els) {
      gsap.fromTo(els,
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out", delay: 0.2 }
      );
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section style={{
      minHeight: "100vh",
      background: "#0b0b0c",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 24px 60px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.3; transform:scale(1.8); }
        }
        @keyframes slowDrift {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-12px) rotate(0.5deg); }
        }

        .cs-input {
          flex: 1;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px 0 0 4px;
          padding: 12px 16px;
          font-size: 14px;
          color: #f0ece4;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          outline: none;
          transition: border-color .2s, background .2s;
          caret-color: #f59e0b;
          min-width: 0;
        }
        .cs-input::placeholder { color: #3f3f46; }
        .cs-input:focus {
          border-color: rgba(245,158,11,0.4);
          background: rgba(245,158,11,0.03);
        }
        .cs-btn {
          padding: 12px 22px;
          background: #f59e0b;
          color: #0b0b0c;
          border: 2px solid #f59e0b;
          border-radius: 0 4px 4px 0;
          font-size: 12px;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: .06em;
          cursor: pointer;
          transition: all .18s;
          white-space: nowrap;
        }
        .cs-btn:hover {
          transform: translateY(-1px);
          box-shadow: 3px 3px 0 rgba(245,158,11,0.35);
        }
        .cs-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          font-size: 11px;
          color: #52525b;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: .06em;
        }
      `}</style>

      {/* Background glows */}
      <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "400px", background: "radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />

      {/* Dot grid */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "36px 36px", maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 100%)" }} />

      <div ref={wrapRef} style={{ position: "relative", zIndex: 1, maxWidth: "600px", width: "100%", textAlign: "center" }}>

        {/* Logo */}
        <div className="cs-anim" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "48px" }}>
          <Image className="invert" src="/logo.png" alt="FormPilot" width={32} height={32} />
          <span style={{ fontSize: "22px", fontWeight: 800, color: "#f0ece4", letterSpacing: "-0.5px", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Form<em style={{ fontStyle: "italic", background: "linear-gradient(135deg,#f59e0b,#fde68a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pilot</em>
          </span>
        </div>

        {/* Status badge */}
        <div className="cs-anim" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 14px 4px 8px", borderRadius: "4px", border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)", fontSize: "11px", color: "#d97706", marginBottom: "28px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f59e0b", animation: "heroPulse 2.5s infinite", display: "inline-block" }} />
          Coming Soon
        </div>

        {/* Heading */}
        <h1 className="cs-anim" style={{ fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-2.5px", color: "#f0ece4", margin: "0 0 20px", fontFamily: "'Playfair Display', Georgia, serif" }}>
          Your Form{" "}
          <em style={{ fontStyle: "italic", background: "linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Copilot
          </em>
          <br />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontStyle: "normal", fontWeight: 300, fontSize: "clamp(22px, 4vw, 40px)", color: "rgba(240,236,228,0.4)", letterSpacing: "-1px" }}>
            is almost here.
          </span>
        </h1>

        {/* Subtext */}
        <p className="cs-anim" style={{ fontSize: "16px", color: "#71717a", fontWeight: 300, lineHeight: 1.75, marginBottom: "40px", maxWidth: "460px", margin: "0 auto 40px" }}>
          Fill any form instantly with AI. Refine answers via chat. No copy-paste. No tabs.{" "}
          <span style={{ color: "#a1a1aa", fontStyle: "italic" }}>Just done.</span>
        </p>

        {/* Email capture */}
        <div className="cs-anim" style={{ marginBottom: "32px" }}>
          {!submitted ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", maxWidth: "440px", margin: "0 auto" }}>
              <input
                type="email"
                className="cs-input"
                placeholder="Enter your email for early access"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required
              />
              <button type="submit" className="cs-btn">
                Notify Me
              </button>
            </form>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 24px", borderRadius: "4px", border: "1px solid rgba(52,211,153,0.25)", background: "rgba(52,211,153,0.05)" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
              <span style={{ fontSize: "14px", color: "#34d399", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: ".05em" }}>
                You&apos;re on the list ✓
              </span>
            </div>
          )}
          <p style={{ fontSize: "11px", color: "#3f3f46", marginTop: "10px", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: ".06em" }}>
            No spam. Early access only.
          </p>
        </div>

        {/* Feature chips */}
        <div className="cs-anim" style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "48px" }}>
          {["AI Form Filling", "Chat Refinement", "Resume Context", "Works Everywhere"].map(f => (
            <span key={f} className="cs-chip">{f}</span>
          ))}
        </div>

        {/* Divider */}
        <div className="cs-anim" style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "32px" }} />

        {/* Bottom note */}
        <p className="cs-anim" style={{ fontSize: "12px", color: "#3f3f46", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: ".07em" }}>
          Free to start · No credit card required
        </p>
      </div>
    </section>
  );
}
