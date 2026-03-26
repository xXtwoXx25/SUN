import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const Privacy = () => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-10 space-y-4 animate-fade-in text-center">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                    Privacy <span className="text-primary">Policy</span>
                </h1>
                <p className="text-muted-foreground">
                    Last updated: February 3, 2026
                </p>
            </div>

            <Card className="animate-fade-in shadow-lg" style={{ animationDelay: '100ms' }}>
                <ScrollArea className="h-[800px] p-8 md:p-12 pr-6">
                    <div className="space-y-8 text-foreground/90">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                QuizTank ("we", "our", or "us") respects your privacy and is committed to protecting it through our compliance with this policy.
                                This policy describes the types of information we may collect from you or that you may provide when you visit the QuizTank website
                                and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                            </p>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">2. Information We Collect</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We collect several types of information from and about users of our Website, including information:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>By which you may be personally identified, such as name, e-mail address, telephone number, or any other identifier by which you may be contacted online or offline ("personal information").</li>
                                <li>About your internet connection, the equipment you use to access our Website, and usage details.</li>
                            </ul>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">3. How We Use Your Information</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We use information that we collect about you or that you provide to us, including any personal information:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>To present our Website and its contents to you.</li>
                                <li>To provide you with information, products, or services that you request from us.</li>
                                <li>To fulfill any other purpose for which you provide it.</li>
                                <li>To notify you about changes to our Website or any products or services we offer or provide though it.</li>
                                <li>To allow you to participate in interactive features on our Website.</li>
                                <li>For any other purpose with your consent.</li>
                            </ul>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">4. Disclosure of Your Information</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We may disclose aggregated information about our users, and information that does not identify any individual, without restriction.
                                We may disclose personal information that we collect or you provide as described in this privacy policy:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                <li>To our subsidiaries and affiliates.</li>
                                <li>To contractors, service providers, and other third parties we use to support our business.</li>
                                <li>To a buyer or other successor in the event of a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of QuizTank's assets.</li>
                            </ul>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">5. Data Security</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use,
                                alteration, and disclosure. The safety and security of your information also depends on you. Where we have given you (or where you have chosen)
                                a password for access to certain parts of our Website, you are responsible for keeping this password confidential.
                            </p>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">6. Changes to Our Privacy Policy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                It is our policy to post any changes we make to our privacy policy on this page. If we make material changes to how we treat our users'
                                personal information, we will notify you through a notice on the Website home page.
                            </p>
                        </section>

                        <Separator />

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-foreground">7. Contact Information</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                To ask questions or comment about this privacy policy and our privacy practices, contact us at: privacy@quiztank.com.
                            </p>
                        </section>
                    </div>
                </ScrollArea>
            </Card>
        </div>
    );
};

export default Privacy;
