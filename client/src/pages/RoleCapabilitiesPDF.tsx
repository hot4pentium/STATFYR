import { useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, ArrowLeft, Loader2, Check } from "lucide-react";
import { useLocation } from "wouter";

interface FeatureAccess {
  feature: string;
  access: string;
}

interface RoleData {
  name: string;
  description: string;
  features: FeatureAccess[];
}

const roleData: RoleData[] = [
  {
    name: "Coach",
    description: "Full team management and administrative access",
    features: [
      { feature: "Roster", access: "View, Add, Edit, Remove all members" },
      { feature: "Calendar", access: "View, Create, Edit, Delete events" },
      { feature: "PlayMaker", access: "Create & design plays on canvas" },
      { feature: "Playbook", access: "View all plays" },
      { feature: "StatTracker", access: "Live game stat tracking" },
      { feature: "Stats", access: "Full team & player statistics" },
      { feature: "Highlights", access: "Upload, view, manage videos" },
      { feature: "Team Chat", access: "Full access" },
      { feature: "Team Settings", access: "Edit team name, sport, badge" },
      { feature: "Team Code", access: "Share for member recruitment" },
      { feature: "Game Day Live", access: "Create live engagement sessions" },
      { feature: "HYPE Portal", access: "Not applicable" },
    ],
  },
  {
    name: "Staff",
    description: "Coach-level access without team settings management",
    features: [
      { feature: "Roster", access: "View, Add, Edit, Remove (non-coach/staff)" },
      { feature: "Calendar", access: "View, Create, Edit, Delete events" },
      { feature: "PlayMaker", access: "Create & design plays" },
      { feature: "Playbook", access: "View all plays" },
      { feature: "StatTracker", access: "Live game stat tracking" },
      { feature: "Stats", access: "Full team & player statistics" },
      { feature: "Highlights", access: "Upload, view, manage videos" },
      { feature: "Team Chat", access: "Full access" },
      { feature: "Team Settings", access: "NO ACCESS" },
      { feature: "Team Code", access: "View only" },
      { feature: "Game Day Live", access: "Create live engagement sessions" },
      { feature: "HYPE Portal", access: "Not applicable" },
    ],
  },
  {
    name: "Athlete",
    description: "Personal profile and team participation access",
    features: [
      { feature: "Roster", access: "View only" },
      { feature: "Calendar", access: "View only" },
      { feature: "PlayMaker", access: "NO ACCESS" },
      { feature: "Playbook", access: "View plays" },
      { feature: "StatTracker", access: "NO ACCESS" },
      { feature: "Stats", access: "View personal & team stats" },
      { feature: "Highlights", access: "Upload & view" },
      { feature: "Team Chat", access: "Full access" },
      { feature: "Team Settings", access: "NO ACCESS" },
      { feature: "Team Code", access: "View only" },
      { feature: "Game Day Live", access: "View shoutouts & taps" },
      { feature: "HYPE Portal", access: "Create HYPE posts, share profile, QR codes" },
    ],
  },
  {
    name: "Supporter",
    description: "Fan engagement and managed athlete viewing",
    features: [
      { feature: "Roster", access: "View only" },
      { feature: "Calendar", access: "View only" },
      { feature: "PlayMaker", access: "NO ACCESS" },
      { feature: "Playbook", access: "View plays" },
      { feature: "StatTracker", access: "NO ACCESS" },
      { feature: "Stats", access: "NO ACCESS (own dashboard)" },
      { feature: "Highlights", access: "View only" },
      { feature: "Team Chat", access: "Full access" },
      { feature: "Team Settings", access: "NO ACCESS" },
      { feature: "Team Code", access: "NO ACCESS" },
      { feature: "Game Day Live", access: "Send shoutouts & taps" },
      { feature: "HYPE Portal", access: "NO ACCESS" },
      { feature: "Managed Athletes", access: "Switch to view athlete profiles" },
      { feature: "Badge System", access: "Earn badges through engagement" },
      { feature: "Theme Unlocks", access: "Unlock themes via badge progression" },
    ],
  },
];

const supporterAthleteViewData: FeatureAccess[] = [
  { feature: "Roster", access: "View athlete's team roster" },
  { feature: "Calendar", access: "View athlete's team schedule" },
  { feature: "PlayMaker", access: "NO ACCESS" },
  { feature: "Playbook", access: "View athlete's team plays" },
  { feature: "StatTracker", access: "NO ACCESS" },
  { feature: "Stats", access: "View athlete's statistics" },
  { feature: "Highlights", access: "View athlete's highlights" },
  { feature: "Team Chat", access: "View/participate in athlete's team chat" },
  { feature: "HYPE Card", access: "View & share athlete's public profile" },
];

