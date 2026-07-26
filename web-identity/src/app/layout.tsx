import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "FormPilot Web Identity — AI Form Filler Product Showcase",
  description: "FormPilot is an intelligent form auto-completion product powered by LangGraph, RAG vector memory, and Chrome Manifest V3 extension.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#0b0b0c",
          color: "#f0ece4",
          fontFamily: "'DM Sans', sans-serif",
          WebkitFontSmoothing: "antialiased",
          overflowX: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}
