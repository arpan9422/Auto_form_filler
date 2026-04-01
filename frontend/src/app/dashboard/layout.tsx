export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0b0b0c' }}>
      {children}
    </div>
  );
}
