"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const text = "#e2e8f0";
const muted = "#64748b";
const border = "#2a3347";
const bgCard = "#161b27";

type DashData = {
  kpis: {
    totalUsers: number; newSignupsToday: number; newSignupsThisWeek: number;
    activeUsersToday: number; formsFilledToday: number; creditsUsedToday: number; totalRevenueINR: number;
  };
  charts: {
    dailySignups: { day: string; count: number }[];
    dailyForms: { day: string; count: number }[];
    topSites: { platform: string; _count: { id: number } }[];
  };
  recentSignups: { id: string; firstName: string; lastName: string; email: string; createdAt: string; credits: number }[];
};

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent style={{ padding: "20px 24px" }}>
        <div style={{ fontSize: "11px", color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{label}</div>
        <div style={{ fontSize: "28px", fontWeight: 700, color: text, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: "12px", color: muted, marginTop: "6px" }}>{sub}</div>}
      </CardContent>
    </Card>
  );
}

const tooltipStyle = { background: bgCard, border: `1px solid ${border}`, borderRadius: "6px", fontSize: "12px", color: text };

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DashData>("/admin/dashboard").then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: text, marginBottom: "24px" }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[...Array(6)].map((_, i) => <Skeleton key={i} style={{ height: "90px" }} />)}
      </div>
    </div>
  );

  const k = data!.kpis;

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: text, marginBottom: "24px" }}>Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <KpiCard label="Total Users" value={k.totalUsers} />
        <KpiCard label="New Today" value={k.newSignupsToday} sub={`${k.newSignupsThisWeek} this week`} />
        <KpiCard label="Active Today" value={k.activeUsersToday} />
        <KpiCard label="Forms Today" value={k.formsFilledToday} />
        <KpiCard label="Credits Used Today" value={k.creditsUsedToday} />
        <KpiCard label="Total Revenue" value={`₹${k.totalRevenueINR.toLocaleString()}`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <Card>
          <CardHeader><CardTitle>Daily Signups (7d)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data!.charts.dailySignups}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Daily Forms (7d)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data!.charts.dailyForms}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Signups</CardTitle></CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data!.recentSignups.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${border}` }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: text }}>{u.firstName} {u.lastName}</div>
                  <div style={{ fontSize: "12px", color: muted, marginTop: "2px" }}>{u.email}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: muted }}>{new Date(u.createdAt).toLocaleDateString()}</div>
                  <div style={{ fontSize: "12px", color: "#818cf8", marginTop: "2px" }}>{u.credits} credits</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
