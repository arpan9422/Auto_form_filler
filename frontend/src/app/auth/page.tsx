"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import api, { ApiError } from "@/lib/api";
import { setAuthTokens } from "@/lib/auth";
import { getCurrentUser } from "@/lib/currentUser";

type View = "login" | "signup" | "otp";
type OtpFlow = "login" | "signup";

export default function AuthPage() {
    const router = useRouter();
    const [view, setView] = useState<View>("login");
    const [otpFlow, setOtpFlow] = useState<OtpFlow>("login");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [referralCode, setReferralCode] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const cardRef = useRef<HTMLDivElement>(null);
    const noiseRef = useRef<HTMLDivElement>(null);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        gsap.to(noiseRef.current, {
            x: 8, y: 6, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut",
        });
        gsap.fromTo(cardRef.current,
            { y: 40, opacity: 0, scale: 0.97 },
            { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out", delay: 0.1 }
        );
    }, []);

    // Animate card on view change
    useEffect(() => {
        if (!cardRef.current) return;
        gsap.fromTo(cardRef.current,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }
        );
    }, [view]);

    const splitName = (fullName: string) => {
        const trimmed = fullName.trim();
        const parts = trimmed.split(/\s+/).filter(Boolean);

        return {
            firstName: parts[0] ?? "",
            lastName: parts.slice(1).join(" ") || parts[0] || "",
        };
    };

    type AuthTokensResponse = {
        accessToken: string;
        refreshToken?: string;
    };

    const getErrorMessage = (error: unknown) => {
        const apiError = error as ApiError;

        return (
            apiError.data?.error ||
            apiError.data?.message ||
            apiError.message ||
            "Something went wrong. Please try again."
        );
    };

    const handleOtpChange = (val: string, idx: number) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...otp];
        next[idx] = val.slice(-1);
        setOtp(next);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
        if (e.key === "Backspace" && !otp[idx] && idx > 0) {
            otpRefs.current[idx - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(""));
            otpRefs.current[5]?.focus();
        }
        e.preventDefault();
    };

    const handleSubmit = async () => {
        if (!email.trim()) {
            setErrorMessage("Please enter your email.");
            return;
        }

        if (view === "signup" && !name.trim()) {
            setErrorMessage("Please enter your full name.");
            return;
        }

        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (view === "signup") {
                await api.post("/auth/signup/otp", {
                    email: email.trim(),
                });
                setOtpFlow("signup");
                setView("otp");
                setSuccessMessage("We sent a signup OTP to your email.");
            } else {
                await api.post("/auth/login/otp", {
                    email: email.trim(),
                });
                setOtpFlow("login");
                setView("otp");
                setSuccessMessage("We sent a login OTP to your email.");
            }
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async () => {
        if (otp.join("").length < 6) {
            setShake(true);
            gsap.fromTo(cardRef.current,
                { x: -8 },
                { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)", clearProps: "x" }
            );
            setTimeout(() => setShake(false), 500);
            return;
        }

        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const otpCode = otp.join("");

            if (otpFlow === "signup") {
                const parsedName = splitName(name);
                const response = await api.post<AuthTokensResponse>("/auth/signup", {
                    email: email.trim(),
                    otp: otpCode,
                    firstName: parsedName.firstName,
                    lastName: parsedName.lastName,
                    referralCode: referralCode.trim() || undefined,
                });

                setAuthTokens(response.data.accessToken, response.data.refreshToken);
            } else {
                const response = await api.post<AuthTokensResponse>("/auth/login", {
                    email: email.trim(),
                    otp: otpCode,
                });

                setAuthTokens(response.data.accessToken, response.data.refreshToken);
            }

            const currentUser = await getCurrentUser();

            setLoading(false);
            router.push(currentUser.onboardingDone ? "/dashboard" : "/onboarding");
        } catch (error) {
            setLoading(false);
            setErrorMessage(getErrorMessage(error));
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (otpFlow === "signup") {
                await api.post("/auth/signup/otp", {
                    email: email.trim(),
                });
                setSuccessMessage("A new signup OTP has been sent.");
            } else {
                await api.post("/auth/login/otp", {
                    email: email.trim(),
                });
                setSuccessMessage("A new login OTP has been sent.");
            }
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (field: string): React.CSSProperties => ({
        width: "100%",
        background: focusedField === field ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)",
        border: focusedField === field
            ? "1px solid rgba(245,158,11,0.35)"
            : "1px solid rgba(255,255,255,0.07)",
        borderRadius: "4px",
        padding: "11px 14px",
        fontSize: "13px",
        color: "#f0ece4",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 300,
        outline: "none",
        transition: "all 0.2s ease",
        boxSizing: "border-box",
    });

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: "10px",
        fontWeight: 500,
        color: "#3f3f46",
        marginBottom: "6px",
        fontFamily: "'DM Mono', monospace",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0b0b0c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes heroPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.3; transform:scale(1.8); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0e0e11 inset !important;
          -webkit-text-fill-color: #f0ece4 !important;
          caret-color: #f59e0b;
        }
        .auth-submit {
          transition: all 0.2s ease;
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px) rotate(-0.4deg);
          box-shadow: 4px 4px 0 rgba(245,158,11,0.4);
        }
        .auth-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .switch-link {
          color: #d97706;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: color 0.15s ease;
          text-decoration: none;
          border-bottom: 1px solid rgba(245,158,11,0.25);
          padding-bottom: 1px;
        }
        .switch-link:hover { color: #f59e0b; border-color: rgba(245,158,11,0.6); }

        .otp-input {
          width: 44px !important;
          height: 52px;
          text-align: center;
          font-size: 20px !important;
          font-weight: 700 !important;
          font-family: 'Playfair Display', serif !important;
          color: #f0ece4 !important;
          caret-color: #f59e0b;
          background: rgba(255,255,255,0.02) !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 4px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .otp-input:focus {
          border-color: rgba(245,158,11,0.4) !important;
          background: rgba(245,158,11,0.04) !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.06);
        }
        .otp-input.filled {
          border-color: rgba(245,158,11,0.3) !important;
          color: #f59e0b !important;
        }
      `}} />

            {/* Noise texture */}
            <div ref={noiseRef} style={{
                position: "absolute", inset: "-40px", zIndex: 0, pointerEvents: "none", opacity: 0.028,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundSize: "180px 180px",
            }} />

            {/* Dot grid */}
            <div style={{
                position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)`,
                backgroundSize: "36px 36px",
                maskImage: "radial-gradient(ellipse 75% 75% at 50% 50%, black 20%, transparent 100%)",
            }} />

            {/* Amber glow */}
            <div style={{
                position: "absolute", top: "10%", right: "15%", zIndex: 0,
                width: "300px", height: "300px", borderRadius: "50%",
                background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)",
                filter: "blur(60px)", pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", bottom: "15%", left: "10%", zIndex: 0,
                width: "360px", height: "240px",
                background: "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 70%)",
                filter: "blur(70px)", pointerEvents: "none",
            }} />

            {/* Version label */}
            <div style={{
                position: "absolute", top: "32px", left: "40px", zIndex: 1,
                fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.1)",
                letterSpacing: "0.1em", writingMode: "vertical-rl", textTransform: "uppercase",
            }}>
                v0.9.1-beta · 2026
            </div>

            {/* Card */}
            <div ref={cardRef} style={{
                width: "100%",
                maxWidth: "420px",
                background: "#111114",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)",
                overflow: "hidden",
                position: "relative",
                zIndex: 1,
                opacity: 0,
            }}>
                {/* Card inner noise */}
                <div style={{
                    position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.015,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundSize: "180px 180px",
                }} />

                {/* Amber top glow inside card */}
                <div style={{
                    position: "absolute", top: "-60px", left: "50%",
                    transform: "translateX(-50%)",
                    width: "300px", height: "160px",
                    background: "radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)",
                    filter: "blur(30px)", pointerEvents: "none", zIndex: 0,
                }} />

                {/* Card title bar */}
                <div style={{
                    display: "flex", alignItems: "center", padding: "14px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: "#0e0e11", gap: "10px", position: "relative", zIndex: 1,
                }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e" }} />
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
                    </div>
                    <div style={{
                        flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: "4px",
                        padding: "3px 10px", fontSize: "11px", color: "#52525b",
                        textAlign: "center", fontFamily: "'DM Mono', monospace",
                    }}>
                        formpilot.app/{view === "otp" ? "verify" : view}
                    </div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        borderRadius: "4px", padding: "3px 10px",
                    }}>
                        <span style={{ fontSize: "10px" }}>⚡</span>
                        <span style={{
                            fontSize: "9px", color: "#d97706", fontWeight: 600,
                            fontFamily: "'DM Mono', monospace", textTransform: "uppercase",
                            letterSpacing: "0.04em",
                        }}>FormPilot</span>
                    </div>
                </div>

                {/* Card body */}
                <div style={{ padding: "36px 36px 32px", position: "relative", zIndex: 1 }}>

                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" }}>
                        <div style={{
                            width: "26px", height: "26px", borderRadius: "4px",
                            background: "rgba(245,158,11,0.08)",
                            border: "1px solid rgba(245,158,11,0.25)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "13px",
                        }}>⚡</div>
                        <span style={{
                            fontSize: "16px", fontWeight: 800,
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

                    {(errorMessage || successMessage) && (
                        <div style={{
                            marginBottom: "20px",
                            padding: "12px 14px",
                            borderRadius: "4px",
                            border: errorMessage
                                ? "1px solid rgba(248,113,113,0.22)"
                                : "1px solid rgba(52,211,153,0.2)",
                            background: errorMessage
                                ? "rgba(248,113,113,0.05)"
                                : "rgba(52,211,153,0.05)",
                        }}>
                            <p style={{
                                margin: 0,
                                fontSize: "13px",
                                color: errorMessage ? "#fca5a5" : "#6ee7b7",
                                fontWeight: 300,
                                lineHeight: 1.6,
                            }}>
                                {errorMessage || successMessage}
                            </p>
                        </div>
                    )}

                    {/* ── LOGIN VIEW ── */}
                    {view === "login" && (
                        <>
                            <h1 style={{
                                fontSize: "28px", fontWeight: 800, lineHeight: 1.1,
                                letterSpacing: "-1px", color: "#f0ece4", marginBottom: "6px",
                                fontFamily: "'Playfair Display', Georgia, serif",
                            }}>
                                Welcome back.
                            </h1>
                            <p style={{
                                fontSize: "14px", color: "#52525b", marginBottom: "28px",
                                fontWeight: 300,
                            }}>
                                Enter your email and we will send you a one-time login code.
                            </p>

                            <div style={{ marginBottom: "16px" }}>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField("email")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{ ...inputStyle("email"), caretColor: "#f59e0b" }}
                                />
                            </div>

                            <div style={{ marginBottom: "24px" }}>
                                <p style={{
                                    fontSize: "12px",
                                    color: "#71717a",
                                    margin: 0,
                                    fontWeight: 300,
                                    lineHeight: 1.6,
                                }}>
                                    We use email OTP for sign in, so you do not need a password here.
                                </p>
                            </div>

                            <button
                                className="auth-submit"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{
                                    width: "100%", padding: "12px",
                                    background: loading ? "rgba(245,158,11,0.6)" : "#f59e0b",
                                    color: "#0b0b0c", border: "2px solid #f59e0b",
                                    borderRadius: "4px", fontSize: "13px", fontWeight: 700,
                                    fontFamily: "'DM Mono', monospace",
                                    letterSpacing: "0.04em", textTransform: "uppercase",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                }}
                            >
                                {loading
                                    ? <span style={{ width: "14px", height: "14px", border: "2px solid rgba(11,11,12,0.3)", borderTopColor: "#0b0b0c", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                    : "Send Login OTP →"}
                            </button>

                            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "24px 0" }} />

                            <p style={{ textAlign: "center", fontSize: "13px", color: "#52525b", fontWeight: 300 }}>
                                No account?&ensp;
                                <span className="switch-link" onClick={() => setView("signup")}>Create one</span>
                            </p>
                        </>
                    )}

                    {/* ── SIGNUP VIEW ── */}
                    {view === "signup" && (
                        <>
                            <h1 style={{
                                fontSize: "28px", fontWeight: 800, lineHeight: 1.1,
                                letterSpacing: "-1px", color: "#f0ece4", marginBottom: "6px",
                                fontFamily: "'Playfair Display', Georgia, serif",
                            }}>
                                Create account.
                            </h1>
                            <p style={{
                                fontSize: "14px", color: "#52525b", marginBottom: "28px",
                                fontWeight: 300,
                            }}>
                                Create your account, then verify it with a one-time code from your email.
                            </p>

                            <div style={{ marginBottom: "16px" }}>
                                <label style={labelStyle}>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Arpan Sharma"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onFocus={() => setFocusedField("name")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{ ...inputStyle("name"), caretColor: "#f59e0b" }}
                                />
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setFocusedField("email")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{ ...inputStyle("email"), caretColor: "#f59e0b" }}
                                />
                            </div>

                            <div style={{ marginBottom: "24px" }}>
                                <label style={labelStyle}>Referral Code (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="FRIEND123"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                    onFocus={() => setFocusedField("referralCode")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{ ...inputStyle("referralCode"), caretColor: "#f59e0b" }}
                                />
                            </div>

                            <button
                                className="auth-submit"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{
                                    width: "100%", padding: "12px",
                                    background: loading ? "rgba(245,158,11,0.6)" : "#f59e0b",
                                    color: "#0b0b0c", border: "2px solid #f59e0b",
                                    borderRadius: "4px", fontSize: "13px", fontWeight: 700,
                                    fontFamily: "'DM Mono', monospace",
                                    letterSpacing: "0.04em", textTransform: "uppercase",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                }}
                            >
                                {loading
                                    ? <span style={{ width: "14px", height: "14px", border: "2px solid rgba(11,11,12,0.3)", borderTopColor: "#0b0b0c", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                    : "Send Signup OTP →"}
                            </button>

                            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "24px 0" }} />

                            <p style={{ textAlign: "center", fontSize: "13px", color: "#52525b", fontWeight: 300 }}>
                                Already have an account?&ensp;
                                <span className="switch-link" onClick={() => setView("login")}>Sign in</span>
                            </p>
                        </>
                    )}

                    {/* ── OTP VIEW ── */}
                    {view === "otp" && (
                        <>
                            {/* Badge */}
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: "8px",
                                padding: "4px 14px 4px 8px", borderRadius: "4px",
                                border: "1px solid rgba(245,158,11,0.25)",
                                background: "rgba(245,158,11,0.05)",
                                fontSize: "11px", fontWeight: 500, color: "#d97706",
                                marginBottom: "20px",
                                fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
                                textTransform: "uppercase",
                            }}>
                                <span style={{
                                    width: "5px", height: "5px", borderRadius: "50%",
                                    background: "#f59e0b", animation: "heroPulse 2.5s infinite",
                                    display: "inline-block",
                                }} />
                                Check your inbox
                            </div>

                            <h1 style={{
                                fontSize: "28px", fontWeight: 800, lineHeight: 1.1,
                                letterSpacing: "-1px", color: "#f0ece4", marginBottom: "6px",
                                fontFamily: "'Playfair Display', Georgia, serif",
                            }}>
                                Verify {otpFlow === "signup" ? "signup" : "login"}.
                            </h1>
                            <p style={{
                                fontSize: "14px", color: "#52525b", marginBottom: "32px",
                                fontWeight: 300, lineHeight: 1.6,
                            }}>
                                We sent a 6-digit code to{" "}
                                <span style={{ color: "#a1a1aa", fontStyle: "italic" }}>
                                    {email || "your email"}
                                </span>
                            </p>

                            {/* OTP inputs */}
                            <div style={{
                                display: "flex", gap: "8px", justifyContent: "center",
                                marginBottom: "28px",
                            }}
                                onPaste={handleOtpPaste}
                            >
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { otpRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, i)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                                        className={`otp-input${digit ? " filled" : ""}`}
                                    />
                                ))}
                            </div>

                            {/* Ink underline decoration */}
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
                                <svg width="160" height="10" viewBox="0 0 160 10" fill="none">
                                    <path d="M4 7 C28 2, 60 9, 90 5 C118 2, 144 8, 156 5"
                                        stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
                                </svg>
                            </div>

                            <button
                                className="auth-submit"
                                onClick={handleOtpVerify}
                                disabled={loading}
                                style={{
                                    width: "100%", padding: "12px",
                                    background: loading ? "rgba(245,158,11,0.6)" : "#f59e0b",
                                    color: "#0b0b0c", border: "2px solid #f59e0b",
                                    borderRadius: "4px", fontSize: "13px", fontWeight: 700,
                                    fontFamily: "'DM Mono', monospace",
                                    letterSpacing: "0.04em", textTransform: "uppercase",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                }}
                            >
                                {loading
                                    ? <span style={{ width: "14px", height: "14px", border: "2px solid rgba(11,11,12,0.3)", borderTopColor: "#0b0b0c", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                    : "Verify Code →"}
                            </button>

                            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "24px 0" }} />

                            <p style={{ textAlign: "center", fontSize: "13px", color: "#52525b", fontWeight: 300 }}>
                                Didn't receive it?&ensp;
                                <span className="switch-link" onClick={handleResendOtp}>Resend code</span>
                                &ensp;·&ensp;
                                <span className="switch-link" onClick={() => setView(otpFlow)}>Go back</span>
                            </p>
                        </>
                    )}

                    {/* Bottom watermark */}
                    <div style={{
                        marginTop: "24px", textAlign: "center",
                        fontFamily: "'DM Mono', monospace", fontSize: "10px",
                        color: "rgba(255,255,255,0.08)",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                        Secure · Encrypted · Private
                    </div>
                </div>
            </div>
        </div>
    );
}
