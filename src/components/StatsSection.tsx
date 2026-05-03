import { Building2, Users, Zap, Star } from "lucide-react";

const stats = [
  { value: "500+", label: "Hostels Managed", icon: Building2 },
  { value: "50K+", label: "Residents Tracked", icon: Users },
  { value: "99.9%", label: "Uptime", icon: Zap },
  { value: "4.8", label: "User Rating", icon: Star },
];

const StatsSection = () => {
  return (
    <section className="py-16 bg-card">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative group rounded-2xl border border-border bg-background p-6 text-center transition-all hover:shadow-[var(--shadow-soft)] hover:-translate-y-1"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {s.value}
              </p>
              <p className="font-body text-muted-foreground text-xs mt-1 uppercase tracking-widest">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
