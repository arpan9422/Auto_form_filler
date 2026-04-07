"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getToken } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0f1117" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: "#0f1117" }}>
        {children}
      </main>
    </div>
  );
}
