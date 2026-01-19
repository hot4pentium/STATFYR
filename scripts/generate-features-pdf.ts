import { jsPDF } from 'jspdf';
import * as fs from 'fs';

const doc = new jsPDF();

// Colors
const ORANGE = [249, 115, 22] as [number, number, number];
const DARK_BG = [20, 20, 30] as [number, number, number];
const COACH_COLOR = [59, 130, 246] as [number, number, number];
const ATHLETE_COLOR = [34, 197, 94] as [number, number, number];
const SUPPORTER_COLOR = [168, 85, 247] as [number, number, number];

// Header
doc.setFillColor(...DARK_BG);
doc.rect(0, 0, 210, 35, 'F');

doc.setFontSize(24);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...ORANGE);
doc.text('STATFYR', 105, 18, { align: 'center' });

doc.setFontSize(11);
doc.setTextColor(255, 255, 255);
doc.text('Dashboard Features by Role & Tier', 105, 28, { align: 'center' });

let y = 45;

interface DashboardCard {
  name: string;
  freeDesc: string;
  proDesc: string;
  proOnly?: boolean;
}

function drawRoleSection(
  title: string, 
  subtitle: string,
  color: [number, number, number],
  cards: DashboardCard[]
) {
  // Role header
  doc.setFillColor(...color);
  doc.roundedRect(15, y, 180, 12, 2, 2, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, 20, y + 8);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(subtitle, 195, y + 8, { align: 'right' });
  
  y += 16;
  
  // Column headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('DASHBOARD CARD', 20, y);
  doc.text('FREE TIER', 95, y);
  doc.text('PRO TIER', 155, y);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, y + 2, 195, y + 2);
  
  y += 6;
  
  // Cards
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  
  cards.forEach((card) => {
    // Card name
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(card.name, 20, y);
    
    // Free tier description
    doc.setFont('helvetica', 'normal');
    if (card.proOnly) {
      doc.setTextColor(180, 180, 180);
      doc.text('—', 95, y);
    } else {
      doc.setTextColor(60, 60, 60);
      const freeLines = doc.splitTextToSize(card.freeDesc, 55);
      doc.text(freeLines, 95, y);
    }
    
    // Pro tier description
    doc.setTextColor(60, 60, 60);
    const proLines = doc.splitTextToSize(card.proDesc, 55);
    doc.text(proLines, 155, y);
    
    const maxLines = Math.max(
      card.proOnly ? 1 : doc.splitTextToSize(card.freeDesc, 55).length,
      proLines.length
    );
    y += Math.max(6, maxLines * 3.5);
  });
  
  y += 4;
}

// COACH SECTION
drawRoleSection('COACH', '$7.99/mo Pro', COACH_COLOR, [
  {
    name: 'Team Overview',
    freeDesc: 'View team name, roster count, upcoming events',
    proDesc: 'Full analytics, season records, performance trends'
  },
  {
    name: 'Roster Management',
    freeDesc: 'Add/remove players, assign positions, invite via team code',
    proDesc: 'Advanced role permissions, staff management'
  },
  {
    name: 'Events & Schedule',
    freeDesc: 'Create games/practices, basic calendar view',
    proDesc: 'Recurring events, notifications, reminders'
  },
  {
    name: 'StatTracker',
    freeDesc: 'Live game stats, team mode tracking',
    proDesc: 'Individual mode, advanced metrics, stat history export'
  },
  {
    name: 'PlayMaker & Playbook',
    freeDesc: '—',
    proDesc: 'Create plays with canvas editor, organize playbook, share with team',
    proOnly: true
  },
  {
    name: 'Team Chat',
    freeDesc: 'Basic team messaging',
    proDesc: 'Announcements, file sharing, pinned messages'
  },
  {
    name: 'Season Management',
    freeDesc: 'Start/end seasons, archive data',
    proDesc: 'Season comparison, historical analytics, export reports'
  }
]);

// Check if we need a new page
if (y > 200) {
  doc.addPage();
  y = 20;
}

// ATHLETE SECTION
drawRoleSection('ATHLETE', '$2.99/mo Pro', ATHLETE_COLOR, [
  {
    name: 'My Dashboard',
    freeDesc: 'View upcoming events, team announcements',
    proDesc: 'Performance insights, goal tracking, HYPE score display'
  },
  {
    name: 'Profile Card',
    freeDesc: 'Name, position, jersey number, team',
    proDesc: 'Height, weight, GPA, grad year, handedness, favorites'
  },
  {
    name: 'HYPE Card',
    freeDesc: 'View your HYPE card (not shareable)',
    proDesc: 'Shareable link, QR code, custom themes, social sharing'
  },
  {
    name: 'Stats Display',
    freeDesc: 'View personal game stats recorded by coach',
    proDesc: 'Career totals, averages, visual charts, stat comparisons'
  },
  {
    name: 'Video Highlights',
    freeDesc: '—',
    proDesc: 'Upload game clips, organize by event, share on HYPE card',
    proOnly: true
  },
  {
    name: 'Achievement Badges',
    freeDesc: '—',
    proDesc: 'Earn and display badges for milestones and achievements',
    proOnly: true
  },
  {
    name: 'Team Features',
    freeDesc: 'View playbook, calendar, chat with team',
    proDesc: 'All free features plus priority notifications'
  }
]);

