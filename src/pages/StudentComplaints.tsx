import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Complaint {
  id: string;
  category: string;
  description: string;
  status: "Pending" | "In Progress" | "Resolved";
  created_at: string;
}

const statusConfig: Record<string, { label: string, icon: any, color: string }> = {
  "Pending": { label: "Pending", icon: AlertCircle, color: "bg-red-100 text-red-700" },
  "In Progress": { label: "In Progress", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  "Resolved": { label: "Resolved", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
};

const StudentComplaints = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ hostelName: "", category: "Maintenance", description: "" });
  const [assignedRoom, setAssignedRoom] = useState<any>(null);

  useEffect(() => {
    fetchComplaints();
    fetchMyRoom();
  }, []);

  const fetchMyRoom = async () => {
    try {
      const res = await api.get("/rooms/my-room");
      if (res.data.room) {
        setAssignedRoom(res.data.room);
        setForm(prev => ({ ...prev, hostelName: res.data.room.hostel_name }));
      }
    } catch {
      // Student has no room assigned
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints");
      setComplaints(res.data.complaints || []);
    } catch {
      toast({ title: "Failed to load complaints", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description || !form.hostelName) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    try {
      await api.post("/complaints", form);
      setForm({ hostelName: assignedRoom?.hostel_name || "", category: "Maintenance", description: "" });
      setShowForm(false);
      toast({ title: "Complaint submitted", description: "The hostel owner will be notified." });
      fetchComplaints();
    } catch {
      toast({ title: "Submission failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">My Complaints</h1>
            <p className="text-muted-foreground mt-1">Raise and track your hostel complaints</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="font-body" disabled={!assignedRoom}>
            <Plus className="h-4 w-4 mr-2" /> New Complaint
          </Button>
        </div>

        {!assignedRoom && (
          <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">You must be assigned to a room before you can submit a complaint.</p>
          </div>
        )}

        {showForm && (
          <Card className="mb-8 border-primary/20">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Hostel Name</Label>
                  <Input readOnly value={form.hostelName} className="bg-muted text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Cleanliness">Cleanliness</SelectItem>
                      <SelectItem value="Noise">Noise Tracker</SelectItem>
                      <SelectItem value="Security">Security Issue</SelectItem>
                      <SelectItem value="Other">Other Issues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Explain the issue in detail..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[100px]" />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="font-body">Submit Complaint</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="font-body">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {complaints.map((c) => {
            const config = statusConfig[c.status];
            const StatusIcon = config.icon;
            return (
              <Card key={c.id} className="hover:shadow-[var(--shadow-soft)] transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{c.category}</h3>
                        <Badge className={`text-xs border-0 ${config.color}`}>{config.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 pl-[52px]">{c.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {complaints.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No complaints raised</p>
            <p className="text-sm">Click "New Complaint" if you have an issue</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentComplaints;
