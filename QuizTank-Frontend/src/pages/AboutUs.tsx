import { Card } from "@/components/ui/card";
import { Users, Target, Zap, Globe } from "lucide-react";

const AboutUs = () => {
    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="text-center mb-16 space-y-4 animate-fade-in">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                    About <span className="text-primary">QuizTank</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    We're on a mission to make learning engaging, interactive, and accessible for everyone.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold">Our Story</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Founded in 2024, QuizTank started with a simple idea: education shouldn't be boring.
                        We noticed that traditional learning methods often fail to capture the imagination of students and lifelong learners alike.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        By combining game mechanics with educational content, we've created a platform where knowledge meets entertainment.
                        Whether you're a teacher looking to energize your classroom, or a group of friends wanting to test your trivia skills, QuizTank is built for you.
                    </p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-8 flex items-center justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="p-6 flex flex-col items-center text-center space-y-2 hover:border-primary/50 transition-colors">
                            <Users className="w-8 h-8 text-primary" />
                            <span className="font-bold text-2xl">10K+</span>
                            <span className="text-muted-foreground">Active Users</span>
                        </Card>
                        <Card className="p-6 flex flex-col items-center text-center space-y-2 hover:border-primary/50 transition-colors">
                            <Target className="w-8 h-8 text-primary" />
                            <span className="font-bold text-2xl">50K+</span>
                            <span className="text-muted-foreground">Quizzes Created</span>
                        </Card>
                        <Card className="p-6 flex flex-col items-center text-center space-y-2 hover:border-primary/50 transition-colors">
                            <Zap className="w-8 h-8 text-primary" />
                            <span className="font-bold text-2xl">1M+</span>
                            <span className="text-muted-foreground">Questions Answered</span>
                        </Card>
                        <Card className="p-6 flex flex-col items-center text-center space-y-2 hover:border-primary/50 transition-colors">
                            <Globe className="w-8 h-8 text-primary" />
                            <span className="font-bold text-2xl">150+</span>
                            <span className="text-muted-foreground">Countries</span>
                        </Card>
                    </div>
                </div>
            </div>

            <div className="space-y-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <h2 className="text-3xl font-bold text-center">Our Core Values</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="p-6 space-y-4 border-l-4 border-l-primary">
                        <h3 className="text-xl font-bold">Innovation First</h3>
                        <p className="text-muted-foreground">
                            We constantly push the boundaries of what's possible in educational technology, exploring new ways to make learning more effective.
                        </p>
                    </Card>
                    <Card className="p-6 space-y-4 border-l-4 border-l-primary">
                        <h3 className="text-xl font-bold">Community Driven</h3>
                        <p className="text-muted-foreground">
                            Our community is our heartbeat. We build features based on user feedback and foster a supportive environment for creators.
                        </p>
                    </Card>
                    <Card className="p-6 space-y-4 border-l-4 border-l-primary">
                        <h3 className="text-xl font-bold">Accessible to All</h3>
                        <p className="text-muted-foreground">
                            Education is a right, not a privilege. We strive to keep our platform accessible and easy to use for people of all abilities.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
