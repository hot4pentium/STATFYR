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
      <div className="fixed inset-0 z-0 opacity-0 dark:opacity-100 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] dark:opacity-5" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100 pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100 pointer-events-none" />
    </>
  );
}
