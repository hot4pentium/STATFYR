import lightBgImage from '@assets/white-honeycomb_1766286409745.png';

export function DashboardBackground() {
  return (
    <>
      <div 
        className="fixed inset-0 z-0 opacity-60 dark:opacity-0 pointer-events-none"
        style={{
          backgroundImage: `url(${lightBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 z-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-black via-zinc-900 to-black" />
      {/* Use inline SVG pattern instead of external URL for iOS Safari compatibility */}
      <div 
        className="fixed inset-0 z-0 opacity-0 dark:opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Cpath fill='%23ffffff' fill-opacity='0.4' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100 pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100 pointer-events-none" />
    </>
  );
}
