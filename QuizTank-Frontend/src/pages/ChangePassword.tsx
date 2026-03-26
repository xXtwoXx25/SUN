import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";

const ChangePassword = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);
        try {
            // Assuming this endpoint exists, or I will create it
            // Using direct axios call or via userService if I added it there.
            // I'll stick to a direct call here or mock it if strictly frontend first, but goal is full stack.
            // I'll assume endpoint /auth/change-password
            const API_URL = import.meta.env.VITE_API_URL;
            const token = localStorage.getItem('token');

            await axios.post(`${API_URL}/auth/change-password`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Password changed successfully");
            navigate("/settings");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-lg py-12 mx-auto">
            <Button variant="ghost" onClick={() => navigate("/settings")} className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="w-4 h-4" />
                Back to Settings
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">
                        Change Password
                    </CardTitle>
                    <CardDescription>
                        Ensure your account is using a long, random password to stay secure.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => navigate("/settings")}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Password
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default ChangePassword;
