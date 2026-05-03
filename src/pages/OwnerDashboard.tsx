import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Inbox from "@/components/Inbox";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "react-router-dom";
import { BedDouble, CreditCard, ClipboardList, Bell, GraduationCap, MessageSquare, Star, Users, Building, AlertTriangle, ChevronDown, ChevronUp, Eye, MessageCircle } from "lucide-react";
import api from "@/lib/api";

const ownerFeatures = [
  { icon: Building, title: "My Hostels & Chats", desc: "View your grouped properties and student chats.", href: "/owner/hostels" },
  { icon: BedDouble, title: "Room Management", desc: "Add, edit, and manage hostel rooms.", href: "/owner/rooms" },
  { icon: GraduationCap, title: "Student Index", desc: "Archive and inspect student registers.", href: "/owner/students" },
  { icon: CreditCard, title: "Fee Management", desc: "Track all student payments and dues.", href: "/owner/payments" },
  { icon: ClipboardList, title: "Complaints", desc: "Review and resolve student complaints.", href: "/owner/complaints" },
  { icon: Bell, title: "Notices", desc: "Post and manage announcements.", href: "/owner/notices" },
];

interface HostelReview {
  hostel_name: string;
  avgRating: number;
  totalReviews: number;
  avgCleanliness: number;
  avgFood: number;
  avgStaff: number;
  avgFacilities: number;
  avgSecurity: number;
  comments: { text: string; date: string; rating: number }[];
}

const segmentLabels: Record<string, string> = {
  avgCleanliness: "Cleanliness",
  avgFood: "Food Quality",
  avgStaff: "Staff Behavior",
  avgFacilities: "Facilities",
  avgSecurity: "Security",
};

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    pendingDues: 0,
    activeComplaints: 0,
    averageRating: "0.0"
  });
  const [ratingExpanded, setRatingExpanded] = useState(false);
  const [hostelReviews, setHostelReviews] = useState<HostelReview[]>([]);
  const [detailHostel, setDetailHostel] = useState<HostelReview | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.get('/stats').then((res) => {
      setStats(res.data.stats || stats);
    }).catch(console.error);
  }, []);

  const handleRatingExpand = async () => {
    if (!ratingExpanded) {
      try {
        const res = await api.get('/reviews/owner-details');
        setHostelReviews(res.data.hostels || []);
      } catch {
        // silent
      }
    }
    setRatingExpanded(!ratingExpanded);
  };

  const getWorstSegment = (h: HostelReview) => {
    const segments = [
      { key: "avgCleanliness", val: h.avgCleanliness },
      { key: "avgFood", val: h.avgFood },
      { key: "avgStaff", val: h.avgStaff },
      { key: "avgFacilities", val: h.avgFacilities },
      { key: "avgSecurity", val: h.avgSecurity },
    ].filter(s => s.val > 0);
    if (segments.length === 0) return null;
    return segments.reduce((min, s) => s.val < min.val ? s : min, segments[0]);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`h-4 w-4 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-border"}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Owner Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your hostel operations</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-body">
                <MessageSquare className="h-4 w-4 mr-2" />
                Inbox
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              <Inbox role="owner" />
            </DialogContent>
          </Dialog>
        </div>

        {/* Dynamic FR-09 Dashboard Statistics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card className="hover:shadow-md transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalRooms}</h3>
              </div>
              <Building className="h-8 w-8 text-primary/40" />
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                <h3 className="text-2xl font-bold mt-1">{stats.occupiedRooms}</h3>
              </div>
              <Users className="h-8 w-8 text-blue-500/40" />
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Dues</p>
                <h3 className="text-2xl font-bold mt-1">PKR {stats.pendingDues.toLocaleString()}</h3>
              </div>
              <CreditCard className="h-8 w-8 text-red-500/40" />
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Complaints</p>
                <h3 className="text-2xl font-bold mt-1">{stats.activeComplaints}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500/40" />
            </CardContent>
          </Card>
        </div>

        {/* Expandable Average Rating Card */}
        <Card className="mb-8 hover:shadow-md transition cursor-pointer">
          <CardContent className="p-0">
            <button onClick={handleRatingExpand} className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Hostel Rating</p>
                  <h3 className="text-2xl font-bold">{stats.averageRating} <span className="text-sm font-normal text-muted-foreground">/ 5</span></h3>
                </div>
              </div>
              {ratingExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>

            {ratingExpanded && (
              <div className="border-t px-4 pb-4 pt-3 space-y-3">
                {hostelReviews.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No reviews yet for any of your hostels.</p>
                )}
                {hostelReviews.map((h) => {
                  const worst = getWorstSegment(h);
                  return (
                    <div key={h.hostel_name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Building className="h-5 w-5 text-primary/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{h.hostel_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {renderStars(h.avgRating)}
                            <span className="text-xs text-muted-foreground">{h.avgRating}/5 · {h.totalReviews} review{h.totalReviews !== 1 ? 's' : ''}</span>
                          </div>
                          {worst && (
                            <p className="text-xs text-red-500 mt-0.5">Lowest: {segmentLabels[worst.key]} ({worst.val}/5)</p>
                          )}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="font-body shrink-0 ml-3" onClick={() => setDetailHostel(h)}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="font-display">{h.hostel_name} — Rating Breakdown</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-2">
                            {/* Segment Bars */}
                            <div className="space-y-3">
                              {Object.entries(segmentLabels).map(([key, label]) => {
                                const val = (h as any)[key] as number;
                                const pct = (val / 5) * 100;
                                const isWorst = worst?.key === key;
                                return (
                                  <div key={key}>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className={`font-medium ${isWorst ? 'text-red-600' : 'text-foreground'}`}>{label} {isWorst && '⚠️'}</span>
                                      <span className="text-muted-foreground">{val}/5</span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${isWorst ? 'bg-red-400' : pct >= 70 ? 'bg-green-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Anonymous Comments */}
                            {h.comments.length > 0 && (
                              <div className="border-t pt-4">
                                <p className="font-semibold text-foreground text-sm mb-3 flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Anonymous Student Feedback</p>
                                <div className="space-y-2">
                                  {h.comments.map((c, i) => (
                                    <Collapsible key={i}>
                                      <CollapsibleTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-between font-body text-muted-foreground hover:text-foreground h-auto py-2 px-3 rounded-lg bg-muted/50"
                                          onClick={() => setExpandedComments(prev => ({ ...prev, [i]: !prev[i] }))}
                                        >
                                          <span className="flex items-center gap-2">
                                            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate max-w-[200px] text-left">
                                              {expandedComments[i] ? "Hide comment" : "Tap to view comment"}
                                            </span>
                                          </span>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {renderStars(c.rating)}
                                          </div>
                                        </Button>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/30 rounded-b-lg border-x border-b">
                                          <p className="italic">"{c.text}"</p>
                                          <p className="text-xs mt-1.5 text-muted-foreground/70">{new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ))}
                                </div>
                              </div>
                            )}

                            {h.comments.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-2">No written feedback yet.</p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ownerFeatures.map((f) => (
            <Link to={f.href} key={f.title}>
              <Card className="group hover:shadow-[var(--shadow-soft)] hover:-translate-y-1 transition-all h-full cursor-pointer">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon className="h-5 w-5" />
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

export default OwnerDashboard;
