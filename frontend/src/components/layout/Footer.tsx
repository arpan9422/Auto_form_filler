"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/pricing" },
        { label: "Changelog", href: "#" },
        { label: "Docs", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms & Conditions", href: "/terms" },
        { label: "Refund Policy", href: "/refunds" },
        { label: "Shipping Policy", href: "/shipping" },
      ],
    },
  ];

  return (
    <footer style={{
      position: "relative",
      background: "#0b0b0c",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        .footer-link {
          font-size: clamp(12px, 2vw, 13px);
          color: #3f3f46;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          transition: color 0.2s ease;
          position: relative;
          display: inline-block;
          padding-bottom: 1px;
        }
        .footer-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 1px;
          background: #f59e0b;
          transition: width 0.2s ease;
        }
        .footer-link:hover { color: #a1a1aa !important; }
        .footer-link:hover::after { width: 100%; }

        .footer-social {
          font-size: clamp(10px, 2vw, 11px);
          color: #3f3f46;
          text-decoration: none;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          transition: color 0.2s ease;
        }
        .footer-social:hover { color: #a1a1aa; }

        @media (max-width: 768px) {
          .footer-link {
            font-size: 13px;
          }
        }
      `}} />

      {/* Dot grid — same as all sections */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
        maskImage: "radial-gradient(ellipse 90% 100% at 50% 100%, black 20%, transparent 100%)",
      }} />

      {/* Amber bottom-center glow */}
      <div style={{
        position: "absolute", bottom: "-60px", left: "50%",
        transform: "translateX(-50%)",
        width: "500px", height: "200px",
        background: "radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: "1100px", margin: "0 auto",
        padding: "clamp(40px, 8vw, 64px) 24px 0",
        position: "relative", zIndex: 1,
      }}>

        {/* Main grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "clamp(32px, 5vw, 48px)",
          marginBottom: "clamp(40px, 8vw, 56px)",
        }}>

          {/* Brand column */}
          <div>
            {/* Logo — matches Navbar exactly */}
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "20px" }}>
              <Image className="invert" src="/logo.png" alt="FormPilot Logo" width={28} height={28} />
              <span style={{
                fontSize: "clamp(14px, 3vw, 17px)", fontWeight: 800,
                color: "#f0ece4", letterSpacing: "-0.5px",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                Form<em style={{
                  fontStyle: "italic",
                  background: "linear-gradient(135deg, #f59e0b 0%, #fde68a 55%, #f59e0b 100%)",
                  backgroundSize: "200% 200%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>Pilot</em>
              </span>
            </div>

            <p style={{
              fontSize: "clamp(13px, 2vw, 14px)", color: "#52525b", lineHeight: 1.7,
              maxWidth: "260px", fontWeight: 300,
            }}>
              AI that actually does the work.
            </p>
            <p style={{
              fontSize: "clamp(13px, 2vw, 14px)", lineHeight: 1.7,
              maxWidth: "260px", fontWeight: 300,
              fontStyle: "italic", color: "#3f3f46",
            }}>
              Fill. Refine. Done.
            </p>

            {/* Version mono label */}
            <div style={{
              marginTop: "24px",
              fontFamily: "'DM Mono', monospace", fontSize: "clamp(9px, 2vw, 10px)",
              color: "rgba(255,255,255,0.1)",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              v0.9.1-beta · 2026
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 style={{
                fontSize: "clamp(9px, 2vw, 10px)", fontWeight: 500,
                color: "#3f3f46", marginBottom: "20px",
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontFamily: "'DM Mono', monospace",
              }}>
                {col.title}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map((link) => (
                  <li key={link.label} style={{ marginBottom: "12px" }}>
                    <Link href={link.href} className="footer-link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "clamp(16px, 4vw, 24px) 0 clamp(20px, 4vw, 32px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(16px, 3vw, 24px)",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <p style={{
            fontSize: "11px", color: "#3f3f46",
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase", letterSpacing: "0.07em",
            margin: 0,
          }}>
            © 2026 FormPilot. All rights reserved.
          </p>

          <div style={{ display: "flex", gap: "clamp(16px, 4vw, 24px)", alignItems: "center", flexWrap: "wrap" }}>
            {["Twitter", "GitHub", "Discord"].map((social, i) => (
              <span key={social} style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 4vw, 24px)" }}>
                <a href="#" className="footer-social">{social}</a>
                {i < 2 && (
                  <span style={{
                    width: "1px", height: "12px",
                    background: "rgba(255,255,255,0.06)",
                    display: "inline-block",
                  }} />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}