export default function RoleCapabilitiesPDF() {
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generatePDF = () => {
    setIsGenerating(true);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addHeader = () => {
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("STATFYR", margin, 28);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Role Capabilities & Pricing Guide", pageWidth - margin - 80, 28);
      return 55;
    };

    const addFooter = (pageNum: number) => {
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(8);
      doc.text(`Page ${pageNum}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, doc.internal.pageSize.getHeight() - 10);
    };

    const addContinuationHeader = () => {
      doc.setFillColor(249, 115, 22);
      doc.rect(0, 0, pageWidth, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("STATFYR", margin, 17);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Role Capabilities Guide (continued)", pageWidth - margin - 65, 17);
      return 35;
    };

    const checkPageBreak = (requiredSpace: number) => {
      if (y + requiredSpace > doc.internal.pageSize.getHeight() - 30) {
        addFooter(doc.getNumberOfPages());
        doc.addPage();
        y = addContinuationHeader();
        return true;
      }
      return false;
    };

    y = addHeader();

    doc.setTextColor(51, 51, 51);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const introText = "This document provides a comprehensive overview of all user roles in STATFYR, their capabilities, feature access levels, and dashboard attributes. Use this guide to determine pricing tiers and understand the value proposition for each role.";
    const splitIntro = doc.splitTextToSize(introText, contentWidth);
    doc.text(splitIntro, margin, y);
    y += splitIntro.length * 5 + 15;

    roleData.forEach((role, roleIndex) => {
      const tableHeight = (role.features.length + 1) * 8 + 30;
      checkPageBreak(tableHeight);

      doc.setFillColor(249, 115, 22);
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(role.name.toUpperCase(), margin + 5, y + 8);
      y += 16;

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(role.description, margin, y);
      y += 10;

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, contentWidth, 8, "F");
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Feature", margin + 3, y + 5.5);
      doc.text("Access Level", margin + 55, y + 5.5);
      y += 8;

      doc.setFont("helvetica", "normal");
      role.features.forEach((feat, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y, contentWidth, 7, "F");
        }
        
        doc.setTextColor(51, 51, 51);
        doc.text(feat.feature, margin + 3, y + 5);
        
        if (feat.access === "NO ACCESS") {
          doc.setTextColor(220, 38, 38);
        } else if (feat.access.includes("Full") || feat.access.includes("Create")) {
          doc.setTextColor(22, 163, 74);
        } else {
          doc.setTextColor(100, 100, 100);
        }
        
        const accessText = doc.splitTextToSize(feat.access, contentWidth - 60);
        doc.text(accessText[0], margin + 55, y + 5);
        y += 7;
      });

      y += 15;

      if (roleIndex === roleData.length - 1) {
        checkPageBreak(100);
        
        doc.setFillColor(59, 130, 246);
        doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("SUPPORTER (VIEWING MANAGED ATHLETE)", margin + 5, y + 8);
        y += 16;

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("When a supporter switches to view a managed athlete's profile", margin, y);
        y += 10;

        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, contentWidth, 8, "F");
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Feature", margin + 3, y + 5.5);
        doc.text("Access Level", margin + 55, y + 5.5);
        y += 8;

        doc.setFont("helvetica", "normal");
        supporterAthleteViewData.forEach((feat, i) => {
          if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, y, contentWidth, 7, "F");
          }
          
          doc.setTextColor(51, 51, 51);
          doc.text(feat.feature, margin + 3, y + 5);
          
          if (feat.access === "NO ACCESS") {
            doc.setTextColor(220, 38, 38);
          } else {
            doc.setTextColor(22, 163, 74);
          }
          
          doc.text(feat.access, margin + 55, y + 5);
          y += 7;
        });
      }
    });

    checkPageBreak(80);
    y += 10;
    
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FEATURE SUMMARY BY TIER", margin + 5, y + 8);
    y += 20;

    const tiers = [
      { name: "Free Tier", color: [156, 163, 175], features: ["View roster", "View schedule", "View playbook", "Basic team chat"] },
      { name: "Athlete Tier", color: [59, 130, 246], features: ["All Free features", "Personal stats tracking", "HYPE Portal & cards", "Highlight uploads", "QR code sharing"] },
      { name: "Coach/Staff Tier", color: [249, 115, 22], features: ["All Athlete features", "PlayMaker access", "StatTracker (live)", "Team management", "Event creation", "Game Day Live sessions"] },
      { name: "Supporter Premium", color: [168, 85, 247], features: ["Managed athlete profiles", "Badge progression", "Theme unlocks", "Enhanced engagement tools"] },
    ];

    tiers.forEach((tier) => {
      checkPageBreak(40);
      doc.setFillColor(tier.color[0], tier.color[1], tier.color[2]);
      doc.roundedRect(margin, y, 60, 6, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(tier.name, margin + 3, y + 4.5);
      y += 10;

      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      tier.features.forEach((f) => {
        doc.text(`• ${f}`, margin + 5, y);
        y += 5;
      });
      y += 8;
    });

    addFooter(doc.getNumberOfPages());
    doc.save("STATFYR_Role_Capabilities.pdf");
    
    setIsGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">STATFYR Role Capabilities</CardTitle>
            <p className="text-orange-100">Generate a PDF document for pricing decisions</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-300">
                  This tool generates a comprehensive PDF document outlining all role capabilities, 
                  feature access levels, and dashboard attributes for STATFYR. Use this document 
                  to help determine your pricing tiers and understand the value proposition for each user role.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {roleData.map((role) => (
                  <Card key={role.name} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{role.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{role.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        {role.features.length} features documented
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">PDF Contents:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                  <li>• Complete feature access matrix for all 4 roles</li>
                  <li>• Supporter athlete-view capabilities breakdown</li>
                  <li>• Suggested pricing tier feature bundles</li>
                  <li>• Professional formatting for stakeholder presentations</li>
                </ul>
              </div>

              <Button
                onClick={generatePDF}
                disabled={isGenerating}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg"
                data-testid="button-generate-pdf"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : generated ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <FileDown className="h-5 w-5 mr-2" />
                    Download Role Capabilities PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
