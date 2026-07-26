"use client";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For trying FormPilot on everyday forms.",
    features: ["Local profile setup", "One-click autofill", "Chat refinement"],
  },
  {
    name: "Pro",
    price: "$9",
    description: "For frequent applications and repeated workflows.",
    features: ["Unlimited saved context", "RAG-backed answers", "Priority refinements"],
    highlighted: true,
  },
  {
    name: "Team",
    price: "Custom",
    description: "For shared workflows, templates, and admin controls.",
    features: ["Shared answer library", "Team analytics", "Centralized controls"],
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      style={{
        background: "#0b0b0c",
        padding: "clamp(60px, 10vw, 120px) 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <span
            style={{
              display: "inline-flex",
              border: "1px solid rgba(245,158,11,0.25)",
              background: "rgba(245,158,11,0.05)",
              borderRadius: "4px",
              color: "#d97706",
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.08em",
              padding: "5px 12px",
              textTransform: "uppercase",
            }}
          >
            Pricing
          </span>
          <h2
            style={{
              color: "#f0ece4",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(30px, 6vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-1px",
              lineHeight: 1.05,
              margin: "22px auto 14px",
              maxWidth: "640px",
            }}
          >
            Start free. Upgrade when forms become your workflow.
          </h2>
          <p
            style={{
              color: "#71717a",
              fontSize: "16px",
              lineHeight: 1.7,
              margin: "0 auto",
              maxWidth: "460px",
            }}
          >
            Pick the plan that fits how often you need accurate, reusable autofill context.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {plans.map((plan) => (
            <article
              key={plan.name}
              style={{
                background: plan.highlighted ? "rgba(245,158,11,0.06)" : "#111114",
                border: plan.highlighted
                  ? "1px solid rgba(245,158,11,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                boxShadow: plan.highlighted
                  ? "0 24px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "none",
                padding: "28px",
              }}
            >
              <div
                style={{
                  color: plan.highlighted ? "#fbbf24" : "#d4d4d8",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  marginBottom: "16px",
                  textTransform: "uppercase",
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  color: "#f0ece4",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "42px",
                  fontWeight: 800,
                  lineHeight: 1,
                  marginBottom: "12px",
                }}
              >
                {plan.price}
              </div>
              <p style={{ color: "#71717a", fontSize: "14px", lineHeight: 1.65, marginBottom: "24px" }}>
                {plan.description}
              </p>
              <ul style={{ display: "grid", gap: "10px", listStyle: "none", margin: 0, padding: 0 }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      color: "#a1a1aa",
                      display: "flex",
                      fontSize: "13px",
                      gap: "9px",
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: "#d97706", fontFamily: "'DM Mono', monospace" }}>+</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
