import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, UserPlus, Mail, Lock, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/layout/AuthLayout";
import authHero from "@/assets/images/auth-hero.png";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Username validation: A-Z, a-z, 0-9 only, Max 20 characters
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(formData.username)) {
      toast({
        title: "Invalid Username",
        description: "Username must contain only letters and numbers (no spaces or special characters)",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.username.length < 4) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 4 characters long",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.username.length > 20) {
      toast({
        title: "Invalid Username",
        description: "Username must not exceed 20 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Invalid Name",
        description: "Name is required",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.name.length > 30) {
      toast({
        title: "Invalid Name",
        description: "Name must not exceed 30 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await register(formData.username, formData.email, formData.password, formData.name);

      const registerData = response as any;
      const otp = registerData?.otp;

      if (otp) {
        import('@/services/emailService').then(({ emailService }) => {
          emailService.sendVerificationEmail(formData.email, otp, formData.username)
            .catch(emailErr => console.error("Failed to send verification email:", emailErr));
        });
      }

      const message = (response && typeof response === 'object' && 'message' in response)
        ? (response as { message: string }).message
        : "Please verify your email";

      toast({
        title: "Registration Successful",
        description: message,
      });

      navigate("/verify-otp", {
        state: {
          email: formData.email,
          username: formData.username,
          mode: 'REGISTER'
        }
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.error || "Could not register",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join the arena of knowledge. Build your profile, challenge others, and master your subjects."
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
              placeholder="Unique Name"
              value={formData.username}
              onChange={handleChange}
              required
              className="bg-gray-50/50 border-gray-100 hover:border-primary/30 focus:bg-white focus:border-gray-100 focus:ring-4 focus:ring-primary/10 h-14 pl-12 rounded-2xl transition-all font-medium text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground font-bold text-sm ml-1">
            Display Name
          </Label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <UserPlus className="w-5 h-5" />
            </div>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="bg-gray-50/50 border-gray-100 hover:border-primary/30 focus:bg-white focus:border-gray-100 focus:ring-4 focus:ring-primary/10 h-14 pl-12 rounded-2xl transition-all font-medium text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-bold text-sm ml-1">
            Email Address
          </Label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="example@mail.com"
              value={formData.email}
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
              placeholder="Minimum 6 characters"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground font-bold text-sm ml-1">
            Confirm Password
          </Label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="bg-gray-50/50 border-gray-100 hover:border-primary/30 focus:bg-white focus:border-gray-100 focus:ring-4 focus:ring-primary/10 h-14 pl-12 pr-12 rounded-2xl transition-all font-medium text-base"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground leading-normal">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-black shadow-lg shadow-primary/25 transition-all active:scale-[0.98] mt-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : (
            "Create Account"
          )}
        </Button>

        <p className="text-center text-muted-foreground font-semibold pt-2">
          Already a veteran?{" "}
          <Link to="/login" className="text-primary hover:underline font-bold">
            Sign In
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
