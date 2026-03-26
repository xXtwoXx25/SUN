import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Trophy, Crown, Zap, Target, Gamepad2, Swords, Gift } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { JoinUsModal } from "@/components/JoinUsModal";

interface Challenge {
  id: number;
  title: string;
  description: string;
  reward: string;
  progress: number;
  total: number;
  icon: typeof Zap;
  difficulty: "Very Easy" | "Easy" | "Medium" | "Hard" | "Very Hard";
  active: boolean;
  xp: number;
  isCompleted: boolean;
  rewardClaimed: boolean;
}

interface CompletedChallenge {
  id: number;
  title: string;
  description: string;
  reward: string;
  completedDate: string;
  difficulty: "Very Easy" | "Easy" | "Medium" | "Hard" | "Very Hard";
  total: number;
}



type TabType = "daily" | "weekly" | "completed";

const DailyChallenge = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("daily");
  const [animatingTab, setAnimatingTab] = useState<TabType | null>(null);
  const [dailyTimeUntilReset, setDailyTimeUntilReset] = useState("");
  const [weeklyTimeUntilReset, setWeeklyTimeUntilReset] = useState("");
  const [totalXpEarned, setTotalXpEarned] = useState(0);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedList, setCompletedList] = useState<CompletedChallenge[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      try {
        const response = await api.get('/challenges', { params: { tab: activeTab } });
        const data = response.data;

        if (activeTab === 'completed') {
          setCompletedList(data.challenges.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            reward: `${c.xp || 0} XP`,
            completedDate: c.completedAt ? new Date(c.completedAt).toLocaleDateString() : '',
            difficulty: c.difficulty,
            total: c.totalGames
          })));
        } else {
          setChallenges(data.challenges.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            reward: `${c.xp} XP`,
            progress: c.progress || 0,
            total: c.totalGames || (Array.isArray(c.gameRoom) ? c.gameRoom.length : 1),
            icon: c.difficulty === 'Easy' ? Trophy : (c.difficulty === 'Medium' ? Zap : Target),
            difficulty: c.difficulty,
            active: !c.isCompleted,
            xp: c.xp,
            isCompleted: c.isCompleted || false,
            rewardClaimed: c.rewardClaimed || false
          })));

          if (data.meta) {
            setActiveCount(data.meta.activeCount);
            setTotalXpEarned(data.meta.totalXpEarned || 0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch challenges", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [activeTab, isLoggedIn]);

  // Handle tab change with animation
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    if (!isLoggedIn && newTab === 'completed') return;
    setAnimatingTab(newTab);
    // Short delay for exit animation
    setTimeout(() => {
      setActiveTab(newTab);
      setAnimatingTab(null);
    }, 150);
  };

  useEffect(() => {
    const calculateTimes = () => {
      const now = new Date();

      // Daily reset (Next UTC Midnight)
      const nextDaily = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const dailyDiff = nextDaily.getTime() - now.getTime();

      const dailyHours = Math.floor(dailyDiff / (1000 * 60 * 60));
      const dailyMinutes = Math.floor((dailyDiff % (1000 * 60 * 60)) / (1000 * 60));
      setDailyTimeUntilReset(`${dailyHours}h ${dailyMinutes}m`);

      // Weekly reset (Next Sunday UTC Midnight)
      const dayOfWeek = now.getUTCDay();
      const daysUntilNextSunday = (7 - dayOfWeek) % 7 || 7;
      const nextWeekly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilNextSunday, 0, 0, 0));

      const weeklyDiff = nextWeekly.getTime() - now.getTime();
      const weeklyDays = Math.floor(weeklyDiff / (1000 * 60 * 60 * 24));
      const weeklyHours = Math.floor((weeklyDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const weeklyMinutes = Math.floor((weeklyDiff % (1000 * 60 * 60)) / (1000 * 60));
      setWeeklyTimeUntilReset(`${weeklyDays}d ${weeklyHours}h ${weeklyMinutes}m`);
    };

    calculateTimes();
    const interval = setInterval(calculateTimes, 60000);
    return () => clearInterval(interval);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Very Easy":
        return "bg-green-500 text-white border-green-500";
      case "Easy":
        return "bg-teal-500 text-white border-teal-500";
      case "Medium":
        return "bg-blue-500 text-white border-blue-500";
      case "Hard":
        return "bg-orange-500 text-white border-orange-500";
      case "Very Hard":
        return "bg-red-500 text-white border-red-500";
      default:
        return "bg-gray-500 text-white border-gray-500";
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

  const handleClaim = async (challenge: Challenge) => {
    try {
      const response = await api.post(`/challenges/${challenge.id}/claim`);
      if (response.data.success) {
        toast.success(`${response.data.message}`);
        // Remove from active list
        setChallenges(prev => prev.filter(c => c.id !== challenge.id));
        // Update stats
        setTotalXpEarned(prev => prev + challenge.xp);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to claim reward');
    }
  };

  const getActiveChallengesCount = () => {
    if (activeTab === 'completed') return completedList.length;
    return activeCount;
  };

  const getTimeUntilReset = () => {
    if (activeTab === "daily") {
      return dailyTimeUntilReset;
    }
    return weeklyTimeUntilReset;
  };

  const getTimerLabel = () => {
    if (activeTab === "daily") {
      return "Daily";
    }
    return "Weekly";
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const progressPercent = (challenge.progress / challenge.total) * 100;

    return (
      <Card className="shadow-neumorphic border-border hover:shadow-elevated transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getDifficultyIconColor(challenge.difficulty)}`}>
              <Swords className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-foreground line-clamp-1 break-words [overflow-wrap:anywhere]">{challenge.title}</h3>
                <Badge variant="outline" className={`${getDifficultyColor(challenge.difficulty)} text-xs border-0`}>
                  {challenge.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 break-words [overflow-wrap:anywhere] mb-4">{challenge.description}</p>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-semibold text-primary">
                    {challenge.progress}/{challenge.total}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-1.5 bg-muted" />
              </div>

              {/* Reward and CTA */}
              <div className={`flex justify-between ${challenge.isCompleted && !challenge.rewardClaimed ? "items-start sm:items-center" : "items-center"}`}>
                <div className="items-center gap-2 text-sm hidden lg:flex">
                  <Crown className="w-4 h-4 text-warning fill-warning mb-1" />
                  <span className="font-medium text-gray-600">{challenge.reward}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {challenge.isCompleted && !challenge.rewardClaimed && (
                    <Button
                      size="sm"
                      className="bg-teal-500 hover:bg-teal-600 text-white border-0"
                      onClick={() => handleClaim(challenge)}
                    >
                      <Gift className="w-4 h-4" />
                      Claim Reward
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="game"
                    onClick={() => {
                      if (!isLoggedIn) {
                        setIsJoinModalOpen(true);
                      } else {
                        navigate(`/challenge/${challenge.id}`);
                      }
                    }}
                  >
                    View Challenge
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CompletedChallengeCard = ({ challenge }: { challenge: CompletedChallenge }) => {
    return (
      <Card className="shadow-neumorphic border-border hover:shadow-elevated transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getDifficultyIconColor(challenge.difficulty)}`}>
              <Swords className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-foreground">{challenge.title}</h3>
                <Badge variant="outline" className={`${getDifficultyColor(challenge.difficulty)} text-xs border-0`}>
                  {challenge.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>

              {/* Reward and CTA */}
              <div className="flex items-center justify-between">
                <div className="items-center gap-6 text-sm hidden lg:flex">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-warning fill-warning" />
                    <span className="font-medium text-gray-600">Earned {challenge.reward}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-600">{challenge.total} Games</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-600">Completed on {challenge.completedDate}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="game"
                  className="mt-2 lg:mt-0"
                  onClick={() => {
                    if (!isLoggedIn) {
                      setIsJoinModalOpen(true);
                    } else {
                      navigate(`/challenge/${challenge.id}`);
                    }
                  }}
                >
                  View Challenge
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };


  // Animation classes for tab content
  const getContentAnimationClass = () => {
    if (animatingTab) {
      return "opacity-0 translate-x-2";
    }
    return "opacity-100 translate-x-0";
  };

  return (
    <>
      <div className="container mx-auto px-4 pt-8 pb-20">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Challenges</h1>
          <p className="text-muted-foreground">Complete Challenges to earn rewards and level up</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div
            className="inline-flex bg-card rounded-full p-1 shadow-neumorphic border border-border"
            role="tablist"
            aria-label="Challenge tabs"
          >
            {((["daily", "weekly", "completed"] as const).filter(t => isLoggedIn || t !== 'completed')).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tab}-panel`}
                onClick={() => handleTabChange(tab)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === tab
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {(activeTab !== "completed" && challenges.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
            {/* Time Until Reset */}
            <Card className="shadow-neumorphic border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm lg:text-base font-semibold text-foreground mb-1">
                      {getTimerLabel()} Time Until Reset
                    </p>
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      {getTimerLabel() === "Daily" ? "New Challenges Coming Soon Tomorrow" : "New Challenges Coming Soon Next Sunday"}
                    </p>
                  </div>
                </div>
                <span className="text-lg lg:text-xl font-bold text-primary text-center sm:text-left">{getTimeUntilReset()}</span>
              </CardContent>
            </Card>

            {/* Total XP / Challenge Yourself */}
            <Card className="shadow-neumorphic border-teal-200 bg-teal-50">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-teal-500 mt-1" />
                  <div>
                    <p className="text-sm lg:text-base font-semibold text-foreground mb-1">Total Active Challenges</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">Complete All Challenges to Earn {totalXpEarned} XP</p>
                  </div>
                </div>
                <span className="text-lg lg:text-xl font-bold text-teal-500 text-center sm:text-left">{getActiveChallengesCount()} Challenges</span>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Content Section with Animation */}
        <div
          className={`transition-all duration-200 ease-out ${getContentAnimationClass()}`}
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={activeTab}
        >
          {/* Section Header */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-foreground">
              {activeTab === "daily" && "Today's Challenges"}
              {activeTab === "weekly" && "This Week's Challenges"}
              {activeTab === "completed" && "Completed Challenges"}
            </h2>
          </div>

          {/* Challenge Cards */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Loading challenges...</div>
            ) : (
              <>
                {activeTab !== "completed" ? (
                  challenges.length > 0 ? (
                    challenges.map((challenge) => (
                      <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))
                  ) : (
                    <Card className="p-12 text-center shadow-neumorphic border-border">
                      <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        No active challenges
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        New challenges are comming soon
                      </p>
                    </Card>
                  )
                ) : (
                  completedList.length > 0 ? (
                    completedList.map((challenge) => (
                      <CompletedChallengeCard key={challenge.id} challenge={challenge} />
                    ))
                  ) : (
                    <Card className="p-12 text-center shadow-neumorphic border-border">
                      <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        No completed challenges
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Start playing to complete your first challenge
                      </p>
                      <Button variant="game" onClick={() => handleTabChange("daily")}>
                        View Active Challenges
                      </Button>
                    </Card>
                  )
                )}
              </>
            )}
          </div>
        </div>

        <JoinUsModal isOpen={isJoinModalOpen} onOpenChange={setIsJoinModalOpen} />
      </div>
    </>
  );
};

export default DailyChallenge;
