import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, IndianRupee, CalendarDays, AlertTriangle, CheckCircle2, Clock, Download, Users, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Payment {
  id: string;
  studentName: string;
  hostelName: string;
  roomNumber: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  month: string;
  receiptId?: string;
}



const statusConfig = {
  paid: { label: "Paid", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  overdue: { label: "Overdue", icon: AlertTriangle, color: "bg-red-100 text-red-700" },
};

const OwnerPayments = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch payments from backend
  useEffect(() => {
    api.get("/payments")
      .then((res) => {
        const rows = (res.data.payments || []).map((p: any) => ({
          id: String(p.id),
          studentName: p.student_name || `Student #${p.student_id}`,
          hostelName: "",
          roomNumber: "",
          amount: p.amount,
          dueDate: p.date,
          status: p.status as Payment["status"],
          month: p.month || "",
          receiptId: p.receipt_id,
        }));
        setPayments(rows);
      })
      .catch(() => {});
  }, []);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.hostelName.toLowerCase().includes(search.toLowerCase()) ||
      p.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDue = payments.filter((p) => p.status !== "paid").reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === "overdue").length;
  const totalStudents = new Set(payments.map((p) => p.studentName)).size;

  const handleMarkPaid = (id: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "paid" as const, receiptId: `RCP-${Date.now()}` } : p
      )
    );
    toast({ title: "Payment marked as paid", description: "Receipt generated successfully." });
  };

  const handleSendReminder = (name: string) => {
    toast({ title: "Reminder sent", description: `Payment reminder sent to ${name}.` });
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Fee Management</h1>
            <p className="text-muted-foreground mt-1">Track all student payments, dues, and generate receipts</p>
          </div>
          <Button onClick={() => window.print()} variant="outline" className="font-body">
            <Printer className="mr-2 h-4 w-4" /> Export Collections Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="font-display text-2xl font-bold text-foreground">{totalStudents}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="font-display text-2xl font-bold text-foreground">PKR {totalCollected.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Dues</p>
                <p className="font-display text-2xl font-bold text-foreground">PKR {totalDue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="font-display text-2xl font-bold text-foreground">{overdueCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by student, hostel, or room..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment List */}
        <div className="space-y-3">
          {filtered.map((payment) => {
            const config = statusConfig[payment.status];
            const StatusIcon = config.icon;
            return (
              <Card key={payment.id} className="hover:shadow-[var(--shadow-soft)] transition-all">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{payment.studentName}</p>
                      <p className="text-sm text-muted-foreground">{payment.hostelName} · Room {payment.roomNumber}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{payment.month} · Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-foreground">PKR {payment.amount.toLocaleString()}</p>
                      <Badge className={`text-xs ${config.color} border-0`}>{config.label}</Badge>
                    </div>

                    {payment.status === "paid" ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="font-body">
                            <Download className="h-3.5 w-3.5 mr-1" /> Receipt
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="font-display">Payment Receipt</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Receipt ID</span><span className="font-medium">{payment.receiptId}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium">{payment.studentName}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Hostel</span><span className="font-medium">{payment.hostelName}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span className="font-medium">{payment.roomNumber}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Month</span><span className="font-medium">{payment.month}</span></div>
                            <hr className="border-border" />
                            <div className="flex justify-between text-base"><span className="font-semibold">Amount Paid</span><span className="font-display font-bold text-primary">PKR {payment.amount.toLocaleString()}</span></div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" className="font-body" onClick={() => handleMarkPaid(payment.id)}>
                          Mark Paid
                        </Button>
                        <Button size="sm" variant="outline" className="font-body" onClick={() => handleSendReminder(payment.studentName)}>
                          Remind
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No payments found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerPayments;
