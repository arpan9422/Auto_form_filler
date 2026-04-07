"use client";
import React from "react";

// ── Design tokens ──────────────────────────────────────────────────────
const t = {
  bg: "#0f1117",
  bgCard: "#161b27",
  bgHover: "#1e2535",
  border: "#2a3347",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textSub: "#94a3b8",
  primary: "#f8fafc",
  primaryFg: "#0f172a",
  amber: "#f59e0b",
  indigo: "#6366f1",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  radius: "8px",
  radiusSm: "6px",
};

// ── Card ──────────────────────────────────────────────────────────────
export function Card({ style, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: t.radius, ...style }} {...p}>
      {children}
    </div>
  );
}
export function CardHeader({ style, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div style={{ padding: "20px 24px 0", ...style }} {...p}>{children}</div>;
}
export function CardTitle({ style, children, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 style={{ fontSize: "15px", fontWeight: 600, color: t.text, margin: 0, ...style }} {...p}>{children}</h3>;
}
export function CardContent({ style, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div style={{ padding: "16px 24px 24px", ...style }} {...p}>{children}</div>;
}

// ── Button ────────────────────────────────────────────────────────────
type BtnVariant = "default" | "destructive" | "outline" | "ghost" | "secondary";
const btnStyles: Record<BtnVariant, React.CSSProperties> = {
  default:     { background: t.primary, color: t.primaryFg, border: "none" },
  destructive: { background: t.red, color: "#fff", border: "none" },
  outline:     { background: "transparent", color: t.text, border: `1px solid ${t.border}` },
  ghost:       { background: "transparent", color: t.textSub, border: "none" },
  secondary:   { background: t.bgHover, color: t.text, border: `1px solid ${t.border}` },
};

export function Button({
  style, variant = "default", disabled, children, ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
        height: "36px", padding: "0 14px", borderRadius: t.radiusSm,
        fontSize: "13px", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "opacity .15s",
        ...btnStyles[variant], ...style,
      }}
      {...p}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────
export function Input({ style, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      style={{
        display: "block", width: "100%", height: "36px",
        padding: "0 12px", borderRadius: t.radiusSm,
        border: `1px solid ${t.border}`, background: t.bg,
        color: t.text, fontSize: "13px", outline: "none",
        ...style,
      }}
      {...p}
    />
  );
}

// ── Label ─────────────────────────────────────────────────────────────
export function Label({ style, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label style={{ fontSize: "12px", fontWeight: 500, color: t.textSub, ...style }} {...p} />;
}

// ── Badge ─────────────────────────────────────────────────────────────
type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";
const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  default:     { background: "rgba(99,102,241,0.15)", color: "#818cf8" },
  secondary:   { background: t.bgHover, color: t.textSub },
  destructive: { background: "rgba(239,68,68,0.15)", color: "#f87171" },
  outline:     { background: "transparent", color: t.textSub, border: `1px solid ${t.border}` },
  success:     { background: "rgba(34,197,94,0.15)", color: "#4ade80" },
};

export function Badge({ style, variant = "default", ...p }: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: "999px",
      fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
      ...badgeStyles[variant], ...style,
    }} {...p} />
  );
}

// ── Table ─────────────────────────────────────────────────────────────
export function Table({ style, ...p }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", ...style }} {...p} />
    </div>
  );
}
export function TableHeader(p: React.HTMLAttributes<HTMLTableSectionElement>) { return <thead {...p} />; }
export function TableBody(p: React.HTMLAttributes<HTMLTableSectionElement>) { return <tbody {...p} />; }
export function TableRow({ style, ...p }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr style={{ borderBottom: `1px solid ${t.border}`, ...style }} {...p} />;
}
export function TableHead({ style, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", ...style }} {...p} />;
}
export function TableCell({ style, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td style={{ padding: "12px 16px", color: t.text, verticalAlign: "middle", ...style }} {...p} />;
}

// ── Separator ─────────────────────────────────────────────────────────
export function Separator({ style, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div style={{ height: "1px", background: t.border, ...style }} {...p} />;
}

// ── Skeleton ──────────────────────────────────────────────────────────
export function Skeleton({ style, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{
      background: `linear-gradient(90deg, ${t.bgCard} 25%, ${t.bgHover} 50%, ${t.bgCard} 75%)`,
      backgroundSize: "400px 100%",
      animation: "shimmer 1.4s ease-in-out infinite",
      borderRadius: t.radiusSm,
      ...style,
    }} {...p} />
  );
}
