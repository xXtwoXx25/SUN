import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { emailService } from "@/services/emailService";

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await emailService.sendContactEmail(
                formData.name,
                formData.email,
                formData.subject,
                formData.message
            );
            toast.success("Message sent successfully! We'll get back to you soon.");
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="text-center mb-16 space-y-4 animate-fade-in">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                    Contact <span className="text-primary">Us</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
                {/* Contact Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="p-6 space-y-4 h-full">
                        <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>

                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-primary mt-1 min-w-fit" />
                            <div>
                                <p className="font-medium">Email</p>
                                <p className="text-muted-foreground">quiztank@outlook.com</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-primary mt-1 min-w-fit" />
                            <div>
                                <p className="font-medium">Phone</p>
                                <p className="text-muted-foreground">+66 91-234-5678</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary mt-1 min-w-fit" />
                            <div>
                                <p className="font-medium">Office</p>
                                <p className="text-muted-foreground">
                                    126 Pracha Uthit Rd., Bang Mod, Thung Khru, Bangkok 10140, Thailand
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Contact Form */}
                <div className="md:col-span-2">
                    <Card className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="How can we help?"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Tell us more about your inquiry..."
                                    className="min-h-[150px] resize-none"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Sending..." : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
