"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import Image from "next/image";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#" },
];

export default function Navbar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDashboardRoute = pathname.startsWith("/dashboard");

  useEffect(() => {
    if (isDashboardRoute) {
      return;
    }

    gsap.fromTo(
      navRef.current,
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.2 }
    );

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDashboardRoute]);

  if (isDashboardRoute) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.3; transform:scale(1.8); }
        }

        .nav-link {
          color: #52525b;
          text-decoration: none;
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 500;
          transition: color 0.2s ease;
          position: relative;
          padding-bottom: 2px;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 0;
          height: 1px;
          background: #f59e0b;
          transition: width 0.2s ease;
        }
        .nav-link:hover {
          color: #a1a1aa !important;
        }
        .nav-link:hover::after {
          width: 100%;
        }

        .login-link {
          color: #3f3f46;
          text-decoration: none;
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 400;
          transition: color 0.2s ease;
        }
        .login-link:hover {
          color: #71717a;
        }

        .nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f59e0b;
          color: #0b0b0c;
          padding: 7px 16px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 2px solid #f59e0b;
          transition: all 0.18s ease;
        }
        .nav-cta:hover {
          transform: translateY(-1px) rotate(-0.4deg);
          box-shadow: 4px 4px 0 rgba(245,158,11,0.35);
        }

        .hamburger-btn {
          display: none;
          background: none;
          border: none;
          color: #a1a1aa;
          font-size: 24px;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .hamburger-btn:hover {
          color: #f0ece4;
        }

        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          
          .hamburger-btn {
            display: block;
          }

          .mobile-menu {
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            background: rgba(11,11,12,0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            z-index: 999;
            max-height: calc(100vh - 64px);
            overflow-y: auto;
          }

          .mobile-menu.hidden {
            display: none;
          }

          .mobile-menu .nav-link {
            font-size: 13px;
            padding: 8px 0;
          }

          .mobile-menu .login-link {
            font-size: 13px;
            padding: 8px 0;
          }

          .mobile-menu .nav-cta {
            width: 100%;
            justify-content: center;
            padding: 10px 16px;
            font-size: 12px;
          }

          .mobile-menu-divider {
            height: 1px;
            background: rgba(255,255,255,0.05);
          }
        }

        @media (min-width: 769px) {
          .mobile-menu {
            display: none !important;
          }
        }
      `}} />

      <nav
        ref={navRef}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          padding: "0 clamp(16px, 4vw, 40px)",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
          background: scrolled ? "rgba(11,11,12,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid transparent",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <Image className="invert" src="/logo.png" alt="FormPilot Logo" width={28} height={28} />
          <span style={{
            fontSize: "clamp(14px, 3vw, 17px)",
            fontWeight: 800,
            color: "#f0ece4",
            letterSpacing: "-0.5px",
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

        {/* Desktop Nav Links */}
        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side — Desktop (hidden during coming soon) */}
        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Auth links hidden — uncomment when launching
          <a href="/auth" className="login-link">Log in</a>
          <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.06)" }} />
          <a href="#" className="nav-cta">⚡ Install · Free</a>
          */}
        </div>

        {/* Hamburger button — Mobile */}
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${!mobileMenuOpen ? "hidden" : ""}`}>
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}

        <div className="mobile-menu-divider" />

        {/* Auth links hidden — uncomment when launching
        <a href="/auth" className="login-link">Log in</a>
        <a href="#" className="nav-cta">⚡ Install · Free</a>
        */}
      </div>
    </>
  );
}
