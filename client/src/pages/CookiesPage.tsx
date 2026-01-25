import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import statfyrLogo from "@/assets/statfyr-fire-logo.png";

export default function CookiesPage() {
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
        <h1 className="text-4xl font-display font-bold mb-8" data-testid="text-cookies-title">Cookie Policy</h1>
        
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-muted-foreground mb-8" data-testid="text-cookies-updated">
            Last updated: January 2026
          </p>

          <div id="termly-cookie-policy" className="bg-white/5 rounded-lg p-8 border border-white/10" data-testid="container-cookie-policy">
            <p className="text-center text-muted-foreground">
              Cookie policy content will be displayed here.
            </p>
            <p className="text-center text-sm text-muted-foreground mt-4">
              To embed your Termly cookie policy, replace this placeholder with your Termly embed code.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-semibold">What Are Cookies?</h2>
            <p className="text-muted-foreground">
              Cookies are small text files that are stored on your device when you visit a website. 
              They help websites remember your preferences and improve your experience.
            </p>

            <h2 className="text-2xl font-semibold">How We Use Cookies</h2>
            <p className="text-muted-foreground">
              STATFYR uses cookies primarily for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Authentication and session management</li>
              <li>Remembering your preferences</li>
              <li>Analytics to improve our services</li>
            </ul>

            <h2 className="text-2xl font-semibold">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about our Cookie Policy, please contact us at:
            </p>
            <p className="text-muted-foreground">
              Email: privacy@statfyr.com
            </p>
          </div>
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
