import { jsPDF } from 'jspdf';
import * as fs from 'fs';

const doc = new jsPDF();

// Title
doc.setFontSize(24);
doc.setFont('helvetica', 'bold');
doc.text('STATFYR Subscription Tiers', 105, 20, { align: 'center' });

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.text('Sports Stats & Team Management Platform', 105, 28, { align: 'center' });
doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 34, { align: 'center' });

let y = 48;

function drawTierBox(title: string, price: string, netRevenue: string, freeFeatures: string[], proFeatures: string[], color: [number, number, number]) {
  const startY = y;
  const lineHeight = 5;
  const maxFeatures = Math.max(freeFeatures.length, proFeatures.length);
  const boxHeight = 32 + (maxFeatures * lineHeight);
  
  // Box background
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(15, startY, 180, boxHeight, 'F');
  
  // Border
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.5);
  doc.rect(15, startY, 180, boxHeight, 'S');
  
  // Title and price
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, 25, startY + 10);
  
  doc.setFontSize(12);
  doc.text(price, 175, startY + 10, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Net after 15% App Store: ${netRevenue}`, 175, startY + 16, { align: 'right' });
  
  // Divider line
  doc.setDrawColor(150, 150, 150);
  doc.line(20, startY + 20, 190, startY + 20);
  
  // Two columns
  const col1X = 25;
  const col2X = 110;
  let featureY = startY + 28;
  
  // Free features header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34);
  doc.text('FREE', col1X, featureY);
  
  // Pro features header
  doc.setTextColor(220, 120, 0);
  doc.text('PRO UNLOCKS', col2X, featureY);
  
  // Free features list
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  freeFeatures.forEach((feature, i) => {
    doc.text(`• ${feature}`, col1X, featureY + 6 + (i * lineHeight));
  });
  
  // Pro features list
  proFeatures.forEach((feature, i) => {
    doc.text(`• ${feature}`, col2X, featureY + 6 + (i * lineHeight));
  });
  
  y = startY + boxHeight + 8;
}

// Athlete Pro
drawTierBox(
  'ATHLETE',
  '$2.99/month Pro',
  '~$2.54/month',
  [
    'Chat with team',
    'View schedule/calendar',
    'View team playbook',
    'Basic HYPE card (view only)',
    'View own stats'
  ],
  [
    'Upload highlights',
    'Shareable HYPE card link',
    'Enhanced profile (height, weight, etc.)',
    'Achievement badges display',
    'Social links on profile'
  ],
  [220, 235, 255] // Light blue
);

// Supporter Pro
drawTierBox(
  'SUPPORTER',
  '$5.99/month Pro',
  '~$5.09/month',
  [
    'View highlights',
    'View basic stats',
    'View playbook',
    'View schedule',
    'Team chat',
    'Game Day Live (join & cheer)',
    'Manage 1 athlete'
  ],
  [
    'Upload highlights',
    'Stat tracking for athletes',
    'Unlimited managed athletes',
    'Cross-team following',
    'All badge themes unlocked',
    'Season history archives'
  ],
  [255, 235, 210] // Light orange
);

// Coach Pro
drawTierBox(
  'COACH',
  '$7.99/month Pro',
  '~$6.79/month',
  [
    'View roster',
    'Add/remove team members',
    'Manage team code',
    'Schedule/calendar',
    'Team chat'
  ],
  [
    'StatTracker (live game stats)',
    'PlayMaker (create plays)',
    'View playbook',
    'Team analytics/reports',
    'Award badges to athletes',
    'Championship badges'
  ],
  [210, 250, 210] // Light green
);

// Revenue Summary Table
y += 5;
doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.3);
doc.line(15, y, 195, y);

y += 8;
doc.setFontSize(11);
doc.setFont('helvetica', 'bold');
doc.setTextColor(0, 0, 0);
doc.text('Revenue Summary (15% App Store Fee)', 15, y);

y += 8;
doc.setFontSize(9);

// Table header
doc.setFillColor(240, 240, 240);
doc.rect(15, y - 4, 180, 8, 'F');
doc.setFont('helvetica', 'bold');
doc.text('Tier', 25, y);
doc.text('Price', 70, y);
doc.text('App Store Cut', 110, y);
doc.text('Net Revenue', 160, y);

// Table rows
const tableData = [
  ['Athlete Pro', '$2.99', '$0.45', '$2.54'],
  ['Supporter Pro', '$5.99', '$0.90', '$5.09'],
  ['Coach Pro', '$7.99', '$1.20', '$6.79']
];

doc.setFont('helvetica', 'normal');
tableData.forEach((row, i) => {
  const rowY = y + 8 + (i * 6);
  doc.text(row[0], 25, rowY);
  doc.text(row[1], 70, rowY);
  doc.text(row[2], 110, rowY);
  doc.text(row[3], 160, rowY);
});

// Footer
doc.setFontSize(8);
doc.setTextColor(100, 100, 100);
doc.text('STATFYR v1.1.10 - Cross-platform iOS/Android via Capacitor', 105, 285, { align: 'center' });

// Save the PDF
const pdfOutput = doc.output('arraybuffer');
fs.writeFileSync('STATFYR_Pricing_Tiers.pdf', Buffer.from(pdfOutput));

console.log('PDF generated: STATFYR_Pricing_Tiers.pdf');
