export interface TeamBadge {
  id: string;
  label: string;
  svg: string;
}

export const TEAM_BADGES: TeamBadge[] = [
  {
    id: "shield-classic",
    label: "Classic Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 14V38C8 54 32 76 32 76C32 76 56 54 56 38V14L32 4Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <path d="M32 12L14 20V38C14 50 32 68 32 68C32 68 50 50 50 38V20L32 12Z" fill="var(--badge-inner, white)" opacity="0.2"/>
    </svg>`
  },
  {
    id: "shield-pointed",
    label: "Pointed Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 12V36C8 52 32 76 32 76C32 76 56 52 56 36V12L32 4Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <path d="M32 76V4" stroke="var(--badge-inner, white)" stroke-width="2" opacity="0.3"/>
      <path d="M8 12H56" stroke="var(--badge-inner, white)" stroke-width="2" opacity="0.3"/>
    </svg>`
  },
  {
    id: "shield-banner",
    label: "Banner Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 8H56V60L32 72L8 60V8Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="14" width="36" height="8" fill="var(--badge-inner, white)" opacity="0.3"/>
      <path d="M32 30L38 42H26L32 30Z" fill="var(--badge-inner, white)" opacity="0.3"/>
    </svg>`
  },
  {
    id: "shield-crest",
    label: "Royal Crest",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L6 16V44C6 58 32 76 32 76C32 76 58 58 58 44V16L32 4Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <circle cx="32" cy="36" r="12" fill="var(--badge-inner, white)" opacity="0.2"/>
      <path d="M32 24L35 32H43L37 38L39 46L32 42L25 46L27 38L21 32H29L32 24Z" fill="var(--badge-inner, white)" opacity="0.4"/>
    </svg>`
  },
  {
    id: "shield-diamond",
    label: "Diamond Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 20V48L32 76L56 48V20L32 4Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <path d="M32 16L20 28V44L32 60L44 44V28L32 16Z" fill="var(--badge-inner, white)" opacity="0.2"/>
    </svg>`
  },
  {
    id: "shield-chevron",
    label: "Chevron Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 14V42C8 56 32 76 32 76C32 76 56 56 56 42V14L32 4Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <path d="M16 24L32 40L48 24" stroke="var(--badge-inner, white)" stroke-width="4" opacity="0.4" stroke-linecap="round"/>
      <path d="M16 36L32 52L48 36" stroke="var(--badge-inner, white)" stroke-width="4" opacity="0.3" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: "shield-stripe",
    label: "Striped Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 14V42C8 56 32 76 32 76C32 76 56 56 56 42V14L32 4Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <path d="M20 4V76" stroke="var(--badge-inner, white)" stroke-width="6" opacity="0.3"/>
      <path d="M44 4V76" stroke="var(--badge-inner, white)" stroke-width="6" opacity="0.3"/>
    </svg>`
  },
  {
    id: "shield-emblem",
    label: "Emblem Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 2L4 14V44C4 60 32 78 32 78C32 78 60 60 60 44V14L32 2Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <circle cx="32" cy="38" r="16" stroke="var(--badge-inner, white)" stroke-width="3" opacity="0.4" fill="none"/>
      <circle cx="32" cy="38" r="8" fill="var(--badge-inner, white)" opacity="0.3"/>
    </svg>`
  },
  {
    id: "shield-wing",
    label: "Winged Shield",
    svg: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 8L20 16V40C20 52 40 72 40 72C40 72 60 52 60 40V16L40 8Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <path d="M20 24C12 20 4 24 4 24C4 24 8 40 20 44" stroke="currentColor" stroke-width="2" fill="currentColor" opacity="0.6"/>
      <path d="M60 24C68 20 76 24 76 24C76 24 72 40 60 44" stroke="currentColor" stroke-width="2" fill="currentColor" opacity="0.6"/>
      <path d="M40 20V56" stroke="var(--badge-inner, white)" stroke-width="2" opacity="0.3"/>
    </svg>`
  },
  {
    id: "shield-cross",
    label: "Cross Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 14V42C8 56 32 76 32 76C32 76 56 56 56 42V14L32 4Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <rect x="28" y="16" width="8" height="44" fill="var(--badge-inner, white)" opacity="0.4"/>
      <rect x="16" y="28" width="32" height="8" fill="var(--badge-inner, white)" opacity="0.4"/>
    </svg>`
  },
  {
    id: "shield-crown",
    label: "Crown Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 12L8 22V46C8 58 32 76 32 76C32 76 56 58 56 46V22L32 12Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <path d="M20 4L24 12H40L44 4L48 12L40 8H24L16 12L20 4Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
      <path d="M32 28L36 36H44L38 42L40 50L32 46L24 50L26 42L20 36H28L32 28Z" fill="var(--badge-inner, white)" opacity="0.3"/>
    </svg>`
  },
  {
    id: "shield-simple",
    label: "Simple Shield",
    svg: `<svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L8 14V42C8 56 32 76 32 76C32 76 56 56 56 42V14L32 4Z" fill="currentColor" stroke="currentColor" stroke-width="2"/>
    </svg>`
  }
];

export function getBadgeById(id: string): TeamBadge | undefined {
  return TEAM_BADGES.find(badge => badge.id === id);
}
