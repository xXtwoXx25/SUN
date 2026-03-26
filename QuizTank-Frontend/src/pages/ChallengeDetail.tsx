import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    ArrowLeft,
    Swords,
    Crown,
    Clock,
    Play,
    Lock,
    Check,
    Gamepad2,
    Dot,
    Gift,
    Loader2,
    RotateCw
} from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";
import { calculateDifficulty, getDifficultyColor } from "@/utils/gameDifficulty";

interface Game {
    id: number;
    name: string;
    game_code: string;
    cover_image: string;
    category: string;
    description: string;
    duration: number;
    questionCount: number;
    knowledgeCount: number;
    enemies: number;
    hearts: number;
    brains: number;
    initial_ammo: number;
    ammo_per_correct: number;
}

interface ChallengeData {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    xp: number;
    status: number;
    typeId: number;
    startDate: string;
    timeUntilResetSeconds: number;
    progress: number;
    totalGames: number;
    isCompleted: boolean;
    rewardClaimed: boolean;
    completedGameIds: number[];
    games: Game[];
}

const ChallengeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<ChallengeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [claiming, setClaiming] = useState(false);
    const [rewardClaimed, setRewardClaimed] = useState(false);

    const handleClaimReward = async () => {
        if (!challenge || claiming) return;
        setClaiming(true);
        try {
            const response = await api.post(`/challenges/${id}/claim`);
            if (response.data.success) {
                setRewardClaimed(true);
                toast.success(`${response.data.message}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to claim reward');
        } finally {
            setClaiming(false);
        }
    };

    useEffect(() => {
        const fetchChallenge = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/challenges/${id}`);
                setChallenge(response.data);
                setTimeLeft(response.data.timeUntilResetSeconds || 0);
            } catch (error) {
                console.error("Failed to fetch challenge", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenge();
    }, [id]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTimeLeft = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    };

    const getGameDifficulty = (game: Game) => {
        return calculateDifficulty({
            questions: game.questionCount,
            knowledges: game.knowledgeCount,
            enemies: game.enemies,
            duration: game.duration,
            hearts: game.hearts,
            brains: game.brains,
            initial_ammo: game.initial_ammo,
            ammo_per_correct: game.ammo_per_correct
        });
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "Very Easy":
                return "bg-green-500 text-white";
            case "Easy":
                return "bg-teal-500 text-white";
            case "Medium":
                return "bg-blue-500 text-white";
            case "Hard":
                return "bg-orange-500 text-white";
            case "Very Hard":
                return "bg-red-500 text-white";
            default:
                return "bg-gray-500 text-white";
        }
    };

    const getDifficultyIconColor = (difficulty: string) => {
        switch (difficulty) {
            case "Very Easy":
                return "bg-green-100 text-green-600";
            case "Easy":
                return "bg-teal-100 text-teal-600";
            case "Medium":
                return "bg-blue-100 text-blue-600";
            case "Hard":
                return "bg-orange-100 text-orange-600";
            case "Very Hard":
                return "bg-red-100 text-red-600";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    const handlePlayGame = (gameCode: string) => {
        navigate(`/game/${gameCode}`);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 pt-8 pb-20">
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground animate-pulse">Loading challenge...</div>
                </div>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="container mx-auto px-4 pt-8 pb-20">
                <Card className="p-12 text-center">
                    <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Challenge not found</h3>
                    <p className="text-muted-foreground mb-6">This challenge may have been removed or doesn't exist.</p>
                    <Button variant="outline" onClick={() => navigate('/challenge')}>
                        Back to Challenges
                    </Button>
                </Card>
            </div>
        );
    }

    const progress = challenge.progress || 0;
    const total = challenge.games.length;
    // Progress bar shows percentage of completed games
    const progressPercent = total > 0 ? (progress / total) * 100 : 0;

    return (
        <div className="container mx-auto px-4 pt-8 pb-20">
            {/* Back Button */}
            <Button
                variant="ghost"
                className="mb-6 gap-2 hover:bg-primary"
                onClick={() => navigate('/challenge')}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Challenges
            </Button>

            {/* Challenge Header */}
            <Card className="shadow-neumorphic border-border mb-16">
                <CardContent className="p-6 pb-8">
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        {/* Icon */}
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${getDifficultyIconColor(challenge.difficulty)}`}>
                            <Swords className="w-8 h-8" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 w-full">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h1 className="sm:text-2xl font-bold text-foreground line-clamp-1 break-words [overflow-wrap:anywhere]">{challenge.title}</h1>
                                <Badge variant="outline" className={`${getDifficultyColor(challenge.difficulty)} border-0 text-sm`}>
                                    {challenge.difficulty}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3 break-words [overflow-wrap:anywhere] mb-4">{challenge.description}</p>

                            {/* Stats Row */}
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-warning fill-warning" />
                                    <span className="font-medium text-gray-600">{challenge.xp} XP</span>
                                </div>
                                <div className="items-center gap-2 hidden lg:flex">
                                    <Gamepad2 className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-600">{challenge.games.length} Games</span>
                                </div>
                                {timeLeft > 0 ? (
                                    <div className="items-center gap-2 hidden lg:flex">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-600">Ends in {formatTimeLeft(timeLeft)}</span>
                                    </div>
                                ) : (
                                    <div className="items-center gap-2 hidden lg:flex">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-600">Challenge has ended</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-10">
                        {/* Progress Header */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-semibold text-foreground">Challenge Progress</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-primary">{progress}</span>
                                <span className="text-lg text-muted-foreground">/{total}</span>
                            </div>
                        </div>

                        {/* Game Step Indicators */}
                        <div className="flex items-center w-full">
                            {/* Leading line for single game */}
                            {challenge.games.length === 1 && (
                                <div className={`flex-1 h-1 mr-2 rounded ${challenge.completedGameIds?.includes(challenge.games[0]?.id) ? 'bg-primary' : 'bg-gray-200'}`} />
                            )}
                            {challenge.games.map((game, index) => {
                                const isCompleted = challenge.completedGameIds?.includes(game.id);

                                return (
                                    <div key={index} className={`flex items-center ${challenge.games.length === 1 ? '' : 'flex-1 last:flex-none'}`}>
                                        {/* Step Circle */}
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isCompleted
                                            ? 'bg-primary border-primary'
                                            : 'bg-white border-gray-300'
                                            }`}>
                                            {isCompleted ? (
                                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                            ) : (
                                                <span className="text-xs font-medium text-gray-400">{index + 1}</span>
                                            )}
                                        </div>

                                        {/* Connector Line - blue if current game is completed */}
                                        {index < challenge.games.length - 1 && (
                                            <div className={`flex-1 h-1 mx-2 rounded transition-all ${isCompleted ? 'bg-primary' : 'bg-gray-200'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Claim Reward Button */}
                    {challenge.isCompleted && (
                        <div className="mt-8">
                            {rewardClaimed || challenge.rewardClaimed ? (
                                <Button
                                    size="sm"
                                    className="bg-teal-50  hover:bg-teal-100 text-teal-500 border border-teal-200"
                                >
                                    <Check className="w-4 h-4" />
                                    Reward Claimed
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={handleClaimReward}
                                    disabled={claiming}
                                    className="bg-teal-500 hover:bg-teal-600 text-white border-0"
                                >
                                    {claiming ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Gift className="w-4 h-4" />
                                    )}
                                    {claiming ? 'Claiming...' : `Claim ${challenge.xp} XP Reward`}
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Games List */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-3">Games in this Challenge</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    Complete the games to finish this challenge and earn {challenge.xp} XP
                </p>
            </div>

            <div className="space-y-4">
                {challenge.games.map((game, index) => {
                    const isCompleted = challenge.completedGameIds?.includes(game.id);
                    const isActive = !isCompleted && index === challenge.games.findIndex(g => !challenge.completedGameIds?.includes(g.id));
                    const isLocked = !isCompleted && !isActive;

                    return (
                        <Card
                            key={game.id}
                            className={`shadow-neumorphic transition-all ${isCompleted ? 'border-green-200 bg-green-50/50' :
                                isActive ? 'border-primary/50 bg-primary/10' :
                                    'border-border opacity-60'
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-5">
                                    {/* Order Number */}
                                    <div className={`w-10 h-10 rounded-full hidden lg:flex items-center justify-center font-bold text-sm ${isCompleted ? 'bg-green-500 text-white' :
                                        isActive ? 'bg-primary text-white' :
                                            'bg-gray-200 text-gray-500'
                                        }`}>
                                        {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                                    </div>

                                    {/* Game Cover */}
                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border-2 border-gray-200 hidden sm:block">
                                        {game.cover_image ? (
                                            <img
                                                src={game.cover_image}
                                                alt={game.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Gamepad2 className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Game Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="mb-2.5">
                                            <h3 className="font-bold text-foreground truncate">{game.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="outline" className={`${getGameDifficulty(game).color} text-xs border-0 flex-shrink-0`}>
                                                {getGameDifficulty(game).level}
                                            </Badge>
                                            <Dot className="w-4 h-4 hidden lg:block" />
                                            {game.category && <span className="hidden lg:block">{game.category}</span>}
                                            <Dot className="w-4 h-4 hidden lg:block" />
                                            <span className="hidden lg:block">{game.questionCount} Questions</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex-shrink-0">
                                        {isCompleted ? (
                                            <Button
                                                size="sm"
                                                className="bg-primary/5 hover:bg-primary/20 text-primary border border-primary/50 gap-2"
                                                onClick={() => handlePlayGame(game.game_code)}
                                            >
                                                <RotateCw className="w-4 h-4" />
                                                Play Again
                                            </Button>
                                        ) : isActive ? (
                                            <Button
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => handlePlayGame(game.game_code)}
                                            >
                                                <Play className="w-4 h-4" />
                                                Play Now
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" disabled className="gap-2">
                                                <Lock className="w-4 h-4" />
                                                Locked
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {challenge.games.length === 0 && (
                <Card className="p-12 text-center">
                    <Gamepad2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">No games in this challenge</h3>
                    <p className="text-muted-foreground">This challenge doesn't have any games assigned yet.</p>
                </Card>
            )}
        </div>
    );
};

export default ChallengeDetail;
