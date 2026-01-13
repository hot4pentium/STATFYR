export function DashboardBackground() {
  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none dashboard-bg" />
      {/* Noise texture overlay - light mode only */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.35] dark:opacity-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px',
        }}
      />
    </>
  );
}
