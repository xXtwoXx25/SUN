import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft, Loader2, Copy, Smartphone, QrCode } from "lucide-react";
import axios from "axios";

const Enable2FA = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Intro, 2: Scan QR, 3: Success
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [verificationCode, setVerificationCode] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

    const handleStartSetup = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/setup-2fa`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.qrCode) {
                setQrCodeUrl(response.data.qrCode);
                setSecret(response.data.secret);
                setStep(2);
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to initialize 2FA setup");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/auth/verify-2fa`, {
                token: verificationCode
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStep(3);
            toast.success("Two-Factor Authentication enabled successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error("Invalid verification code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secret);
        toast.success("Secret copied to clipboard");
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
                        Two-Factor Authentication
                    </CardTitle>
                    <CardDescription>
                        Protect your account by adding an extra layer of security.
                    </CardDescription>
                </CardHeader>

                {step === 1 && (
                    <CardContent className="space-y-6">
                        <div className="bg-muted p-4 rounded-lg flex gap-4">
                            <div className="bg-background p-2 rounded-full h-fit">
                                <Smartphone className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-medium">Authenticator App</h3>
                                <p className="text-sm text-muted-foreground">
                                    Use an app like Google Authenticator or Microsoft Authenticator to generate verification codes.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <h3 className="font-medium">How it works</h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                                <li>We'll generate a QR code for you to scan.</li>
                                <li>You scan it with your authenticator app.</li>
                                <li>Enter the 6-digit code shown in the app to confirm.</li>
                            </ul>
                        </div>

                        <Button onClick={handleStartSetup} className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Start Setup
                        </Button>
                    </CardContent>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerify}>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="p-4 bg-white rounded-lg border shadow-sm">
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                                    ) : (
                                        <div className="w-48 h-48 bg-muted flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center space-y-2">
                                    <Label>Scan this QR code</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Open the Google Authenticator app and scan the QR code above.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Or enter this code manually</Label>
                                <div className="flex gap-2">
                                    <Input value={secret} readOnly className="font-mono text-xs" />
                                    <Button type="button" variant="outline" size="icon" onClick={handleCopySecret}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">Verification Code</Label>
                                <Input
                                    id="code"
                                    placeholder="Enter 6-digit code"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    maxLength={6}
                                    className="text-center text-lg tracking-widest"
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                Back
                            </Button>
                            <Button type="submit" disabled={isLoading || verificationCode.length !== 6}>
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Verify & Enable
                            </Button>
                        </CardFooter>
                    </form>
                )}

                {step === 3 && (
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold">2FA Enabled!</h3>
                                <p className="text-muted-foreground">
                                    Your account is now more secure. You will need to enter a verification code from your authenticator app when you log in.
                                </p>
                            </div>
                        </div>
                        <Button className="w-full" onClick={() => navigate("/settings")}>
                            Done
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};

export default Enable2FA;
