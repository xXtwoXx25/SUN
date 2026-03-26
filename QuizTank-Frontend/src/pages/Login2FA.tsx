import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import axios from "axios";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import AuthLayout from "@/components/layout/AuthLayout";

const Login2FA = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { completeLogin } = useAuth();
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Get passed state
    const userId = location.state?.userId;
    const username = location.state?.username;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) return;

        setIsLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL;

            const response = await axios.post(`${API_URL}/auth/login-2fa-verify`, {
                userId,
                token: code
            });

            if (response.data.success) {
                toast.success("Login Successful");
                completeLogin(response.data.user, response.data.token);
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.error || "Invalid 2FA Code");
            } else {
                toast.error("Invalid 2FA Code");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Two-Factor Authentication"
            subtitle={username ? `Enter the 6-digit code for @${username}` : "Enter the 6-digit code from your authenticator app"}
            backTo="/login"
            backText="Back to Login"
        >
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex justify-center items-center py-4">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
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
                    disabled={isLoading || code.length !== 6}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-black shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Verifying...</span>
                        </div>
                    ) : (
                        "Verify and Login"
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground font-medium">
                    Lost your authenticator device?{" "}
                    <Link to="/contact" className="text-primary hover:underline font-bold">
                        Contact Support
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default Login2FA;
