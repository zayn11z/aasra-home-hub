import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, GraduationCap, Building2, Phone, Mail, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnic?: string;
  address?: string;
  university?: string;
  emergency_contact?: string;
  emergency_name?: string;
  room_number: string;
  hostel_name: string;
  enrollment_date: string;
  remaining_fee?: number;
}

const OwnerStudents = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(res.data.students || []);
    } catch {
      toast({ title: "Failed to load students", variant: "destructive" });
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Archiving will unassign the student from the room. Continue?")) return;
    try {
      await api.put(`/students/${id}/archive`);
      toast({ title: "Student archived securely" });
      fetchStudents();
    } catch {
      toast({ title: "Failed to archive student", variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    if (students.length === 0) {
      toast({ title: "No students to export", variant: "destructive" });
      return;
    }

    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text("Aasra Hostel Management - Student Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = [
      "ID", 
      "Name", 
      "Phone", 
      "CNIC", 
      "Hostel", 
      "Room", 
      "Check-in", 
      "Remaining Fee", 
      "Emergency Contact"
    ];
    
    const tableRows = students.map(s => [
      `STU-${s.id}`,
      s.name || 'N/A',
      s.phone || 'N/A',
      s.cnic || 'N/A',
      s.hostel_name || 'N/A',
      s.room_number || 'N/A',
      new Date(s.enrollment_date).toLocaleDateString(),
      s.remaining_fee ? `Rs. ${s.remaining_fee}` : '0',
      s.emergency_contact ? `${s.emergency_name ? s.emergency_name + ' ' : ''}(${s.emergency_contact})` : 'N/A'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 } // using a dark blue/slate color
    });

    doc.save(`student_report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "Report exported as PDF successfully" });
  };


  const filtered = students.filter(s => 
    (s.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (s.room_number || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Student Management</h1>
            <p className="text-muted-foreground mt-1">View, manage, and archive assigned students</p>
          </div>
          <Button onClick={handleExportPDF} variant="outline" className="font-body">
            <Printer className="mr-2 h-4 w-4" /> Export Student Report
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by student name or room..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(student => (
            <Card key={student.id} className="hover:shadow-[var(--shadow-soft)] transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">ID: STU-{student.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleArchive(student.id)} title="Archive Student">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{student.hostel_name} - {student.room_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{student.phone || "Not Provided"}</span>
                  </div>
                  <div className="text-muted-foreground text-xs my-auto">
                    Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No active students found</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default OwnerStudents;
