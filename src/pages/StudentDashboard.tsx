import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Inbox from "@/components/Inbox";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BedDouble, CreditCard, ClipboardList, User, Bell, Star, MessageSquare } from "lucide-react";
import api from "@/lib/api";

const baseFeatures = [
  { icon: BedDouble, title: "My Room", desc: "View your room details and roommate info.", href: "/student/room" },
  { icon: CreditCard, title: "Payments", desc: "Check pending dues and payment history.", href: "/payments" },
  { icon: ClipboardList, title: "Complaints", desc: "Raise and track your complaints.", href: "/student/complaints" },
  { icon: Bell, title: "Notices", desc: "View hostel announcements and updates.", href: "/student/notices" },
  { icon: Star, title: "Rate Hostel", desc: "Rate your hostel experience.", href: "/student/rate" },
  { icon: User, title: "My Profile", desc: "Update your personal details.", href: "/student/profile" },
];

const StudentDashboard = () => {
  const [unreadNotices, setUnreadNotices] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/notices");
        setUnreadNotices((res.data.notices || []).length);
      } catch {
        // silent
      }
    };
    fetchUnread();
  }, []);

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Student Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your hostel life from one place</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-body">
                <MessageSquare className="h-4 w-4 mr-2" />
                Inbox
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              <Inbox role="student" />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {baseFeatures.map((f) => (
            <Link to={f.href} key={f.title}>
              <Card className="group hover:shadow-[var(--shadow-soft)] hover:-translate-y-1 transition-all h-full cursor-pointer">
                <CardContent className="p-6">
                  <div className="relative h-11 w-11 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon className="h-5 w-5" />
                    {f.title === "Notices" && unreadNotices > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold shadow-sm">
                        {unreadNotices}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
