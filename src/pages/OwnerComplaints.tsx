import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardList, AlertCircle, CheckCircle2, Clock, MessageSquare, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Complaint {
  id: string;
  student_name: string;
  room_number: string;
  hostel_name: string;
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

const priorityColor = {
  low: "bg-secondary text-secondary-foreground",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

const OwnerComplaints = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints");
      setComplaints(res.data.complaints || []);
    } catch {
      toast({ title: "Failed to load complaints", variant: "destructive" });
    }
  };

  const filtered = complaints.filter((c) =>
    statusFilter === "all" || c.status === statusFilter
  );

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.put(`/complaints/${id}/status`, { status: newStatus });
      toast({ title: `Complaint marked as ${newStatus}` });
      fetchComplaints();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    if (complaints.length === 0) {
      toast({ title: "No complaints to export", variant: "destructive" });
      return;
    }

    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text("Aasra Hostel Management - Complaints Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = [
      "ID", 
      "Student", 
      "Hostel", 
      "Room", 
      "Category", 
      "Description", 
      "Status", 
      "Date"
    ];
    
    const tableRows = complaints.map(c => [
      `CMP-${c.id}`,
      c.student_name || 'N/A',
      c.hostel_name || 'N/A',
      c.room_number || 'N/A',
      c.category || 'N/A',
      c.description || 'N/A',
      c.status,
      new Date(c.created_at).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 } // using a dark blue/slate color
    });

    doc.save(`complaints_report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "Report exported as PDF successfully" });
  };

  const openCount = complaints.filter((c) => c.status === "Pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "In Progress").length;

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Complaint Management</h1>
            <p className="text-muted-foreground mt-1">Review and resolve student complaints</p>
          </div>
          <Button onClick={handleExportPDF} variant="outline" className="font-body">
            <Printer className="mr-2 h-4 w-4" /> Export Complaints Report
          </Button>
        </div>

        {/* Summary */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-500" /> {openCount} Open
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1.5 gap-1.5">
            <Clock className="h-3.5 w-3.5 text-yellow-500" /> {inProgressCount} In Progress
          </Badge>
          <div className="flex-1" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Complaint List */}
        <div className="space-y-4">
          {filtered.map((c) => {
            const config = statusConfig[c.status];
            const StatusIcon = config.icon;
            return (
              <Card key={c.id} className="hover:shadow-[var(--shadow-soft)] transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{c.category}</h3>
                        <p className="text-sm text-muted-foreground">{c.student_name} · {c.hostel_name} · Room {c.room_number || "Unassigned"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge className={`text-xs border-0 ${config.color}`}>{config.label}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 pl-[52px]">{c.description}</p>

                  <div className="flex gap-2 pl-[52px] flex-wrap">
                    {c.status !== "Resolved" && (
                      <>
                        {c.status === "Pending" && (
                          <Button size="sm" variant="outline" className="font-body" onClick={() => handleStatusChange(c.id, "In Progress")}>
                            Mark In Progress
                          </Button>
                        )}
                        <Button size="sm" className="font-body" onClick={() => handleStatusChange(c.id, "Resolved")}>
                          Resolve
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No complaints found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerComplaints;
