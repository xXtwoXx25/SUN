import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/layout/AuthLayout";
import authHero from "@/assets/images/auth-hero.png";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login(formData.username, formData.password);

      if (response && (response as any).require2FA) {
        navigate("/login-2fa", {
          state: {
            userId: (response as any).userId,
            username: (response as any).username
          }
        });
        return;
      }

      if (response && 'requireOtp' in response && response.requireOtp) {
        toast({
          title: "2FA Required",
          description: response.message || "Please enter the OTP sent to your email",
        });
        navigate("/verify-otp", {
          state: {
            email: response.email,
            mode: 'LOGIN'
          }
        });
        return;
      }

      toast({
        title: "Welcome Back!",
        description: "You have successfully signed in",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.error || "Invalid username or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your learning journey and conquer the arena."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-foreground font-bold text-sm ml-1">
            Username
          </Label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <User className="w-5 h-5" />
            </div>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
              className="bg-gray-50/50 border-gray-100 hover:border-primary/30 focus:bg-white focus:border-gray-100 focus:ring-4 focus:ring-primary/10 h-14 pl-12 rounded-2xl transition-all font-medium text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground font-bold text-sm ml-1">
            Password
          </Label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="bg-gray-50/50 border-gray-100 hover:border-primary/30 focus:bg-white focus:border-gray-100 focus:ring-4 focus:ring-primary/10 h-14 pl-12 pr-12 rounded-2xl transition-all font-medium text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="rounded-md border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label
              htmlFor="rememberMe"
              className="text-xs font-semibold text-muted-foreground cursor-pointer select-none"
            >
              Remember Me
            </Label>
          </div>
          <Link
            to="/contact"
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-black shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing In...</span>
            </div>
          ) : (
            "Sign In"
          )}
        </Button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Or</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <p className="text-center text-muted-foreground font-semibold">
          New to the battlefield?{" "}
          <Link to="/register" className="text-primary hover:underline font-bold">
            Create Account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
