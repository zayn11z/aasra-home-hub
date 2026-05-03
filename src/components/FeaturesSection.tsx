import { Building2, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Building2, title: "Owner Dashboard", desc: "Manage rooms, track payments, handle complaints, and oversee your entire hostel operations from one place.", href: "/owner" },
  { icon: GraduationCap, title: "Student Dashboard", desc: "View your room details, pay fees, raise complaints, check notices, and manage your hostel life effortlessly.", href: "/student" },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="font-body font-semibold text-primary mb-2 tracking-wide uppercase text-sm">Features</p>
          <h2 className="font-display text-3xl md:text-4xl">Everything you need to manage your hostel</h2>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {features.map((f, i) => (
            <div key={f.title} className="group p-6 rounded-xl bg-background border border-border hover:shadow-[var(--shadow-warm)] transition-all duration-300 opacity-0 animate-fade-up h-full" style={{ animationDelay: `${0.1 * i}s` }}>
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl mb-2">{f.title}</h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
