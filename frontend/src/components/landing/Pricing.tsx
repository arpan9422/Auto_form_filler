"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: "Free Weekly",
    price: "Free",
    period: "",
    description: "Start with weekly free credits before buying any top-up pack.",
    features: [
      "3 free credits every week",
      "Wallet and transaction history",
      "Credit usage analytics",
      "Referral rewards access",
      "Buy extra credits anytime",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "50 Credits",
    price: "INR 99",
    period: "",
    description: "A light top-up for occasional applications and quick refinements.",
    features: [
      "One-time wallet top-up",
      "Great for form fill bursts",
      "Works with refine and regenerate",
      "No subscription required",
      "Credits stay in your wallet",
    ],
    cta: "Buy 50 Credits",
    popular: false,
  },
  {
    name: "120 Credits",
    price: "INR 199",
    period: "",
    description: "The most popular pack for active job seekers and regular daily use.",
    features: [
      "Better value per top-up",
      "Ideal for repeated form filling",
      "Supports resume parsing too",
      "No recurring billing pressure",
      "Best balance of cost and usage",
    ],
    cta: "Buy 120 Credits",
    popular: true,
  },
  {
    name: "350 Credits",
    price: "INR 499",
    period: "",
    description: "A bigger balance for heavy usage during high-volume application seasons.",
    features: [
      "Largest top-up pack",
      "Strongest value for power users",
      "Covers fill, refine, and regenerate",
      "Keeps your wallet funded longer",
      "Good fit for high-volume usage",
    ],
    cta: "Buy 350 Credits",
    popular: false,
  },
];

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const noiseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.to(noiseRef.current, {
      x: 8,
      y: 6,
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.fromTo(
      headingRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
      }
    );

    const cards = cardsRef.current?.querySelectorAll(".pricing-card");
    if (cards) {
      gsap.fromTo(
        cards,
        { y: 60, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: cardsRef.current, start: "top 85%" },
        }
      );
    }
  }, []);

  return (
    <section
      id="pricing"
      ref={sectionRef}
      style={{
        position: "relative",
        padding: "clamp(60px, 10vw, 120px) 24px clamp(60px, 10vw, 140px)",
        background: "#0b0b0c",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.3; transform:scale(1.8); }
        }

        @media (hover: hover) {
          .pricing-card-hover:hover {
            transform: translateY(-5px) rotate(-0.3deg) !important;
            border-color: rgba(255,255,255,0.12) !important;
          }

          .pricing-card-popular:hover {
            transform: translateY(-5px) rotate(-0.3deg) !important;
            box-shadow: 6px 6px 0 #f59e0b, 0 32px 80px rgba(0,0,0,0.7) !important;
          }
        }

        .cta-primary-pricing {
          transition: all 0.2s ease;
        }

        .cta-primary-pricing:hover {
          transform: translateY(-2px) rotate(-0.5deg);
          box-shadow: 4px 4px 0 rgba(245,158,11,0.5) !important;
        }

        .cta-secondary-pricing {
          transition: all 0.2s ease;
        }

        .cta-secondary-pricing:hover {
          background: rgba(255,255,255,0.05) !important;
        }
      `,
        }}
      />

      <div
        ref={noiseRef}
        style={{
          position: "absolute",
          inset: "-40px",
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.028,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px 180px",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "60px",
          right: "8%",
          zIndex: 0,
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "100px",
          left: "5%",
          zIndex: 0,
          width: "380px",
          height: "240px",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "48px",
          left: "40px",
          zIndex: 1,
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          color: "rgba(255,255,255,0.1)",
          letterSpacing: "0.1em",
          writingMode: "vertical-rl",
          textTransform: "uppercase",
        }}
      >
        section-03
      </div>

      <div style={{ maxWidth: "1180px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div ref={headingRef} style={{ textAlign: "center", marginBottom: "80px", opacity: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 14px 4px 8px",
              borderRadius: "4px",
              border: "1px solid rgba(245,158,11,0.25)",
              background: "rgba(245,158,11,0.05)",
              fontSize: "11px",
              fontWeight: 500,
              color: "#d97706",
              marginBottom: "28px",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.04em",
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
            Credits
          </div>

          <h2
            style={{
              fontSize: "clamp(28px, 6vw, 64px)",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-2px",
              color: "#f0ece4",
              maxWidth: "700px",
              margin: "0 auto 20px",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Simple,{" "}
            <em
              style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              wallet pricing.
            </em>
          </h2>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <svg width="200" height="12" viewBox="0 0 200 12" fill="none">
              <path d="M4 9 C35 3, 75 11, 110 7 C145 3, 178 10, 196 6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55" />
              <path d="M18 11 C55 5, 95 12, 130 8 C162 4, 188 10, 198 8" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.25" />
            </svg>
          </div>

          <p
            style={{
              fontSize: "clamp(14px, 3vw, 17px)",
              lineHeight: 1.7,
              color: "#71717a",
              maxWidth: "520px",
              margin: "0 auto",
              fontWeight: 300,
            }}
          >
            Start with free weekly credits, then top up only when you need more.{" "}
            <span style={{ color: "#a1a1aa", fontStyle: "italic" }}>No subscription lock-in.</span>
          </p>
        </div>

        <div
          ref={cardsRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "clamp(16px, 2vw, 20px)",
            alignItems: "start",
          }}
        >
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`pricing-card ${plan.popular ? "pricing-card-popular" : "pricing-card-hover"}`}
              style={{
                background: plan.popular ? "#111114" : "#0e0e11",
                borderRadius: "4px",
                border: plan.popular ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(255,255,255,0.06)",
                padding: "clamp(24px, 5vw, 36px) clamp(20px, 4vw, 32px)",
                opacity: 0,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.25s ease",
                boxShadow: plan.popular
                  ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "0 8px 32px rgba(0,0,0,0.4)",
                transform: plan.popular ? "scale(1.02)" : "scale(1)",
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px 4px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(245,158,11,0.35)",
                    background: "rgba(245,158,11,0.08)",
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "#d97706",
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      background: "#f59e0b",
                      animation: "heroPulse 2.5s infinite",
                      display: "inline-block",
                    }}
                  />
                  Popular
                </div>
              )}

              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: "-60px",
                    right: "-60px",
                    width: "180px",
                    height: "180px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
                    filter: "blur(30px)",
                    pointerEvents: "none",
                  }}
                />
              )}

              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "#52525b",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                {plan.name}
              </div>

              <div style={{ marginBottom: "8px", display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span
                  style={{
                    fontSize: "48px",
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: "-2px",
                    color: "#f0ece4",
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#52525b",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {plan.period}
                  </span>
                )}
              </div>

              <p
                style={{
                  fontSize: "14px",
                  color: "#71717a",
                  marginBottom: "28px",
                  lineHeight: 1.6,
                  fontWeight: 300,
                }}
              >
                {plan.description}
              </p>

              <div
                style={{
                  width: "100%",
                  height: "1px",
                  background: "rgba(255,255,255,0.05)",
                  marginBottom: "24px",
                }}
              />

              <ul style={{ listStyle: "none", marginBottom: "32px", padding: 0 }}>
                {plan.features.map((feature, j) => (
                  <li
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      marginBottom: "12px",
                      fontSize: "13px",
                      color: "#71717a",
                      fontWeight: 300,
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        color: plan.popular ? "#f59e0b" : "#52525b",
                        fontSize: "12px",
                        flexShrink: 0,
                        marginTop: "2px",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      +
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={plan.popular ? "cta-primary-pricing" : "cta-secondary-pricing"}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "4px",
                  border: plan.popular ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.08)",
                  background: plan.popular ? "#f59e0b" : "transparent",
                  color: plan.popular ? "#0b0b0c" : "#a1a1aa",
                  fontSize: "13px",
                  fontWeight: plan.popular ? 700 : 400,
                  cursor: "pointer",
                  fontFamily: plan.popular ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
                  letterSpacing: plan.popular ? "0.04em" : "0",
                  textTransform: plan.popular ? "uppercase" : "none",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "52px",
            fontFamily: "'Playfair Display', serif",
            fontSize: "18px",
            fontStyle: "italic",
            color: "rgba(240,236,228,0.25)",
            letterSpacing: "-0.3px",
          }}
        >
          &ldquo;I only pay when I need more credits. That feels fair.&rdquo;
        </div>

        <div
          style={{
            marginTop: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "20px 0",
          }}
        >
          {[
            { value: "3", label: "Free weekly credits" },
            { value: "INR 199", label: "Most popular pack" },
            { value: "10", label: "Referral credits" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "0 40px",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#f0ece4",
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: "-0.5px",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#52525b",
                  marginTop: "3px",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
