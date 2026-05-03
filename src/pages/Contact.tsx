import { useState } from "react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Phone, MapPin, Clock, MessageSquare,
  Send, CheckCircle2, Building2, HeadphonesIcon
} from "lucide-react";

const contactDetails = [
  {
    icon: Mail,
    label: "Email Us",
    value: "support.aasra@gmail.com",
    sub: "We reply within 24 hours",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Phone,
    label: "Call Us",
    value: "0315 564 8744",
    sub: "Mon–Fri, 9am–6pm PKT",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: MapPin,
    label: "Head Office",
    value: "FAST University Islamabad",
    sub: "Islamabad, Pakistan",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: Clock,
    label: "Working Hours",
    value: "Mon – Fri: 9AM – 6PM",
    sub: "Sat: 10AM – 2PM (Support Only)",
    color: "bg-purple-100 text-purple-600",
  },
];

const faqs = [
  { q: "How do I list my hostel on Aasra?", a: "Sign up as an owner, complete your profile, and add your hostel rooms. Our team will review and approve your listing within 24 hours." },
  { q: "Is Aasra free for students?", a: "Yes, Aasra is completely free for students to browse and contact hostel owners. No hidden charges, ever." },
  { q: "How do I report a problem with my hostel?", a: "Log into your student dashboard, go to Complaints, and submit a complaint with details. The owner is notified instantly." },
  { q: "Can I change my room after booking?", a: "Room change requests can be made through the owner. Use the in-app messaging feature to communicate directly with your hostel owner." },
];

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "Validation Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    // In a real app this would call an API
    setSubmitted(true);
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="container mx-auto max-w-3xl text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <HeadphonesIcon className="h-4 w-4" /> We're Here to Help
          </div>
          <h1 className="font-display text-5xl font-bold text-foreground mb-6 leading-tight">
            Get in Touch<br />
            <span className="text-primary">With Aasra</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Have a question, feedback, or need support? Our team is ready to help. Reach out and we'll respond as quickly as we can.
          </p>
        </div>
      </section>

      {/* Contact Details Grid */}
      <section className="py-4 px-6 pb-16">
        <div className="container mx-auto max-w-5xl grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {contactDetails.map((c) => (
            <Card key={c.label} className="hover:shadow-md hover:-translate-y-1 transition-all">
              <CardContent className="p-6">
                <div className={`h-11 w-11 rounded-lg ${c.color} flex items-center justify-center mb-4`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{c.label}</p>
                <p className="font-semibold text-foreground text-sm">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Main Content: Form + FAQ */}
      <section className="py-8 px-6 pb-20 bg-muted/30">
        <div className="container mx-auto max-w-5xl grid lg:grid-cols-2 gap-10">

          {/* Contact Form */}
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Send Us a Message
              </h2>
              <p className="text-sm text-muted-foreground">Fill in the form and we'll get back to you within 24 hours.</p>
            </div>

            {submitted ? (
              <Card>
                <CardContent className="p-10 text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">Message Received!</h3>
                  <p className="text-sm text-muted-foreground">Thank you, {form.name}. We'll reply to <span className="text-foreground font-medium">{form.email}</span> within 24 hours.</p>
                  <Button variant="outline" className="mt-6 font-body" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                    Send Another
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Full Name <span className="text-red-500">*</span></Label>
                        <Input id="contact-name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email Address <span className="text-red-500">*</span></Label>
                        <Input id="contact-email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Input id="contact-subject" placeholder="What's this about?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Message <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="contact-message"
                        placeholder="Tell us how we can help..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="min-h-[140px] resize-none"
                      />
                    </div>
                    <Button type="submit" className="w-full font-body">
                      <Send className="h-4 w-4 mr-2" /> Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* FAQ */}
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">Frequently Asked Questions</h2>
              <p className="text-sm text-muted-foreground">Quick answers to the most common questions.</p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <Card key={i} className="overflow-hidden">
                  <button
                    id={`faq-${i}`}
                    className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-foreground text-sm">{faq.q}</span>
                    <span className="shrink-0 text-muted-foreground text-lg leading-none mt-0.5">
                      {openFaq === i ? "−" : "+"}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
                      {faq.a}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Quick links */}
            <Card className="mt-6 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-foreground text-sm">For Hostel Owners</p>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Want to list your hostel or need help managing your property on Aasra? Reach us at:</p>
                <p className="text-sm font-medium text-primary">owners@aasra.pk</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Contact;
