import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, GraduationCap, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import axios from "axios";

type Role = "owner" | "student" | null;

const SignUp = () => {
  const [role, setRole] = useState<Role>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [hostelName, setHostelName] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [university, setUniversity] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !firstName || !lastName || !email || !password || !phone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!/^(03\d{9}|\+923\d{9})$/.test(phone)) {
      toast.error("Please enter a valid Pakistani phone number (e.g. 03001234567 or +923001234567).");
      return;
    }

    if (role === "owner" && (!cnic || !/^(\d{13}|\d{5}-\d{7}-\d{1})$/.test(cnic) || !hostelName)) {
      toast.error("Valid 13-digit CNIC and Hostel Name are required for owners.");
      return;
    }

    if (role === "student" && (!address || !university || !emergencyContact || !emergencyName)) {
      toast.error("Address, University, and Emergency Contact details are required for students.");
      return;
    }

    if (role === "student" && emergencyContact && !/^(03\d{9}|\+923\d{9})$/.test(emergencyContact)) {
      toast.error("Please enter a valid emergency phone number.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/signup", {
        name: `${firstName} ${lastName}`,
        email,
        password,
        role,
        phone,
        cnic: role === "owner" ? cnic : undefined,
        hostelName: role === "owner" ? hostelName : undefined,
        address: role === "student" ? address : undefined,
        university: role === "student" ? university : undefined,
        emergencyContact: role === "student" ? emergencyContact : undefined,
        emergencyName: role === "student" ? emergencyName : undefined,
      });

      if (response.data.message === "Verification required") {
        setRegisteredEmail(response.data.email);
        setShowVerification(true);
        toast.success("Account created! Please check your email for the OTP.");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Failed to create account.");
      } else {
        toast.error("Failed to connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit verification code.");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post("/auth/verify-email", {
        email: registeredEmail,
        code: verificationCode
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success("Email verified successfully!");
        
        if (response.data.user.role === "owner") {
          navigate("/owner");
        } else {
          navigate("/student");
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Invalid verification code.");
      } else {
        toast.error("Failed to connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="relative z-10 text-center px-12">
          <h2 className="font-display text-5xl text-primary-foreground mb-4">Find Your Home Away.</h2>
          <p className="text-primary-foreground/80 text-lg">Join thousands managing hostels smarter with Aasra.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          <h1 className="font-display text-3xl mb-2">
            {showVerification ? "Verify your email" : "Create your account"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {showVerification ? "Check your inbox for the OTP" : "Choose how you want to use Aasra"}
          </p>

          {showVerification ? (
            <div className="space-y-6 mt-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-4">
                  We've sent a 6-digit verification code to <br/>
                  <span className="font-medium text-foreground">{registeredEmail}</span>
                </p>
              </div>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
                  <Input 
                    id="code" 
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value)} 
                    placeholder="123456" 
                    maxLength={6} 
                    className="mt-1.5 text-center text-2xl tracking-[0.5em] font-mono h-14" 
                  />
                </div>
                <Button className="w-full font-semibold py-5 shadow-[var(--shadow-warm)]" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
                <div className="pt-4 text-center">
                   <button type="button" onClick={() => setShowVerification(false)} className="text-sm text-primary hover:underline">
                     Change email or sign up again
                   </button>
                </div>
              </form>
            </div>
          ) : (
            <>

          {/* Role selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setRole("owner")}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                role === "owner"
                  ? "border-primary bg-primary/5 shadow-[var(--shadow-warm)]"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Building2 className={`h-6 w-6 mb-3 ${role === "owner" ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-semibold text-sm">Hostel Owner</p>
              <p className="text-muted-foreground text-xs mt-1">List & manage your hostels</p>
            </button>
            <button
              onClick={() => setRole("student")}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                role === "student"
                  ? "border-primary bg-primary/5 shadow-[var(--shadow-warm)]"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <GraduationCap className={`h-6 w-6 mb-3 ${role === "student" ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-semibold text-sm">Student</p>
              <p className="text-muted-foreground text-xs mt-1">Find & book rooms</p>
            </button>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSignUp}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium space-x-2">
                  <span>First Name</span>
                  <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-normal">(Cannot be changed later)</span>
                </Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={20} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={20} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium space-x-2">
                <span>Phone Number</span>
                <span className="text-[10px] text-muted-foreground font-normal">(Format: 03XXXXXXXXX or +923XXXXXXXXX)</span>
              </Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))} placeholder="03XXXXXXXXX" maxLength={13} className="mt-1.5" />
            </div>

            {role === "student" && (
              <>
                <div>
                  <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="university" className="text-sm font-medium">University</Label>
                  <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} className="mt-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyName" className="text-sm font-medium">Emergency Contact Name</Label>
                    <Input id="emergencyName" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} maxLength={20} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContact" className="text-sm font-medium space-x-2">
                      <span>Emergency Phone</span>
                      <span className="text-[10px] text-muted-foreground font-normal">(Format: 03XXXXXXXXX or +923XXXXXXXXX)</span>
                    </Label>
                    <Input id="emergencyContact" type="tel" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value.replace(/[^\d+]/g, ''))} placeholder="03XXXXXXXXX" maxLength={13} className="mt-1.5" />
                  </div>
                </div>
              </>
            )}

            {role === "owner" && (
              <>
                <div>
                  <Label htmlFor="cnic" className="text-sm font-medium">CNIC</Label>
                  <Input id="cnic" value={cnic} onChange={(e) => setCnic(e.target.value.replace(/[^\d-]/g, ''))} placeholder="12345-1234567-1" className="mt-1.5" maxLength={15} />
                </div>
                <div>
                  <Label htmlFor="hostelName" className="text-sm font-medium">Hostel Name</Label>
                  <Input id="hostelName" value={hostelName} onChange={(e) => setHostelName(e.target.value)} maxLength={40} className="mt-1.5" />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" />
            </div>
            <Button className="w-full font-semibold py-5 shadow-[var(--shadow-warm)]" disabled={!role || isLoading}>
              {isLoading ? "Signing up..." : (role ? `Sign up as ${role === "owner" ? "Hostel Owner" : "Student"}` : "Select a role to continue")}
            </Button>
          </form>
          </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
