export function DashboardBackground() {
  return (
    <>
      <div 
        className="fixed inset-0 z-0 opacity-40 dark:opacity-0 pointer-events-none bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100"
      />
      <div 
        className="fixed inset-0 z-0 opacity-20 dark:opacity-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      <div className="fixed inset-0 z-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-black via-zinc-900 to-black" />
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
