import { Menu, LogOut, LayoutDashboard, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import aasraLogo from "@/assets/aasra-logo.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Hostels", href: "/hostels" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-0">
          <img src={aasraLogo} alt="Aasra Logo" className="h-9 w-9 object-contain -mr-1" />
          <span className="font-body font-semibold text-primary text-lg tracking-wide">AASRA</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.filter(l => !(user?.role === 'owner' && l.label === 'Hostels')).map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: Login + Hamburger */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login" className="hidden md:block">
                <Button variant="outline" size="sm" className="font-body font-medium">
                  Log In
                </Button>
              </Link>
              <Link to="/signup" className="hidden md:block">
                <Button size="sm" className="font-body font-medium bg-primary hover:bg-primary/90">
                  Sign Up
                </Button>
              </Link>
            </>
          ) : (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground break-all">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(user.role === 'owner' ? '/owner' : '/student')} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Hamburger menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background">
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.filter(l => !(user?.role === 'owner' && l.label === 'Hostels')).map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="font-body text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="border-border" />
                
                {user ? (
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center gap-3 mb-2 pb-4 border-b border-border">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{user.role}</p>
                      </div>
                    </div>
                    
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-widest">Dashboard</p>
                    <Link to={user.role === 'owner' ? '/owner' : '/student'} className="font-body text-lg font-medium text-foreground hover:text-primary transition-colors">
                      {user.role === 'owner' ? 'Owner Dashboard' : 'Student Dashboard'}
                    </Link>
                    
                    <Button variant="outline" className="w-full font-body mt-4 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="outline" className="w-full font-body">Log In</Button>
                    </Link>
                    <Link to="/signup">
                      <Button className="w-full font-body">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
