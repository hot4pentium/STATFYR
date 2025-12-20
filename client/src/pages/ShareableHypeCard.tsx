import { Button } from "@/components/ui/button";
import { ATHLETES, EVENTS, TEAM_NAME } from "@/lib/mockData";
import { Share2, Copy, Check, Home } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';

export default function ShareableHypeCard(props: any) {
  const athleteId = props.params?.id || "a1";
  const athlete = ATHLETES.find(a => a.id === athleteId) || ATHLETES[0];
  const [isHypeCardFlipped, setIsHypeCardFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/athlete/${athlete.id}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Share link copied!");
  };

  const shareToSocial = (platform: string) => {
    const text = `Check out ${athlete.name}'s HYPE Card from ${TEAM_NAME}!`;
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
      toast.success(`Shared to ${platform}!`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-full px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10"
              data-testid="button-home"
            >
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          
          <h1 className="font-display text-xl font-bold text-white">{athlete.name}'s HYPE Card</h1>
          
          <div className="w-10"></div>
        </div>
      </header>

      <div 
        className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll',
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80 pointer-events-none" />
        
        <div className="relative z-20 space-y-6 max-w-full px-4 md:px-8 py-8">
          {/* HYPE Card */}
          <div className="w-60 mx-auto space-y-4">
            <div className="relative group cursor-pointer" onClick={() => setIsHypeCardFlipped(!isHypeCardFlipped)} style={{ perspective: '1000px' }}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
              <div 
                className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isHypeCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.6s ease-in-out'
                }}
              >
                {/* Card Background */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                
                {/* Front of Card */}
                {!isHypeCardFlipped ? (
                  <div className="relative w-full h-96 overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                    {/* Full Image Background */}
                    <img src={athlete.avatar} alt={athlete.name} className="absolute inset-0 w-full h-full object-cover" />
                    
                    {/* Gradient Overlays for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                    
                    {/* Top Left - Name Overlay */}
                    <div className="absolute top-0 left-0 p-4 text-left">
                      <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tighter drop-shadow-lg leading-tight">{athlete.name}</h3>
                      <p className="text-[10px] text-white/90 uppercase mt-1 tracking-wider drop-shadow-md font-semibold">{TEAM_NAME}</p>
                    </div>

                    {/* Bottom Left - Position */}
                    <div className="absolute bottom-0 left-0 p-4">
                      <p className="text-sm font-bold text-accent uppercase tracking-wider drop-shadow-lg">{athlete.position}</p>
                    </div>

                    {/* Bottom Right - Number */}
                    <div className="absolute bottom-0 right-0 p-4">
                      <div className="bg-gradient-to-r from-accent to-primary rounded-lg p-3 shadow-lg">
                        <span className="text-white font-display font-bold text-2xl drop-shadow">#{athlete.number}</span>
                      </div>
                    </div>

                    {/* Right Center - HYPE Card Text (Vertical) */}
                    <div className="absolute right-0.5 top-1/2 -translate-y-1/2">
                      <div className="flex flex-row items-center gap-1 -rotate-90 whitespace-nowrap origin-center">
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-lg">HYPE</span>
                        <div className="w-0.5 h-2 bg-white/60"></div>
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-lg">CARD</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Back of Card - Four Quadrants */
                  <div className="relative w-full h-96 overflow-hidden" style={{ transform: 'scaleX(-1)', backfaceVisibility: 'hidden' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                    
                    <div className="relative w-full h-full p-3 grid grid-cols-2 gap-2">
                      {/* Top Left - Events */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-accent font-bold uppercase tracking-widest mb-2">Events</p>
                        <div className="space-y-1 text-[9px] text-white/70 flex-1 overflow-y-auto">
                          {EVENTS.slice(0, 2).map((event) => (
                            <div key={event.id} className="line-clamp-2">
                              <span className="font-semibold text-white">{event.type}</span>
                              <div className="text-[8px]">{new Date(event.date).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Right - Stats with Bars */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-primary font-bold uppercase tracking-widest mb-2">Stats</p>
                        <div className="space-y-2 flex-1">
                          <div>
                            <div className="flex justify-between items-end gap-1 mb-1">
                              <span className="text-[8px] text-white/70">Goals</span>
                              <span className="text-[9px] font-bold text-primary">{athlete.stats?.goals || 0}</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{width: `${Math.min((athlete.stats?.goals || 0) * 10, 100)}%`}}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-end gap-1 mb-1">
                              <span className="text-[8px] text-white/70">Assists</span>
                              <span className="text-[9px] font-bold text-accent">{athlete.stats?.assists || 0}</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-accent" style={{width: `${Math.min((athlete.stats?.assists || 0) * 10, 100)}%`}}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Left - Highlights */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-green-400 font-bold uppercase tracking-widest mb-2">Highlights</p>
                        <div className="space-y-1 text-[9px] text-white/70 flex-1">
                          <div>⚡ Crucial goal</div>
                          <div>✨ MVP award</div>
                          <div>🎯 Key assist</div>
                        </div>
                      </div>

                      {/* Bottom Right - Shoutouts */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-orange-400 font-bold uppercase tracking-widest mb-2">Shoutouts</p>
                        <div className="text-[8px] text-white/70 italic flex-1">
                          <p className="line-clamp-3">"Excellent form lately!"</p>
                          <p className="text-[7px] mt-1 text-white/50">— Coach</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tap to Flip Bar */}
            <button
              onClick={() => setIsHypeCardFlipped(!isHypeCardFlipped)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 text-center backdrop-blur-sm hover:bg-white/10 transition cursor-pointer"
              data-testid="button-tap-to-flip"
            >
              <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Tap to Flip</p>
            </button>

            {/* Share Section */}
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-white">Share This Card</p>
                </div>

                {/* Share Link */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-background/50 border border-white/10 rounded px-3 py-2 text-xs text-white/70 font-mono"
                    data-testid="input-share-url"
                  />
                  <Button
                    onClick={copyShareLink}
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5"
                    data-testid="button-copy-share-link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Social Share Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => shareToSocial('twitter')}
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-xs"
                    data-testid="button-share-twitter"
                  >
                    Twitter
                  </Button>
                  <Button
                    onClick={() => shareToSocial('facebook')}
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-xs"
                    data-testid="button-share-facebook"
                  >
                    Facebook
                  </Button>
                  <Button
                    onClick={() => shareToSocial('whatsapp')}
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/5 text-xs"
                    data-testid="button-share-whatsapp"
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-[11px] text-white/60">All athlete data is public and shareable</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
