import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import axios from "axios";

const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("A 6-digit reset code has been sent to your email.");
      setStep(2);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Failed to send reset code.");
      } else {
        toast.error("Failed to connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword) {
      toast.error("Please enter the code and a new password.");
      return;
    }

    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code correctly.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", { email, code, newPassword });
      toast.success("Password updated successfully! Please log in.");
      navigate("/login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Invalid or expired code.");
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
          <h2 className="font-display text-5xl text-primary-foreground mb-4">Reset Password</h2>
          <p className="text-primary-foreground/80 text-lg">Securely recover your account and get back on track.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>

          <h1 className="font-display text-3xl mb-2">Forgot Password?</h1>
          <p className="text-muted-foreground mb-8">
            {step === 1 ? "Enter your email address to receive a 6-digit reset code." : "Enter the code sent to your email and your new password."}
          </p>

          {step === 1 ? (
            <form className="space-y-4" onSubmit={handleSendCode}>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" />
              </div>
              <Button className="w-full font-semibold py-5 shadow-[var(--shadow-warm)]" disabled={isLoading}>
                {isLoading ? "Sending Code..." : "Send Reset Code"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <div className="mt-1.5 p-2 bg-secondary rounded-md text-sm text-foreground">{email}</div>
              </div>
              <div>
                <Label htmlFor="code" className="text-sm font-medium">6-Digit Code</Label>
                <Input id="code" type="text" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="mt-1.5 font-mono tracking-widest text-center text-lg" />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" />
              </div>
              <Button className="w-full font-semibold py-5 shadow-[var(--shadow-warm)]" disabled={isLoading}>
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Remembered your password?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
