import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/layout/AuthLayout";
import { Loader2 } from "lucide-react";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const email = location.state?.email || "your@email.com";
  const username = location.state?.username || "User";

  const mode = location.state?.mode || 'REGISTER'; // Default to register if not specified
  const { completeLogin } = useAuth();

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        const response = await authService.verifyLoginOTP(email, otp);
        if (response.success && response.token && response.user) {
          completeLogin(response.user, response.token);
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
          navigate("/");
        }
      } else {
        // Register mode
        const response = await authService.verifyEmail(email, otp);
        toast({
          title: "Verification Successful",
          description: response.message || "Your account has been verified",
        });
        navigate("/login");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.response?.data?.error || "Invalid OTP code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const response = await authService.resendOtp(email);
      const otp = (response as any).otp;

      if (otp) {
        import('@/services/emailService').then(({ emailService }) => {
          emailService.sendVerificationEmail(email, otp, username)
            .catch(emailErr => console.error("Failed to send verification email:", emailErr));
        });
      }

      toast({
        title: "Code Sent",
        description: `A new verification code has been sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to resend code",
        description: error.response?.data?.error || "Could not resend OTP",
      });
    }
  };

  return (
    <AuthLayout
      title="Verify Your Account"
      subtitle={`Enter the 6-digit code sent to ${email}`}
      backTo="/login"
      backText="Back to Login"
    >
      <form onSubmit={handleVerify} className="space-y-8">
        <div className="flex justify-center items-center py-4">
          <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-10 h-12 text-lg sm:w-14 sm:h-16 sm:text-2xl font-bold border-gray-200 bg-gray-50 focus:bg-white focus:border-primary transition-all rounded-l-xl" />
              <InputOTPSlot index={1} className="w-10 h-12 text-lg sm:w-14 sm:h-16 sm:text-2xl font-bold border-gray-200 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
              <InputOTPSlot index={2} className="w-10 h-12 text-lg sm:w-14 sm:h-16 sm:text-2xl font-bold border-gray-200 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
              <InputOTPSlot index={3} className="w-10 h-12 text-lg sm:w-14 sm:h-16 sm:text-2xl font-bold border-gray-200 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
              <InputOTPSlot index={4} className="w-10 h-12 text-lg sm:w-14 sm:h-16 sm:text-2xl font-bold border-gray-200 bg-gray-50 focus:bg-white focus:border-primary transition-all" />
              <InputOTPSlot index={5} className="w-10 h-12 text-lg sm:w-14 sm:h-16 sm:text-2xl font-bold border-gray-200 bg-gray-50 focus:bg-white focus:border-primary transition-all rounded-r-xl" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="submit"
          disabled={isLoading || otp.length !== 6}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-black shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </div>
          ) : (
            "Verify Account"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground font-medium">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="text-primary hover:underline font-bold"
          >
            Resend Code
          </button>
        </p>
      </form>
    </AuthLayout>
  );
};

export default VerifyOtp;
