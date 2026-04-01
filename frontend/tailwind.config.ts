import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0b0c",
        surface: "#111113",
        accent: "#6366f1",
        "text-primary": "#e5e7eb",
        "text-secondary": "#9ca3af",
        "text-muted": "#6b7280",
        "border-subtle": "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "SF Pro", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "16px",
        button: "10px",
        code: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
