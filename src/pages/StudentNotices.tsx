import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Megaphone, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  hostel_name: string;
  created_at: string;
}

const categoryColor: Record<string, string> = {
  general: "bg-secondary text-secondary-foreground",
  maintenance: "bg-yellow-100 text-yellow-700",
  event: "bg-blue-100 text-blue-700",
  urgent: "bg-red-100 text-red-700",
};

const StudentNotices = () => {
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get("/notices");
      setNotices(res.data.notices || []);
    } catch {
      // student may not be assigned to any hostel yet
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.post(`/notices/${id}/dismiss`);
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast({ title: "Failed to dismiss notice", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Notices & Announcements</h1>
          <p className="text-muted-foreground mt-1">Stay updated with hostel announcements</p>
        </div>

        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} className="hover:shadow-[var(--shadow-soft)] transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Megaphone className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{notice.title}</h3>
                        <Badge className={`text-xs border-0 capitalize ${categoryColor[notice.category] || categoryColor.general}`}>{notice.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notice.content}</p>
                      <p className="text-xs text-muted-foreground">{new Date(notice.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 rounded-full h-8 w-8"
                    onClick={() => handleDismiss(notice.id)}
                    title="Mark as read"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {notices.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No notices yet</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentNotices;
