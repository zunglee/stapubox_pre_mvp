import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { RefreshCw, Timer, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  phoneNumber: string;
  title: string;
  description: string;
}

export default function OtpModal({
  isOpen,
  onClose,
  onVerify,
  phoneNumber,
  title,
  description
}: OtpModalProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [isOpen, countdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setCountdown(60);
      setCanResend(false);
      setIsVerifying(false);
      setIsResending(false);
    }
  }, [isOpen]);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a complete 4-digit OTP.",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(otp);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-submit when OTP is complete (4 digits)
  useEffect(() => {
    if (otp.length === 4 && !isVerifying) {
      handleVerify();
    }
  }, [otp]);

  const handleResend = async () => {
    setIsResending(true);
    
    try {
      const result = await authManager.sendOTP(phoneNumber);
      
      if (result.success) {
        toast({
          title: "OTP Resent",
          description: "A new OTP has been sent to your phone."
        });
        setCountdown(60);
        setCanResend(false);
        setOtp("");
      } else {
        toast({
          title: "Failed to Resend OTP",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && otp.length === 4) {
      handleVerify();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keypress", handleKeyPress);
      return () => document.removeEventListener("keypress", handleKeyPress);
    }
  }, [isOpen, otp]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {/* Back Button - Top Left */}
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

        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            Enter the 4-digit OTP sent to your phone
            <br />
            <span className="font-medium">+91 {phoneNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center">
            <InputOTP
              value={otp}
              onChange={setOtp}
              maxLength={4}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg" />
                <InputOTPSlot index={1} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg" />
                <InputOTPSlot index={2} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg" />
                <InputOTPSlot index={3} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Auto-submit status */}
          <div className="text-center">
            {otp.length === 4 && isVerifying ? (
              <Button disabled className="w-full player-theme">
                Verifying...
              </Button>
            ) : (
              <p className="text-sm text-gray-600">
                Enter 4-digit OTP to auto-verify
              </p>
            )}
          </div>

          {/* Resend Section */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Didn't receive the code?
            </p>
            
            {canResend ? (
              <Button
                variant="ghost"
                onClick={handleResend}
                disabled={isResending}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Timer className="w-4 h-4" />
                <span>Resend in {countdown}s</span>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Check your SMS inbox for the 4-digit verification code.
              <br />
              The code expires in 10 minutes.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
