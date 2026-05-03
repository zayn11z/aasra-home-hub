import { Building2 } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-foreground text-background/70 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-display text-xl text-background">Aasra</span>
          </div>
          <p className="font-body text-sm">© 2026 Aasra. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
