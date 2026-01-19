import { jsPDF } from 'jspdf';
import * as fs from 'fs';

const doc = new jsPDF();

// Header with branding
doc.setFillColor(20, 20, 30);
doc.rect(0, 0, 210, 40, 'F');

doc.setFontSize(28);
doc.setFont('helvetica', 'bold');
doc.setTextColor(255, 140, 50);
doc.text('STATFYR', 105, 20, { align: 'center' });

doc.setFontSize(12);
doc.setTextColor(255, 255, 255);
doc.text('Sports Stats & Team Management', 105, 30, { align: 'center' });

// Tagline
doc.setFontSize(14);
doc.setTextColor(60, 60, 60);
doc.setFont('helvetica', 'italic');
doc.text('Empower Your Team. Elevate Every Athlete.', 105, 52, { align: 'center' });

let y = 65;

function drawTierCard(title: string, price: string, tagline: string, freeFeatures: string[], proFeatures: string[], color: [number, number, number], accentColor: [number, number, number]) {
  const startY = y;
  const lineHeight = 5.5;
  const maxFeatures = Math.max(freeFeatures.length, proFeatures.length);
  const boxHeight = 38 + (maxFeatures * lineHeight);
  
  // Card shadow effect
  doc.setFillColor(200, 200, 200);
  doc.roundedRect(17, startY + 2, 180, boxHeight, 3, 3, 'F');
  
  // Card background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, startY, 180, boxHeight, 3, 3, 'F');
  
  // Accent bar on left
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(15, startY, 5, boxHeight, 'F');
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(title, 28, startY + 12);
  
  // Price badge
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.roundedRect(150, startY + 4, 42, 14, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(price, 171, startY + 13, { align: 'center' });
  
  // Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(tagline, 28, startY + 20);
  
  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(28, startY + 25, 190, startY + 25);
  
  // Two columns
  const col1X = 30;
  const col2X = 112;
  let featureY = startY + 33;
  
  // Free column header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('FREE TIER', col1X, featureY);
  
  // Pro column header
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('PRO UNLOCKS', col2X, featureY);
  
  // Free features
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  freeFeatures.forEach((feature, i) => {
    doc.setTextColor(34, 139, 34);
    doc.text('\u2713', col1X, featureY + 7 + (i * lineHeight));
    doc.setTextColor(60, 60, 60);
    doc.text(feature, col1X + 6, featureY + 7 + (i * lineHeight));
  });
  
  // Pro features
  proFeatures.forEach((feature, i) => {
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('\u2605', col2X, featureY + 7 + (i * lineHeight));
    doc.setTextColor(60, 60, 60);
    doc.text(feature, col2X + 6, featureY + 7 + (i * lineHeight));
  });
  
  y = startY + boxHeight + 6;
}

// Athlete Card
drawTierCard(
  'ATHLETE',
  '$2.99/mo',
  'Showcase your skills. Build your legacy.',
  [
    'Team chat',
    'View schedule & calendar',
    'View team playbook',
    'Basic HYPE card (view only)',
    'View personal stats'
  ],
  [
    'Upload video highlights',
    'Shareable HYPE card link',
    'Enhanced profile (height, GPA, etc.)',
    'Achievement badges display',
    'Social links on profile'
  ],
  [220, 235, 255],
  [50, 100, 200]
);

// Supporter Card
drawTierCard(
  'SUPPORTER',
  '$5.99/mo',
  'Cheer loud. Track proud.',
  [
    'View highlights & stats',
    'View playbook & schedule',
    'Team chat',
    'Game Day Live (join & cheer)'
  ],
  [
    'Manage athletes (independent tracking)',
    'Upload highlights for athletes',
    'Unlimited managed athletes',
    'Cross-team following',
    'All badge themes unlocked',
    'Season history archives'
  ],
  [255, 235, 210],
  [220, 120, 20]
);

// Coach Card
drawTierCard(
  'COACH',
  '$7.99/mo',
  'Lead your team to victory.',
  [
    'Full roster management',
    'Add/remove team members',
    'Manage team invite code',
    'Schedule & calendar',
    'Team chat'
  ],
  [
    'StatTracker (live game stats)',
    'PlayMaker (design plays)',
    'Team playbook access',
    'Team analytics & reports',
    'Award badges to athletes',
    'Championship recognition badges'
  ],
  [210, 250, 210],
  [40, 160, 80]
);

// New page for revenue summary
doc.addPage();

// Header for page 2
doc.setFillColor(20, 20, 30);
doc.rect(0, 0, 210, 25, 'F');

doc.setFontSize(18);
doc.setFont('helvetica', 'bold');
doc.setTextColor(255, 140, 50);
doc.text('STATFYR', 20, 17);

doc.setFontSize(12);
doc.setTextColor(255, 255, 255);
doc.text('Revenue & Business Model', 105, 17, { align: 'center' });

// Revenue section
let ry = 40;
doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.setTextColor(40, 40, 40);
doc.text('Revenue Summary', 20, ry);

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(100, 100, 100);
doc.text('All prices reflect 15% App Store fee consideration', 20, ry + 8);

ry += 20;

// Revenue table
const tableData = [
  { tier: 'Athlete Pro', price: '$2.99', fee: '$0.45', net: '$2.54', color: [50, 100, 200] },
  { tier: 'Supporter Pro', price: '$5.99', fee: '$0.90', net: '$5.09', color: [220, 120, 20] },
  { tier: 'Coach Pro', price: '$7.99', fee: '$1.20', net: '$6.79', color: [40, 160, 80] }
];

// Table header
doc.setFillColor(240, 240, 245);
doc.rect(20, ry, 170, 12, 'F');
doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.setTextColor(60, 60, 60);
doc.text('Subscription Tier', 30, ry + 8);
doc.text('Price', 90, ry + 8);
doc.text('App Store Fee', 120, ry + 8);
doc.text('Net Revenue', 160, ry + 8);

ry += 12;

tableData.forEach((row, i) => {
  const rowY = ry + (i * 12);
  
  // Alternating row background
  if (i % 2 === 0) {
    doc.setFillColor(250, 250, 252);
    doc.rect(20, rowY, 170, 12, 'F');
  }
  
  // Color indicator
  doc.setFillColor(row.color[0] as number, row.color[1] as number, row.color[2] as number);
  doc.circle(26, rowY + 6, 3, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(row.tier, 34, rowY + 8);
  doc.text(row.price, 90, rowY + 8);
  doc.text(row.fee, 125, rowY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 160, 80);
  doc.text(row.net, 163, rowY + 8);
});

ry += 50;

// Key value propositions
doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.setTextColor(40, 40, 40);
doc.text('Why STATFYR?', 20, ry);

ry += 12;

const valueProps = [
  { icon: '\u26A1', text: 'Real-time stat tracking during live games' },
  { icon: '\u{1F3C6}', text: 'Badge & achievement system drives engagement' },
  { icon: '\u{1F4F1}', text: 'Native iOS & Android apps via Capacitor' },
  { icon: '\\u{1F465}', text: 'Role-based dashboards for coaches, athletes & supporters' },
  { icon: '\u{1F4CA}', text: 'Season archives preserve team history' }
];

doc.setFontSize(10);
valueProps.forEach((prop, i) => {
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`•  ${prop.text}`, 25, ry + (i * 8));
});

ry += 55;

// Target market
doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.setTextColor(40, 40, 40);
doc.text('Target Market', 20, ry);

ry += 10;
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(60, 60, 60);
doc.text('Youth & amateur sports teams, travel ball organizations, high school athletics,', 20, ry);
doc.text('independent athletes, and engaged sports parents seeking to track and celebrate', 20, ry + 6);
doc.text('their athletes\' journeys.', 20, ry + 12);

// Footer
doc.setFontSize(8);
doc.setTextColor(150, 150, 150);
doc.text('STATFYR v1.1.10  |  Cross-platform iOS/Android  |  ' + new Date().toLocaleDateString(), 105, 285, { align: 'center' });

// Save
const pdfOutput = doc.output('arraybuffer');
fs.writeFileSync('STATFYR_Pricing_Tiers.pdf', Buffer.from(pdfOutput));

console.log('PDF generated: STATFYR_Pricing_Tiers.pdf');
