import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authManager, useAuth } from "@/lib/auth";
import OtpModal from "@/components/auth/otp-modal";
import { LogIn, ArrowLeft } from "lucide-react";
import { enablePendingLikeProcessing } from "@/lib/pendingActions";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authManager.sendOTP(phoneNumber);
      
      if (result.success) {
        setShowOtpModal(true);
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the verification code."
        });
      } else {
        toast({
          title: "Failed to Send OTP",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    const result = await authManager.verifyOTP(phoneNumber, otp);
    
    if (result.success) {
      if (result.requiresRegistration) {
        navigate(`/register?phone=${phoneNumber}`);
        toast({
          title: "Account Not Found",
          description: "Please complete your registration."
        });
      } else {
        enablePendingLikeProcessing();
        
        // Check for pending like action to redirect to appropriate page
        const pendingLike = localStorage.getItem('stapubox_pending_like');
        if (pendingLike) {
          try {
            const parsed = JSON.parse(pendingLike);
            if (parsed.returnUrl) {
              const url = new URL(parsed.returnUrl);
              if (url.pathname.includes('/feed')) {
                navigate("/feed");
              } else {
                navigate("/");
              }
            } else {
              navigate("/");
            }
          } catch (error) {
            navigate("/");
          }
        } else {
          navigate("/");
        }
        
        toast({
          title: "Login Successful",
          description: "Welcome back to StapuBox!"
        });
      }
    } else {
      toast({
        title: "Verification Failed",
        description: result.message,
        variant: "destructive"
      });
    }
    
    setShowOtpModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home - Top Left */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full space-y-8">
          <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your StapuBox account using your phone number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="rounded-l-none"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full player-theme" 
                disabled={isLoading}
              >
                {isLoading ? (
                  "Sending OTP..."
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Send OTP
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-600"
                  onClick={() => navigate("/register")}
                >
                  Sign up here
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

          <OtpModal
            isOpen={showOtpModal}
            onClose={() => setShowOtpModal(false)}
            onVerify={handleOtpVerify}
            phoneNumber={phoneNumber}
            title="Enter OTP"
            description="Please enter the 4-digit code sent to your phone"
          />
        </div>
      </div>
    </div>
  );
}
