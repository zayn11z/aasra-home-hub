import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, Megaphone } from "lucide-react";
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

const OwnerNotices = () => {
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "general", hostelName: "" });
  const [hostels, setHostels] = useState<string[]>([]);

  useEffect(() => {
    fetchNotices();
    fetchHostels();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get("/notices");
      setNotices(res.data.notices || []);
    } catch {
      toast({ title: "Failed to load notices", variant: "destructive" });
    }
  };

  const fetchHostels = async () => {
    try {
      const res = await api.get("/rooms");
      const rooms = res.data.rooms || [];
      const uniqueHostels = [...new Set(rooms.map((r: any) => r.hostel_name))] as string[];
      setHostels(uniqueHostels);
      if (uniqueHostels.length > 0) {
        setForm((prev) => ({ ...prev, hostelName: uniqueHostels[0] }));
      }
    } catch {
      // silent
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content || !form.hostelName) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    try {
      await api.post("/notices", form);
      toast({ title: "Notice published successfully!" });
      setForm({ title: "", content: "", category: "general", hostelName: hostels[0] || "" });
      setShowForm(false);
      fetchNotices();
    } catch {
      toast({ title: "Failed to publish notice", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notices/${id}`);
      toast({ title: "Notice deleted" });
      fetchNotices();
    } catch {
      toast({ title: "Failed to delete notice", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Notices & Announcements</h1>
            <p className="text-muted-foreground mt-1">Post and manage hostel announcements</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="font-body">
            <Plus className="h-4 w-4 mr-2" /> Post Notice
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 border-primary/20">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Hostel</Label>
                  <Select value={form.hostelName} onValueChange={(v) => setForm({ ...form, hostelName: v })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select hostel" /></SelectTrigger>
                    <SelectContent>
                      {hostels.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Notice title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea placeholder="Write your announcement..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["general", "maintenance", "event", "urgent"] as const).map((cat) => (
                      <Button key={cat} type="button" size="sm" variant={form.category === cat ? "default" : "outline"} className="font-body capitalize" onClick={() => setForm({ ...form, category: cat })}>
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="font-body">Publish</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="font-body">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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
                        <Badge variant="outline" className="text-xs">{notice.hostel_name}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notice.content}</p>
                      <p className="text-xs text-muted-foreground">{new Date(notice.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDelete(notice.id)}>
                    <Trash2 className="h-4 w-4" />
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
            <p className="text-sm">Post your first announcement</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerNotices;
