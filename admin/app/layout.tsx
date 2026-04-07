import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Form Pilot Admin",
  description: "Admin portal for Form Pilot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @keyframes shimmer {
            0%   { background-position: -400px 0; }
            100% { background-position:  400px 0; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0f1117; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
          a { text-decoration: none; }
          button { font-family: inherit; }
          input, select, textarea { font-family: inherit; }
          select { appearance: none; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
