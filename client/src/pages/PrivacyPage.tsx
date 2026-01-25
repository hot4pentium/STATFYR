import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import statfyrLogo from "@/assets/statfyr-fire-logo.png";

const TERMLY_PRIVACY_URL = "https://app.termly.io/policy-viewer/policy.html?policyUUID=b44f5182-a21b-4288-93de-f8c01023068e";

export default function PrivacyPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

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
        <h1 className="text-4xl font-display font-bold mb-4" data-testid="text-privacy-title">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">
          Last updated: January 25, 2026
        </p>
        
        <div className="bg-white rounded-lg overflow-hidden relative" data-testid="container-privacy-policy">
          {!iframeLoaded && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <p className="text-gray-500">Loading privacy policy...</p>
            </div>
          )}
          
          {iframeError ? (
            <div className="p-8 text-center">
              <p className="text-gray-700 mb-4">Unable to load the privacy policy inline.</p>
              <a 
                href={TERMLY_PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                View Privacy Policy <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <iframe
              src={TERMLY_PRIVACY_URL}
              title="Privacy Policy"
              className="w-full border-0"
              style={{ minHeight: "80vh", height: "800px" }}
              onLoad={() => setIframeLoaded(true)}
              onError={() => setIframeError(true)}
            />
          )}
        </div>
        
        <div className="mt-6 text-center">
          <a 
            href={TERMLY_PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
            data-testid="link-privacy-external"
          >
            Open in new tab <ExternalLink className="h-3 w-3" />
          </a>
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
