import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import statfyrLogo from "@/assets/statfyr-fire-logo.png";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Message sent!",
          description: "We'll get back to you as soon as possible.",
        });
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try emailing us directly at support@statfyr.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl font-display font-bold mb-4" data-testid="text-contact-title">Contact Us</h1>
        <p className="text-muted-foreground mb-8" data-testid="text-contact-description">
          Have a question, feedback, or privacy inquiry? We'd love to hear from you.
        </p>

        <div className="bg-white/5 rounded-lg p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-white/5 border-white/10"
                  data-testid="input-contact-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-white/5 border-white/10"
                  data-testid="input-contact-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData({ ...formData, subject: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-contact-subject">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="support">Technical Support</SelectItem>
                  <SelectItem value="privacy">Privacy Request</SelectItem>
                  <SelectItem value="billing">Billing Question</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="How can we help you?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                className="bg-white/5 border-white/10 resize-none"
                data-testid="textarea-contact-message"
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isSubmitting}
              data-testid="button-contact-submit"
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-muted-foreground text-center">
              You can also reach us directly at{" "}
              <a
                href="mailto:support@statfyr.com"
                className="text-orange-500 hover:underline"
                data-testid="link-contact-email"
              >
                support@statfyr.com
              </a>
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
