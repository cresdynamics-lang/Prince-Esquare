import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Book Appointment — Prince Esquare" },
      {
        name: "description",
        content:
          "Book a fitting or style consultation with Prince Esquare in Nairobi, Kenya. Reserve your menswear appointment online.",
      },
      {
        name: "keywords",
        content: "book menswear fitting nairobi, suit fitting kenya, style consultation nairobi, prince esquare booking",
      },
    ],
  }),
  component: BookingPage,
});

const bookingSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(7).max(30),
  service: z.string().trim().min(2).max(100),
  booking_date: z.string().trim().min(1),
  booking_time: z.string().trim().min(1),
  notes: z.string().trim().max(3000).optional(),
});

function BookingPage() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Tailoring Consultation",
    booking_date: "",
    booking_time: "",
    notes: "",
  });

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please complete all required booking details.");
      return;
    }
    if (parsed.data.booking_date < minDate) {
      toast.error("Booking date cannot be in the past.");
      return;
    }

    setSubmitting(true);
    const { error } = await (supabase as any).from("bookings").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      service: parsed.data.service,
      booking_date: parsed.data.booking_date,
      booking_time: parsed.data.booking_time,
      notes: parsed.data.notes || null,
      status: "pending",
    });
    setSubmitting(false);

    if (error) {
      toast.error("Could not submit booking right now. Please try again.");
      return;
    }

    toast.success("Booking submitted. We will confirm shortly.");
    setForm({
      name: "",
      email: "",
      phone: "",
      service: "Tailoring Consultation",
      booking_date: "",
      booking_time: "",
      notes: "",
    });
  };

  return (
    <div>
      <section className="relative bg-navy py-16 text-center text-navy-foreground md:py-20">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: "url('/hero-suit.jpg')" }}
        />
        <div className="relative z-10 px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Appointments</p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">Book with Prince Esquare</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-navy-foreground/85 md:text-base">
            Reserve a fitting, style consultation, or in-store service. We will confirm your booking by
            phone or email.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-14">
      <form onSubmit={handleSubmit} className="rounded-md border border-border bg-card p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Full Name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label>Service</Label>
            <select
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option>Tailoring Consultation</option>
              <option>Suit Fitting</option>
              <option>Personal Styling Session</option>
              <option>Product Pickup Appointment</option>
            </select>
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              min={minDate}
              required
              value={form.booking_date}
              onChange={(e) => setForm((f) => ({ ...f, booking_date: e.target.value }))}
            />
          </div>
          <div>
            <Label>Time</Label>
            <Input
              type="time"
              required
              value={form.booking_time}
              onChange={(e) => setForm((f) => ({ ...f, booking_time: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any sizing details or special request..."
            />
          </div>
        </div>

        <Button type="submit" variant="hero" size="lg" className="mt-6 w-full" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Booking"}
        </Button>
      </form>
      </div>
    </div>
  );
}
