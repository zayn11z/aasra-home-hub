import { useState, useEffect } from "react";
import { ArrowRight, Building2, Shield, CreditCard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import hostelIllustration from "@/assets/hostel-illustration.png";

const quickFeatures = [
  { icon: Search, text: "Search Hostels" },
  { icon: Building2, text: "Compare Rooms" },
  { icon: CreditCard, text: "Easy Payments" },
  { icon: Shield, text: "Verified Listings" },
];

const HeroSection = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);

  return (
    <section className="relative overflow-hidden pb-12">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Gradient blob */}
      <div className="absolute -right-32 top-1/3 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--hero-gradient)' }} />

      <div className="container mx-auto px-6 relative z-10 pt-4 md:pt-6">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Left: Text content */}
          <div>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.1] mb-5 opacity-0 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Find Your Home{" "}
              <span className="text-primary">Away.</span>
            </h1>

            <p className="font-body text-base md:text-lg text-muted-foreground max-w-md mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '0.25s' }}>
              Streamline room allocation, track payments, manage complaints, and keep your hostel running smoothly — all from one powerful dashboard.
            </p>

            <div className="flex flex-wrap gap-3 mb-10 opacity-0 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <Link to={user ? (user.role === 'owner' ? '/owner' : '/student') : '/signup'}>
                <Button size="lg" className="font-body font-semibold text-base px-8 py-6 shadow-[var(--shadow-warm)] border border-primary/20 hover:border-primary/50 hover:bg-primary/95 transition-all">
                  {user ? "Go to Dashboard" : "Get Started"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {!user && (
                <Link to="/login">
                  <Button variant="outline" size="lg" className="font-body font-semibold text-base px-8 py-6 hover:bg-secondary/50 transition-all">
                    Log In
                  </Button>
                </Link>
              )}
            </div>

            {/* Quick feature pills */}
            <div className="flex flex-wrap gap-3 opacity-0 animate-fade-up" style={{ animationDelay: '0.55s' }}>
              {quickFeatures.map((f) => (
                <div
                  key={f.text}
                  className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-body text-muted-foreground"
                >
                  <f.icon className="h-4 w-4 text-primary" />
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="hidden md:flex justify-center opacity-0 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <img
              src={hostelIllustration}
              alt="Hostel illustration"
              className="w-full max-w-md object-contain drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