// Check if we need a new page
if (y > 200) {
  doc.addPage();
  y = 20;
}

// SUPPORTER SECTION
drawRoleSection('SUPPORTER', '$5.99/mo Pro', SUPPORTER_COLOR, [
  {
    name: 'Supporter Hub',
    freeDesc: 'View followed athletes, team schedule',
    proDesc: 'Multi-athlete dashboard, cross-team following'
  },
  {
    name: 'Game Day Live',
    freeDesc: 'Tap to cheer, view HYPE score, shoutouts',
    proDesc: 'Unlimited taps, priority shoutouts, live notifications'
  },
  {
    name: 'Athlete HYPE Cards',
    freeDesc: 'View HYPE cards of followed athletes',
    proDesc: 'View highlights, stats, share cards'
  },
  {
    name: 'Manage Athletes',
    freeDesc: '—',
    proDesc: 'Add independent athletes, track their stats, manage seasons',
    proOnly: true
  },
  {
    name: 'Badge Gallery & Themes',
    freeDesc: 'View earned supporter badges',
    proDesc: 'Unlock exclusive themes, display badges on profile'
  },
  {
    name: 'Season History',
    freeDesc: '—',
    proDesc: 'View archived seasons for managed athletes, compare years',
    proOnly: true
  },
  {
    name: 'Notifications',
    freeDesc: 'Basic game reminders',
    proDesc: 'HYPE posts, stat updates, custom alerts'
  }
]);

// Footer
doc.addPage();
y = 20;

// Why STATFYR section
doc.setFillColor(...DARK_BG);
doc.roundedRect(15, y, 180, 50, 3, 3, 'F');

doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.setTextColor(...ORANGE);
doc.text('Why Choose STATFYR?', 105, y + 12, { align: 'center' });

doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.setTextColor(255, 255, 255);

const benefits = [
  'One platform for coaches, athletes, and supporters',
  'Real-time game tracking and live engagement',
  'Beautiful shareable HYPE cards for athletes',
  'Season management with historical data archiving',
  'Native iOS & Android apps with push notifications'
];

benefits.forEach((benefit, i) => {
  doc.setTextColor(...ORANGE);
  doc.text('\u2713', 30, y + 22 + (i * 6));
  doc.setTextColor(255, 255, 255);
  doc.text(benefit, 38, y + 22 + (i * 6));
});

y += 60;

// Pricing summary
doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.setTextColor(80, 80, 80);
doc.text('Simple Pricing - Upgrade When Ready', 105, y, { align: 'center' });

y += 10;

// Pricing boxes
const pricingData = [
  { role: 'Coach Pro', price: '$7.99/mo', color: COACH_COLOR },
  { role: 'Athlete Pro', price: '$2.99/mo', color: ATHLETE_COLOR },
  { role: 'Supporter Pro', price: '$5.99/mo', color: SUPPORTER_COLOR }
];

const boxWidth = 55;
const startX = 25;

pricingData.forEach((item, i) => {
  const x = startX + (i * 62);
  
  doc.setFillColor(...item.color);
  doc.roundedRect(x, y, boxWidth, 25, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(item.role, x + boxWidth/2, y + 10, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(item.price, x + boxWidth/2, y + 20, { align: 'center' });
});

y += 35;

// Free tier note
doc.setFontSize(9);
doc.setFont('helvetica', 'italic');
doc.setTextColor(100, 100, 100);
doc.text('All roles include a FREE tier with essential features. Upgrade anytime to unlock Pro capabilities.', 105, y, { align: 'center' });

y += 15;

// Call to action
doc.setFillColor(...ORANGE);
doc.roundedRect(55, y, 100, 18, 3, 3, 'F');

doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.setTextColor(255, 255, 255);
doc.text('Get Started Free Today!', 105, y + 12, { align: 'center' });

y += 30;

// Footer
doc.setFontSize(8);
doc.setTextColor(150, 150, 150);
doc.text('STATFYR - Sports Stats & Team Management', 105, y, { align: 'center' });
doc.text('www.statfyr.com', 105, y + 5, { align: 'center' });

// Save
const pdfOutput = doc.output('arraybuffer');
fs.writeFileSync('client/public/statfyr-features.pdf', Buffer.from(pdfOutput));
console.log('PDF generated: client/public/statfyr-features.pdf');
