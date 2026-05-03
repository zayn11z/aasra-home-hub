import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, GraduationCap, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import axios from "axios";

const StudentProfile = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "Not Provided",
    university: "Not Provided",
    studentId: "",
    emergencyContact: "Not Provided",
    emergencyName: "Not Provided",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        const u = res.data.user;
        setProfile(prev => ({
          ...prev,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          address: u.address || "Not Provided",
          university: u.university || "Not Provided",
          emergencyContact: u.emergency_contact || "Not Provided",
          emergencyName: u.emergency_name || "Not Provided",
          studentId: `STU-${u.id.toString().padStart(4, '0')}`,
        }));
      })
      .catch((error) => {
        console.error("Failure in /auth/me:", error);
        toast({ title: "Failed to load profile", description: error?.response?.data?.message || error.message, variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      toast({ title: "Validation Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    if (profile.phone && profile.phone !== "Not Provided" && !/^(03\d{9}|\+923\d{9})$/.test(profile.phone)) {
      toast({ title: "Validation Error", description: "Please enter a valid Pakistani phone number.", variant: "destructive" });
      return;
    }

    if (profile.emergencyContact && profile.emergencyContact !== "Not Provided" && !/^(03\d{9}|\+923\d{9})$/.test(profile.emergencyContact)) {
      toast({ title: "Validation Error", description: "Please enter a valid emergency contact number.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = { 
        email: profile.email, 
        phone: profile.phone,
        address: profile.address,
        university: profile.university,
        emergencyContact: profile.emergencyContact,
        emergencyName: profile.emergencyName
      };
      await api.put('/auth/profile', payload);
      setEditing(false);
      toast({ title: "Profile updated successfully!" });
      
      // Update local storage so navbar syncs
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        u.email = payload.email;
        u.phone = payload.phone;
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast({ title: "Update Failed", description: error.response.data.message, variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">View and update your personal details</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary font-display text-xl">
                  {profile.name ? profile.name.split(" ").map((n) => n[0]).join("") : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.studentId}</p>
              </div>
              <div className="flex-1" />
              <Button variant={editing ? "default" : "outline"} className="font-body" onClick={editing ? handleSave : () => setEditing(true)} disabled={saving}>
                {editing ? <><Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}</> : "Edit Profile"}
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5" /> Full Name</Label>
                {editing ? (
                  <div>
                    <Input value={profile.name} disabled className="bg-muted text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> Name cannot be changed</p>
                  </div>
                ) : (
                  <p className="font-medium text-foreground">{profile.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> Email</Label>
                {editing ? (
                  <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                ) : (
                  <p className="font-medium text-foreground">{profile.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> Phone</Label>
                {editing ? (
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/[^\d+]/g, '') })} maxLength={13} />
                ) : (
                  <p className="font-medium text-foreground">{profile.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="h-3.5 w-3.5" /> University</Label>
                {editing ? (
                  <Input value={profile.university} onChange={(e) => setProfile({ ...profile, university: e.target.value })} />
                ) : (
                  <p className="font-medium text-foreground">{profile.university}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Address</Label>
                {editing ? (
                  <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                ) : (
                  <p className="font-medium text-foreground">{profile.address}</p>
                )}
              </div>

              <div className="sm:col-span-2 pt-4 border-t border-border">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Emergency Contact</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Contact Name</Label>
                    {editing ? (
                      <Input value={profile.emergencyName} onChange={(e) => setProfile({ ...profile, emergencyName: e.target.value })} />
                    ) : (
                      <p className="font-medium text-foreground">{profile.emergencyName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Contact Number</Label>
                    {editing ? (
                      <Input value={profile.emergencyContact} onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value.replace(/[^\d+]/g, '') })} maxLength={13} />
                    ) : (
                      <p className="font-medium text-foreground">{profile.emergencyContact}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProfile;
