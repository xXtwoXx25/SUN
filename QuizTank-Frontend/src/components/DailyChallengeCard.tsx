import { Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from "react-router-dom";

interface DailyChallengeCardProps {
    isLoggedIn?: boolean;
}

const DailyChallengeCard = ({ isLoggedIn = false }: DailyChallengeCardProps) => {
    return (
        <section className="py-6">
            <div className="relative overflow-hidden bg-white rounded-3xl p-6 md:p-8 border border-border/50 group transition-all duration-300 shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-5 text-center md:text-left">
                        <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Trophy className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
                        </div>

                        <div>
                            <Badge variant="secondary" className="py-0.5 px-3 text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                                Exclusive Quiz
                            </Badge>

                            <h3 className="text-xl md:text-2xl font-bold tracking-tight mt-2.5 mb-2">
                                {isLoggedIn ? "Daily Battle Challenges" : "Start Your Learning Journey"}
                            </h3>

                            <p className="text-muted-foreground font-medium text-xs md:text-sm max-w-lg leading-relaxed">
                                {isLoggedIn
                                    ? "Test your knowledge in today's arena and earn XP rewards to level up."
                                    : "Join the largest quiz community. Learn and grow with players worldwide."
                                }
                            </p>
                        </div>
                    </div>

                    <Link to={isLoggedIn ? "/challenge" : "/register"}>
                        <Button
                            size="lg"
                            className="w-full md:w-auto h-12 px-8 rounded-xl font-bold text-sm bg-foreground text-background hover:bg-foreground/90 transition-all flex items-center gap-2"
                        >
                            {isLoggedIn ? "Enter Arena" : "Get Started"}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default DailyChallengeCard;
