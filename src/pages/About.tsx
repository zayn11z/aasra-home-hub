import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Building2, Users, ShieldCheck, Heart,
  Star, Target, Eye, Handshake,
  GraduationCap, Home, Zap, Globe
} from "lucide-react";

const values = [
  { icon: ShieldCheck, title: "Trust & Safety", desc: "Every hostel owner is verified and every listing is reviewed for authenticity before going live." },
  { icon: Heart, title: "Student-First", desc: "We built Aasra because we've been students too. Your comfort, safety and peace of mind drive every feature we build." },
  { icon: Zap, title: "Transparency", desc: "No hidden fees. Real reviews. Clear payment histories. What you see is exactly what you get." },
  { icon: Handshake, title: "Community", desc: "We connect students and hostel owners in a trusted ecosystem where both parties thrive." },
];

const team = [
  { name: "Subhan Ahmed", role: "Backend Engineer", initial: "S", color: "bg-blue-100 text-blue-700" },
  { name: "Zain Ibn e Abbas", role: "Frontend Engineer", initial: "Z", color: "bg-purple-100 text-purple-700" },
  { name: "Dua Zainab", role: "Implementation Engineer", initial: "D", color: "bg-pink-100 text-pink-700" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Globe className="h-4 w-4" /> Our Story
          </div>
          <h1 className="font-display text-5xl font-bold text-foreground mb-6 leading-tight">
            Redefining Hostel Living<br />
            <span className="text-primary">Across Pakistan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Aasra was born from a simple frustration — finding and managing student accommodation shouldn't be chaotic. We built the platform we wish had existed when we were students.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl grid md:grid-cols-2 gap-8">
          <Card className="border-primary/20 hover:shadow-lg transition-all">
            <CardContent className="p-8">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To simplify the entire hostel experience — from discovery and booking to rent payment and complaint resolution — through a single, intelligent platform that works for both students and hostel owners.
              </p>
            </CardContent>
          </Card>
          <Card className="border-accent/20 hover:shadow-lg transition-all">
            <CardContent className="p-8">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <Eye className="h-6 w-6 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Pakistan where every student can find a safe, affordable, and well-managed place to live — and every hostel owner can run a thriving, professional operation without the paperwork chaos.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Home, num: "120+", label: "Hostels Listed" },
              { icon: GraduationCap, num: "4,000+", label: "Students Served" },
              { icon: Building2, num: "5", label: "Cities Covered" },
              { icon: Star, num: "4.7★", label: "Platform Rating" },
            ].map((s) => (
              <Card key={s.label} className="text-center hover:shadow-md transition">
                <CardContent className="p-6">
                  <s.icon className="h-7 w-7 text-primary mx-auto mb-3" />
                  <p className="font-display text-3xl font-bold text-foreground">{s.num}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">What We Stand For</h2>
            <p className="text-muted-foreground">The principles that guide everything we build.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <Card key={v.title} className="hover:shadow-md hover:-translate-y-1 transition-all">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <v.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Team */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">Meet the Team</h2>
            <p className="text-muted-foreground">The people who wake up every day thinking about your hostel experience.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {team.map((t) => (
              <Card key={t.name} className="text-center hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className={`h-14 w-14 rounded-full ${t.color} flex items-center justify-center mx-auto mb-4 text-xl font-bold font-display`}>
                    {t.initial}
                  </div>
                  <p className="font-display font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-5 opacity-80" />
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">Join the Aasra Community</h2>
          <p className="text-muted-foreground mb-8">Whether you're a student looking for your next home or an owner ready to modernize your hostel — we're here for you.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/signup">
              <Button size="lg" className="font-body">Get Started Free</Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="font-body">Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default About;
