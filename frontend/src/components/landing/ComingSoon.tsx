"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
import Image from "next/image";

const comingSoonStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Mono:wght@400;500&display=swap');

  @keyframes heroPulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.3; transform:scale(1.8); }
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
`;

export default function ComingSoon() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = wrapRef.current?.querySelectorAll(".cs-anim");
    if (els) {
      gsap.fromTo(
        els,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }
  }, []);


  return (
    <section
      style={{
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
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: comingSoonStyles }} />

      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 100%)",
        }}
      />

      <div
        ref={wrapRef}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "600px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          className="cs-anim"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "48px",
          }}
        >
          <Image className="invert" src="/logo.png" alt="FormPilot" width={32} height={32} />
          <span
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#f0ece4",
              letterSpacing: "-0.5px",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Form
            <em
              style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg,#f59e0b,#fde68a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Pilot
            </em>
          </span>
        </div>

        <div
          className="cs-anim"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 14px 4px 8px",
            borderRadius: "4px",
            border: "1px solid rgba(245,158,11,0.25)",
            background: "rgba(245,158,11,0.05)",
            fontSize: "11px",
            color: "#d97706",
            marginBottom: "28px",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#f59e0b",
              animation: "heroPulse 2.5s infinite",
              display: "inline-block",
            }}
          />
          Coming Soon
        </div>

        <h1
          className="cs-anim"
          style={{
            fontSize: "clamp(40px, 7vw, 72px)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-2.5px",
            color: "#f0ece4",
            margin: "0 0 20px",
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Your Form{" "}
          <em
            style={{
              fontStyle: "italic",
              background:
                "linear-gradient(135deg,#f59e0b 0%,#fde68a 55%,#f59e0b 100%)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Copilot
          </em>
          <br />
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontStyle: "normal",
              fontWeight: 300,
              fontSize: "clamp(22px, 4vw, 40px)",
              color: "rgba(240,236,228,0.4)",
              letterSpacing: "-1px",
            }}
          >
            is almost here.
          </span>
        </h1>

        <p
          className="cs-anim"
          style={{
            fontSize: "16px",
            color: "#71717a",
            fontWeight: 300,
            lineHeight: 1.75,
            maxWidth: "460px",
            margin: "0 auto 40px",
          }}
        >
          Fill any form instantly with AI. No copy-paste. No tabs.{" "}
          <span style={{ color: "#a1a1aa", fontStyle: "italic" }}>Just done.</span>
        </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Link href="/dashboard">
              <button className="cs-btn" style={{ borderRadius: "4px" }}>
                Get Started
              </button>
            </Link>
          </div>

        <div
          className="cs-anim"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            justifyContent: "center",
            marginBottom: "48px",
          }}
        >
          {["AI Form Filling", "Resume Context", "Works Everywhere"].map((feature) => (
            <span key={feature} className="cs-chip">
              {feature}
            </span>
          ))}
        </div>

        <div
          className="cs-anim"
          style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "32px" }}
        />

        <p
          className="cs-anim"
          style={{
            fontSize: "12px",
            color: "#3f3f46",
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: ".07em",
          }}
        >
          100% Free and Open Source
        </p>
      </div>
    </section>
  );
}
