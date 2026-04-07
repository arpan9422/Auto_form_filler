"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API, setToken } from "@/lib/utils";

const bg = "#0f1117";
const bgCard = "#161b27";
const border = "#2a3347";
const text = "#e2e8f0";
const muted = "#64748b";
const amber = "#f59e0b";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle: React.CSSProperties = {
    display: "block", width: "100%", height: "40px", padding: "0 12px",
    borderRadius: "6px", border: `1px solid ${border}`,
    background: bg, color: text, fontSize: "14px", outline: "none",
    marginTop: "6px",
  };

  const btnStyle: React.CSSProperties = {
    display: "block", width: "100%", height: "40px",
    borderRadius: "6px", border: "none",
    background: amber, color: "#0f1117",
    fontSize: "14px", fontWeight: 700, cursor: "pointer",
    marginTop: "16px",
  };

  const sendOtp = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/admin/auth/otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Email not found"); }
      setStep("otp");
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/admin/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Invalid OTP"); }
      const data = await r.json() as { token: string };
      setToken(data.token);
      router.push("/dashboard");
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "380px", background: bgCard, border: `1px solid ${border}`, borderRadius: "12px", padding: "36px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: text, marginBottom: "4px" }}>
            Form<span style={{ color: amber }}>Pilot</span>
          </div>
          <div style={{ fontSize: "13px", color: muted }}>
            {step === "email" ? "Sign in to Admin Portal" : `OTP sent to ${email}`}
          </div>
        </div>

        {step === "email" ? (
          <>
            <label style={{ fontSize: "12px", fontWeight: 500, color: muted }}>Admin Email</label>
            <input style={inputStyle} type="email" placeholder="admin@formpilot.app"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendOtp()} />
            {error && <p style={{ fontSize: "12px", color: "#f87171", marginTop: "8px" }}>{error}</p>}
            <button style={{ ...btnStyle, opacity: !email || loading ? 0.5 : 1 }}
              onClick={sendOtp} disabled={!email || loading}>
              {loading ? "Sending…" : "Send OTP →"}
            </button>
          </>
        ) : (
          <>
            <label style={{ fontSize: "12px", fontWeight: 500, color: muted }}>One-Time Password</label>
            <input style={{ ...inputStyle, letterSpacing: "0.2em", fontSize: "20px", textAlign: "center" }}
              type="text" placeholder="000000" maxLength={6}
              value={otp} onChange={e => setOtp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && verify()} />
            {error && <p style={{ fontSize: "12px", color: "#f87171", marginTop: "8px" }}>{error}</p>}
            <button style={{ ...btnStyle, opacity: otp.length !== 6 || loading ? 0.5 : 1 }}
              onClick={verify} disabled={otp.length !== 6 || loading}>
              {loading ? "Verifying…" : "Login →"}
            </button>
            <button style={{ display: "block", width: "100%", marginTop: "10px", background: "transparent", border: "none", color: muted, fontSize: "12px", cursor: "pointer" }}
              onClick={() => { setStep("email"); setOtp(""); setError(""); }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
