import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import statfyrLogo from "@/assets/statfyr-fire-logo.png";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo-home">
              <img src={statfyrLogo} alt="STATFYR" className="h-10 w-10" />
              <span className="font-display text-2xl font-bold tracking-tight">STATFYR</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg overflow-hidden" data-testid="container-privacy-policy">
          <iframe
            src="https://app.termly.io/policy-viewer/policy.html?policyUUID=b44f5182-a21b-4288-93de-f8c01023068e"
            title="Privacy Policy"
            className="w-full min-h-[800px] border-0"
            style={{ minHeight: "80vh" }}
          />
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 border-t border-white/10 mt-12">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-footer-privacy">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-white transition-colors" data-testid="link-footer-cookies">Cookie Policy</Link>
          <Link href="/contact" className="hover:text-white transition-colors" data-testid="link-footer-contact">Contact</Link>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4" data-testid="text-footer-copyright">
          © 2026 STATFYR. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
