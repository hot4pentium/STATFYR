import darkBgImage from '@assets/generated_images/abstract_sports_tactical_background.png';
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
      <div 
        className="fixed inset-0 z-0 opacity-0 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url(${darkBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 dark:opacity-100 pointer-events-none" />
    </>
  );
}
