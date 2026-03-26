import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const Terms = () => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-10 space-y-4 animate-fade-in text-center">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                    Terms of <span className="text-primary">Use</span>
                </h1>
                <p className="text-muted-foreground">
                    Last updated: February 3, 2026
                </p>
            </div>

            <Card className="animate-fade-in shadow-lg" style={{ animationDelay: '100ms' }}>
                <ScrollArea className="h-[800px] p-8 md:p-12 pr-6">
                    <div className="space-y-8 text-foreground/90">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                By accessing or using the QuizTank platform ("Service"), you agree to be bound by these Terms of Use ("Terms").
                                If you disagree with any part of the terms, you may not access the Service.
                            </p>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">2. Accounts</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                When you create an account with us, you must provide information that is accurate, complete, and current at all times.
                                Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>You are responsible for safeguarding the password that you use to access the Service.</li>
                                <li>You agree not to disclose your password to any third party.</li>
                                <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
                            </ul>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">3. User Content</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos,
                                or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality,
                                reliability, and appropriateness.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display,
                                reproduce, and distribute such Content on and through the Service.
                            </p>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">4. Prohibited Uses</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You agree not to use the Service:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>In any way that violates any applicable national or international law or regulation.</li>
                                <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
                                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                                <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                            </ul>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">5. Termination</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever,
                                including without limitation if you breach the Terms.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation,
                                ownership provisions, warranty disclaimers, indemnity and limitations of liability.
                            </p>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">6. Contact Us</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions about these Terms, please contact us at terms@quiztank.com.
                            </p>
                        </section>
                    </div>
                </ScrollArea>
            </Card>
        </div>
    );
};

export default Terms;
