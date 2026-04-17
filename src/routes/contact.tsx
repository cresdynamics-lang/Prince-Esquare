import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { STORE_INFO } from "@/lib/format";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Prince Esquare" },
      { name: "description", content: "Get in touch with Prince Esquare. Visit our Nairobi store or message us anytime." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(1).max(300),
  message: z.string().trim().min(1).max(5000),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
      is_read: false,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send your message. Please try again.");
      return;
    }
    toast.success("Message received. We'll be in touch shortly.");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div>
      <section className="relative bg-navy py-16 text-center text-navy-foreground md:py-20">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30" style={{ backgroundImage: "url('/hero-suit.jpg')" }} />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">We'd love to hear from you</p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">Contact Prince Esquare</h1>
        </div>
      </section>

      <div className="container mx-auto grid gap-12 px-4 py-16 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-bold">Visit our Nairobi store</h2>
          <ul className="mt-6 space-y-4 text-sm">
            <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" /><span>{STORE_INFO.address}</span></li>
            <li className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold" /><a href={`tel:${STORE_INFO.phone}`} className="hover:text-gold">{STORE_INFO.phone}</a></li>
            <li className="flex items-start gap-3"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold" /><a href={`mailto:${STORE_INFO.email}`} className="hover:text-gold">{STORE_INFO.email}</a></li>
            <li className="flex items-start gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold" /><span>{STORE_INFO.hours}</span></li>
            <li className="flex items-start gap-3"><MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" /><a href={`https://wa.me/${STORE_INFO.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-success">Chat on WhatsApp</a></li>
          </ul>
          <div className="mt-8 aspect-video overflow-hidden rounded-md border border-border">
            <iframe
              src={STORE_INFO.mapEmbed}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Prince Esquare store location"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-md border border-border bg-card p-8">
          <h2 className="font-display text-2xl font-bold">Send us a message</h2>
          <div className="mt-6 space-y-4">
            <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone (optional)</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Subject</Label><Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Message</Label><Textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Sending…" : "Send Message"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
