'use client';

// Shared skeleton styles injected once — import this in any dashboard component
export const SKELETON_CSS = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  .sk {
    border-radius: 4px;
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.04) 25%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.04) 75%
    );
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
`;

export function SkeletonBlock({ w = '100%', h = '16px', mb = '0', radius = '4px' }: {
  w?: string; h?: string; mb?: string; radius?: string;
}) {
  return (
    <div className="sk" style={{ width: w, height: h, marginBottom: mb, borderRadius: radius }} />
  );
}

export function SkeletonCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', padding: '24px' }}>
      {children}
    </div>
  );
}
