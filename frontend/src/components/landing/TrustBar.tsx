"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const brands = [
  "LinkedIn", "Naukri", "Indeed", "Glassdoor", "AngelList",
  "Lever", "Greenhouse", "Workday", "Notion", "Google Forms",
];

export default function TrustBar() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = containerRef.current?.querySelectorAll(".trust-item");
    if (!items) return;

    gsap.fromTo(
      items,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.07,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
        },
      }
    );
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Playfair+Display:ital,wght@1,700&display=swap');

        .trust-item {
          opacity: 0;
          cursor: default;
          transition: color 0.2s ease;
          position: relative;
        }
        .trust-item:hover {
          color: #f0ece4 !important;
        }
        .trust-item:hover .trust-dot {
          background: #f59e0b !important;
          box-shadow: 0 0 6px rgba(245,158,11,0.5);
        }
      `}} />

      <section
        ref={containerRef}
        style={{
          padding: "clamp(40px, 8vw, 52px) 24px",
          backgroundColor: "#0b0b0c",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle amber glow left */}
        <div style={{
          position: "absolute", top: "50%", left: "-60px",
          transform: "translateY(-50%)",
          width: "200px", height: "200px",
          background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)",
          filter: "blur(30px)", pointerEvents: "none",
        }} />

        {/* Label */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "12px", marginBottom: "32px",
        }}>
          <div style={{
            height: "1px", width: "40px",
            background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08))",
          }} />
          <p style={{
            textAlign: "center",
            fontSize: "10px",
            fontWeight: 500,
            color: "#3f3f46",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontFamily: "'DM Mono', monospace",
            margin: 0,
          }}>
            Works with every form platform
          </p>
          <div style={{
            height: "1px", width: "40px",
            background: "linear-gradient(to left, transparent, rgba(255,255,255,0.08))",
          }} />
        </div>

        {/* Brands */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px 0",
          flexWrap: "wrap",
          maxWidth: "860px",
          margin: "0 auto",
          rowGap: "14px",
        }}>
          {brands.map((brand, i) => (
            <span
              key={brand}
              className="trust-item"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#3f3f46",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}>
                {brand}
              </span>

              {/* Separator dot — hide after last */}
              {i < brands.length - 1 && (
                <span
                  className="trust-dot"
                  style={{
                    display: "inline-block",
                    width: "3px", height: "3px",
                    borderRadius: "50%",
                    background: "#27272a",
                    transition: "background 0.2s ease, box-shadow 0.2s ease",
                    flexShrink: 0,
                    margin: "0 14px 0 0",
                  }}
                />
              )}
            </span>
          ))}
        </div>

        {/* Bottom note */}

      </section>
    </>
  );
}