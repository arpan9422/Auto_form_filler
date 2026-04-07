"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Receipt, Activity, Globe, Brain, GitBranch, FileText, LogOut, Shield, Mail } from "lucide-react";
import { removeToken } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",           label: "Dashboard",     icon: LayoutDashboard },
  { href: "/dashboard/users",     label: "Users",         icon: Users },
  { href: "/dashboard/credits",   label: "Credits",       icon: CreditCard },
  { href: "/dashboard/payments",  label: "Payments",      icon: Receipt },
  { href: "/dashboard/forms",     label: "Form Activity", icon: Activity },
  { href: "/dashboard/domains",   label: "Domains",       icon: Globe },
  { href: "/dashboard/ai",        label: "AI Usage",      icon: Brain },
  { href: "/dashboard/referrals", label: "Referrals",     icon: GitBranch },
  { href: "/dashboard/logs",      label: "Logs",          icon: FileText },
  { href: "/dashboard/email",     label: "Email",         icon: Mail },
  { href: "/dashboard/admins",    label: "Admins",        icon: Shield },
];

const bg = "#0f1117";
const bgCard = "#161b27";
const border = "#2a3347";
const text = "#e2e8f0";
const muted = "#64748b";
const amber = "#f59e0b";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside style={{
      width: "220px", flexShrink: 0,
      background: bgCard, borderRight: `1px solid ${border}`,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${border}` }}>
        <div style={{ fontSize: "18px", fontWeight: 800, color: text, letterSpacing: "-0.5px" }}>
          Form<span style={{ color: amber }}>Pilot</span>
        </div>
        <div style={{ fontSize: "11px", color: muted, marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Admin Portal
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "9px 12px", borderRadius: "6px", marginBottom: "2px",
              fontSize: "13px", fontWeight: active ? 600 : 400,
              color: active ? "#fff" : muted,
              background: active ? "rgba(99,102,241,0.2)" : "transparent",
              textDecoration: "none", transition: "all .15s",
              borderLeft: active ? "2px solid #6366f1" : "2px solid transparent",
            }}>
              <Icon size={15} style={{ color: active ? "#818cf8" : muted, flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px", borderTop: `1px solid ${border}` }}>
        <button
          onClick={() => { removeToken(); router.push("/login"); }}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            width: "100%", padding: "9px 12px", borderRadius: "6px",
            fontSize: "13px", color: muted, background: "transparent",
            border: "none", cursor: "pointer", transition: "all .15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = muted; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  );
}
