import { jsPDF } from 'jspdf';
import * as fs from 'fs';

const doc = new jsPDF();

// Title
doc.setFontSize(24);
doc.setFont('helvetica', 'bold');
doc.text('STATFYR Subscription Tiers', 105, 25, { align: 'center' });

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.text('Sports Stats & Team Management Platform', 105, 33, { align: 'center' });

let y = 50;

// Helper function to draw a tier box
function drawTierBox(title: string, price: string, netRevenue: string, freeFeatures: string[], proFeatures: string[], color: [number, number, number]) {
  const startY = y;
  const boxHeight = 75;
  
  // Box background
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(15, startY, 180, boxHeight, 'F');
  
  // Border
  doc.setDrawColor(50, 50, 50);
  doc.setLineWidth(0.5);
  doc.rect(15, startY, 180, boxHeight, 'S');
  
  // Title and price
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, 25, startY + 12);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(price, 175, startY + 12, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Net after App Store (15%): ${netRevenue}`, 175, startY + 20, { align: 'right' });
  
  // Divider line
  doc.setDrawColor(150, 150, 150);
  doc.line(20, startY + 25, 190, startY + 25);
  
  // Two columns
  const col1X = 25;
  const col2X = 110;
  let featureY = startY + 35;
  
  // Free features
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FREE', col1X, featureY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  freeFeatures.forEach((feature, i) => {
    doc.text(`• ${feature}`, col1X, featureY + 8 + (i * 6));
  });
  
  // Pro features
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PRO UNLOCKS', col2X, featureY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  proFeatures.forEach((feature, i) => {
    doc.text(`• ${feature}`, col2X, featureY + 8 + (i * 6));
  });
  
  y = startY + boxHeight + 10;
}

// Athlete Pro
drawTierBox(
  'ATHLETE PRO',
  '$2.99/month',
  '~$2.54/month',
  [
    'Chat with team',
    'Follow team & coach',
    'View schedule',
    'Basic HYPE card'
  ],
  [
    'Upload highlights',
    'Shareable HYPE card',
    'Enhanced profile (height, weight, etc.)',
    'Achievement badges display'
  ],
  [230, 245, 255] // Light blue
);

// Supporter Pro
drawTierBox(
  'SUPPORTER PRO',
  '$5.99/month',
  '~$5.09/month',
  [
    'View highlights',
    'Basic stats view',
    'Manage 1 athlete'
  ],
  [
    'Upload highlights',
    'Stat tracking',
    'Unlimited managed athletes',
    'Cross-team following',
    'All themes unlocked'
  ],
  [255, 240, 220] // Light orange
);

// Coach Pro
drawTierBox(
  'COACH PRO',
  '$7.99/month',
  '~$6.79/month',
  [
    'View roster',
    'Basic schedule',
    'Team chat'
  ],
  [
    'StatTracker (live stats)',
    'PlayMaker (play designer)',
    'Roster management',
    'Team analytics',
    'Championship badges'
  ],
  [220, 255, 220] // Light green
);

// Footer with revenue summary
y += 5;
doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.3);
doc.line(15, y, 195, y);

y += 10;
doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.setTextColor(0, 0, 0);
doc.text('Revenue Summary (with 15% App Store fee)', 15, y);

y += 10;
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');

const summaryData = [
  ['Tier', 'Price', 'App Store Cut', 'Net Revenue'],
  ['Athlete Pro', '$2.99', '$0.45', '$2.54'],
  ['Supporter Pro', '$5.99', '$0.90', '$5.09'],
  ['Coach Pro', '$7.99', '$1.20', '$6.79']
];

summaryData.forEach((row, i) => {
  const rowY = y + (i * 7);
  if (i === 0) {
    doc.setFont('helvetica', 'bold');
  } else {
    doc.setFont('helvetica', 'normal');
  }
  doc.text(row[0], 25, rowY);
  doc.text(row[1], 80, rowY);
  doc.text(row[2], 120, rowY);
  doc.text(row[3], 165, rowY);
});

// Date generated
doc.setFontSize(8);
doc.setTextColor(120, 120, 120);
doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });

// Save the PDF
const pdfOutput = doc.output('arraybuffer');
fs.writeFileSync('STATFYR_Pricing_Tiers.pdf', Buffer.from(pdfOutput));

console.log('PDF generated: STATFYR_Pricing_Tiers.pdf');
