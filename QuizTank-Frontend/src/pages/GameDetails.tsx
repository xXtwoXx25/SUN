import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Angry,
  Play,
  Heart,
  Share2,
  Brain,
  Flag,
  Star,
  Trophy,
  Crown,
  Timer,
  Crosshair,
  BookMarked,
  Zap,
  ChevronDown,
  Globe,
  MessageCircleQuestionMark,
  Users,
  Lock,
  Gamepad2,
  EyeOff,
  Info,
  Copy,
  Ellipsis,
  Check,
  TextAlignJustify,
  Dot,
  X,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { gameRoomService, QUESTION_TYPES } from "@/services/gameRoomService";
import { gameService } from "@/services/gameService";
import { userService } from "@/services/userService";
import { calculateDifficulty, getDifficultyColor } from "@/utils/gameDifficulty";
import coverImg from "@/assets/cover-img.jpg";
import { GameCard } from "@/components/GameCard";
import { JoinUsModal } from "@/components/JoinUsModal";
import { Zap as ZapIcon, History } from "lucide-react";
import { calculateLevelProgress } from "@/utils/levelUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";


export default function GameDetails() {
  const navigate = useNavigate();
  const { code } = useParams();
  const { user } = useAuth();
  const [isFavourite, setIsFavourite] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showJoinUs, setShowJoinUs] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [hasReported, setHasReported] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<'gameplay' | 'leaderboard' | 'history' | 'review'>('gameplay');
  const [isLoading, setIsLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Access Control State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accessDenied, setAccessDenied] = useState<{ reason: string, badge: string } | null>(null);

  // Game data state (fetched from API)
  const [game, setGame] = useState({
    id: 0,
    title: "",
    creator: "",
    creatorUsername: "",
    creatorProfilePic: "",
    category: "",
    language: "",
    description: "",
    difficulty: "Medium",
    questions: 0,
    knowledges: 0,
    xp: 100,
    rating: 0 as string | number,
    tags: [] as string[],
    imageUrl: "",
    status: 1,
    visibility: 1,
    password: "",
    isAiGenerated: false,
    gameCode: "",
    ratingCount: 0,
    createdAt: "",
  });
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['gameplay', 'leaderboard', 'history', 'review'].includes(tab)) {
      setActiveInfoTab(tab as any);
    }
  }, [searchParams]);

  const [leaderboard, setLeaderboard] = useState<{ rank: number; name: string; username: string; profile_pic_url?: string; score: number; time: string; playedAt?: string; isSeparator?: boolean; hiddenCount?: number }[]>([]);
  const [relatedGames, setRelatedGames] = useState<any[]>([]);
  const [gameSettings, setGameSettings] = useState([]);

  const [playHistory, setPlayHistory] = useState<any[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [gameStats, setGameStats] = useState({
    totalPlays: 0,
    gamesPlayed: 0,
    passed: 0,
    failed: 0,
    passedRate: 0,
    failedRate: 0
  });

  useEffect(() => {
    if (!user && activeInfoTab === 'history') {
      setActiveInfoTab('gameplay');
    }
    if (user) {
      setUserXP(user.xp || 0); // Init with context value
      // Fetch fresh profile data to get real-time XP
      if (user.username) {
        userService.getProfile(user.username).then((res: any) => {
          if (res.user && res.user.xp !== undefined) {
            setUserXP(res.user.xp);
          }
        }).catch(() => { });
      }
    }
  }, [user, activeInfoTab]);

  // Fetch game data on mount
  useEffect(() => {
    const fetchGame = async () => {
      if (!code) return;
      setIsLoading(true);
      try {
        const data = await gameRoomService.getGame(code); // Works with code or ID
        // Enforce using game_code in URL
        const actualCode = (data as any).game_code;
        if (actualCode && code !== actualCode) {
          setAccessDenied({ reason: "", badge: "Game not found" });
          setIsLoading(false);
          return;
        }

        const isCreator = user?.username === (data.creator_name || "");

        // Access Control Logic
        if (data.status === 3) {
          setAccessDenied({ reason: "", badge: "Game not found" });
          setIsLoading(false);
          return;
        } else if (data.status === 2) { // Private
          if (!isCreator) {
            setAccessDenied({ reason: "", badge: "Game not found" });
            setIsLoading(false);
            return;
          }
        } else if (data.visibility === 2) { // Private
          if (!isCreator) {
            setAccessDenied({ reason: "", badge: "Game not found" });
            setIsLoading(false);
            return;
          }
        } else if (data.visibility === 3) { // Locked
          if (!isCreator) {
            if (data.is_unlocked) {
              setIsUnlocked(true);
            } else {
              setShowPasswordModal(true);
            }
          }
        }

        const diffResult = calculateDifficulty({
          questions: (data.questions || []).length,
          knowledges: (data.knowledges || []).length,
          enemies: data.enemies || 1,
          duration: data.duration || 3,
          hearts: data.hearts || 1,
          brains: data.brains || 1,
          initial_ammo: data.initial_ammo || 0,
          ammo_per_correct: data.ammo_per_correct || 1
        });

        setGame({
          id: data.id,
          title: data.name || "Untitled Game",
          creator: (data as any).creator_full_name || data.creator_name || "Unknown",
          creatorUsername: data.creator_name || "",
          creatorProfilePic: (data as any).creator_profile_pic || data.creator_avatar || "",
          category: data.category || "",
          language: data.language || "",
          description: data.description || "",
          difficulty: diffResult.level,
          questions: (data.questions || []).length,
          knowledges: (data.knowledges || []).length,
          xp: diffResult.xp,
          rating: Number((data as any).rating) > 0 ? Number((data as any).rating).toFixed(1) : "-",
          tags: data.tags || [],
          imageUrl: data.cover_image,
          status: data.status,
          visibility: data.visibility || 1,
          password: data.password || "",
          isAiGenerated: !!data.ai_generated,
          gameCode: (data as any).game_code || "",
          ratingCount: (data as any).rating_count || 0,
          createdAt: data.created_at || new Date().toISOString(),
        });

        // Leaderboard placeholder (no leaderboard data in new schema yet)
        setLeaderboard([]);

        setGameSettings([
          { label: "Duration", value: `${data.duration !== undefined ? data.duration : 3} minutes`, icon: Timer, color: "bg-blue-50 border-blue-100" },
          { label: "Enemies", value: `${data.enemies !== undefined ? data.enemies : 1} tanks`, icon: Angry, color: "bg-blue-50 border-blue-100" },
          { label: "Lives", value: `${data.hearts !== undefined ? data.hearts : 1} hearts`, icon: Heart, color: "bg-blue-50 border-blue-100" },
          { label: "Mistake Tolerance", value: `${data.brains !== undefined ? data.brains : 1} brains`, icon: Brain, color: "bg-blue-50 border-blue-100" },
          { label: "Initial Ammo", value: `${data.initial_ammo !== undefined ? data.initial_ammo : 0} bullets`, icon: Crosshair, color: "bg-blue-50 border-blue-100" },
          { label: "Ammo per Answer", value: `+${data.ammo_per_correct !== undefined ? data.ammo_per_correct : 1} bullets`, icon: Zap, color: "bg-blue-50 border-blue-100" }
        ]);

        if (data.id) {
          if (user) {
            gameRoomService.checkFavourite(data.id.toString()).then(setIsFavourite).catch(() => { });
            gameRoomService.checkReportStatus(data.id.toString()).then(setHasReported).catch(() => { });
          }
          gameRoomService.getRelatedGames(data.id.toString()).then(setRelatedGames).catch(() => { });
          gameService.getGameStats(data.id).then(setGameStats).catch(() => { });
          if (user) {
            gameService.getGameHistory(data.id).then(setPlayHistory).catch(() => { });
            gameService.getMyReview(data.id).then(res => setUserRating(res.rating || 0)).catch(() => { });
          }
          gameService.getLeaderboard(data.id).then((lb: any[]) => {
            const processedLb = lb.map((item, idx) => ({
              rank: idx + 1,
              name: item.full_name || item.username || 'Anonymous',
              username: item.username,
              profile_pic_url: item.profile_pic_url,
              time: `${Math.floor(item.completion_time / 60)}m ${item.completion_time % 60}s`,
              score: 0,
              playedAt: formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
            })) as { rank: number; name: string; username: string; profile_pic_url?: string; score: number; time: string; playedAt?: string; isSeparator?: boolean; hiddenCount?: number }[];

            const top10 = processedLb.slice(0, 10);
            if (user?.username) {
              const userEntryIndex = processedLb.findIndex(item => item.username === user.username);
              if (userEntryIndex >= 10) {
                const gap = userEntryIndex - 10;
                if (gap > 0) {
                  top10.push({
                    rank: 0,
                    name: '',
                    username: '',
                    score: 0,
                    time: '',
                    isSeparator: true,
                    hiddenCount: gap
                  });
                }
                top10.push(processedLb[userEntryIndex]);
              }
            }
            setLeaderboard(top10);
          }).catch(console.error);
        }

      } catch (error) {
        setAccessDenied({ reason: "", badge: "Game not found" });
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    };
    fetchGame();
  }, [code, user]);

  const handleUnlock = async () => {
    if (!game.id) return;
    if (!passwordInput) {
      toast.error("Please enter password");
      return;
    }
    try {
      const isValid = await gameRoomService.verifyPassword(game.id.toString(), passwordInput);
      if (isValid) {
        setIsUnlocked(true);
        setShowPasswordModal(false);
        toast.success("Unlocked successfully!");
      } else {
        toast.error("Incorrect password");
      }
    } catch (e) {
      toast.error("Verification failed");
    }
  };

  const handleToggleFavourite = async () => {
    if (!user) {
      setShowJoinUs(true);
      return;
    }
    if (!game.id) return;
    try {
      if (isFavourite) {
        await gameRoomService.removeFavourite(game.id.toString());
        setIsFavourite(false);
        toast.success("Removed from favourites");
      } else {
        await gameRoomService.addFavourite(game.id.toString());
        setIsFavourite(true);
        toast.success("Added to favourites");
      }
    } catch (error) {
      toast.error("Failed to update favourites");
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleCopyPin = () => {
    if (game.gameCode) {
      navigator.clipboard.writeText(game.gameCode);
      toast.success("Game Code copied to clipboard!");
    }
  };

  const handleCopyPassword = () => {
    if (game.password) {
      navigator.clipboard.writeText(game.password);
      toast.success("Password copied to clipboard!");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: game.title,
          text: `Join my game "${game.title}" on QuizTank!`,
          url: window.location.href,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Error sharing:", error);
        }
      }
    } else {
      toast.error("Native sharing not supported on this device/browser.");
    }
  };

  const handleSubmitReport = async () => {
    if (!game.id) return;

    const finalReason = selectedReason === 'Other' ? reportMessage : selectedReason;
    if (!finalReason || !finalReason.trim()) return;

    try {
      await gameRoomService.reportGame(game.id.toString(), finalReason);
      setHasReported(true);
      // setIsReportOpen(false); // Keep open to show success message
      setReportMessage("");
      setSelectedReason("");
    } catch (error) {
      toast.error("Failed to send report");
    }
  };

  const handlePlayNow = () => {
    navigate(`/play/${game.gameCode}`);
  };

  const handleTagClick = (tag: string) => {
    navigate(`/search?q=${encodeURIComponent('#' + tag)}`);
  };



  if (accessDenied) {
    return (
      <div className="h-[80vh] flex items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{accessDenied.badge}</h1>
          <p className="text-gray-500 mb-6">{accessDenied.reason}</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (showPasswordModal && !isUnlocked) {
    return (
      <div className="h-[80vh] flex items-center justify-center bg-white">
        <div className="text-center p-8 max-w-sm w-full">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Locked</h1>
          <p className="text-gray-500 mb-6">This game room is protected.</p>

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="text-center"
            />
            <Button onClick={handleUnlock} variant="default" className="w-full">Unlock</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <main className="container mx-auto px-4 pt-8 pb-20">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {game.status === 2 && (
              <div className="flex items-center gap-3 text-sm text-yellow-700 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <Info className="w-5 h-5" />
                <span className="font-semibold">Game is not Published</span>
              </div>
            )}

            {/* Game Header Card */}
            <div className="rounded-3xl bg-white p-6 md:p-8 shadow-lg border border-gray-100 overflow-hidden group">

              <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative z-10">
                {/* Image Section */}
                {game.imageUrl && (
                  <div className="w-full md:w-64 shrink-0 relative group-hover:scale-[1.02] transition-transform duration-500">
                    <div className="aspect-square md:aspect-auto md:h-64 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 z-10">
                      <img src={game.imageUrl} alt={game.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  {/* Header Row: Category & Rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-3">

                    <div className="flex items-center gap-2.5">
                      {game.visibility === 2 && (
                        <EyeOff className="w-5 h-5 text-gray-700 mb-0.5" />
                      )}
                      {game.visibility === 3 && (
                        <Lock className="w-5 h-5 text-gray-700 mb-0.5 min-w-fit" />
                      )}

                      <h1 className="lg:text-xl font-extrabold text-gray-900 tracking-tight leading-tight line-clamp-2 break-words [overflow-wrap:anywhere] pr-1">
                        {game.title}
                      </h1>
                    </div>


                    {/* Rating */}
                    <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full border border-yellow-100 font-bold shadow-sm w-fit">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {game.rating}
                      {game.ratingCount > 0 && <span className="text-xs font-normal text-yellow-600 ml-0.5">({game.ratingCount})</span>}
                    </div>
                  </div>

                  {/* Creator */}
                  <div
                    className="inline-flex items-center gap-2.5 mb-4 rounded-full transition-all cursor-pointer group/creator"
                    onClick={() => navigate(`/user/${game.creatorUsername}`)}
                  >
                    <Avatar className="w-10 h-10 border border-gray-200 shadow-sm">
                      <AvatarImage src={game.creatorProfilePic} className="object-cover" />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {game.creator?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-gray-900 group-hover/creator:text-primary transition-colors max-w-[200px] lg:max-w-[300px] truncate">{game.creator}</span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-5 overflow-x-auto no-scrollbar">

                    <Badge variant="outline" className={`${getDifficultyColor(game.difficulty)} text-[10px] sm:text-xs px-3 py-1 min-w-fit`}>
                      {game.difficulty}
                    </Badge>

                    {game.isAiGenerated && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs bg-violet-100 border-violet-200 text-violet-600 px-3 py-1 min-w-fit">
                        AI Generated
                      </Badge>
                    )}

                    <Badge variant="outline" className="text-[10px] sm:text-xs border-gray-200 bg-gray-50 text-gray-700 flex items-center gap-1.5 px-3 py-1 min-w-fit">
                      <TextAlignJustify className="w-3 h-3" />
                      {game.category || "General"}
                    </Badge>

                    <Badge variant="outline" className="text-[10px] sm:text-xs border-gray-200 bg-gray-50 text-gray-700 flex items-center gap-1.5 px-3 py-1 min-w-fit">
                      <Globe className="w-3 h-3" />
                      {game.language}
                    </Badge>

                    {/*
                    <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 flex items-center gap-1.5 px-3 py-1">
                      <Crown className="w-3 h-3" />
                      +{game.xp} XP
                    </Badge>
                    */}
                  </div>

                  {/* Meta Stats Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-teal-600 bg-teal-50 p-4 rounded-xl border border-teal-200">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">{gameStats.totalPlays} Plays</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-blue-600 bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <MessageCircleQuestionMark className="w-5 h-5" />
                      <span className="font-semibold">{game.questions} Questions</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-fuchsia-600 bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-200">
                      <BookMarked className="w-5 h-5" />
                      <span className="font-semibold">{game.knowledges} Knowledges</span>
                    </div>
                  </div>

                  {/* Tags & Language */}
                  <div className="flex flex-wrap gap-3">
                    {/* Tags */}
                    {game.tags.length > 0 && game.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-blue-500 hover:underline cursor-pointer text-xs sm:text-sm font-medium transition-colors max-w-[300px] truncate"
                        onClick={() => handleTagClick(tag)}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Gameplay Info Card */}
            <Card className="shadow-lg border-gray-100">
              <CardContent className="p-6 pt-4">
                {/* Tab Bar */}
                <div
                  role="tablist"
                  className="flex border-b border-gray-200 mb-6 overflow-y-hidden overflow-x-auto no-scrollbar max-w-[80vw]"
                >
                  <button
                    role="tab"
                    aria-selected={activeInfoTab === 'gameplay'}
                    aria-controls="gameplay-panel"
                    id="gameplay-tab"
                    onClick={() => setActiveInfoTab('gameplay')}
                    className={`px-6 py-3 font-medium md:text-sm text-xs transition-all duration-200  border-b-4 -mb-px min-w-fit ${activeInfoTab === 'gameplay'
                      ? 'text-[#007BFF] border-[#007BFF] font-semibold'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Gameplay Info
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeInfoTab === 'leaderboard'}
                    aria-controls="leaderboard-panel"
                    id="leaderboard-tab"
                    onClick={() => setActiveInfoTab('leaderboard')}
                    className={`px-6 py-3 font-medium md:text-sm text-xs transition-all duration-200  border-b-4 -mb-px min-w-fit ${activeInfoTab === 'leaderboard'
                      ? 'text-[#007BFF] border-[#007BFF] font-semibold'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Leaderboard
                  </button>
                  {user && (
                    <>
                      <button
                        role="tab"
                        aria-selected={activeInfoTab === 'history'}
                        aria-controls="history-panel"
                        id="history-tab"
                        onClick={() => setActiveInfoTab('history')}
                        className={`px-6 py-3 font-medium md:text-sm text-xs transition-all duration-200  border-b-4 -mb-px min-w-fit ${activeInfoTab === 'history'
                          ? 'text-[#007BFF] border-[#007BFF] font-semibold'
                          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        Play History
                      </button>
                      {user.username !== game.creatorUsername && (
                        <button
                          role="tab"
                          aria-selected={activeInfoTab === 'review'}
                          aria-controls="review-panel"
                          id="review-tab"
                          onClick={() => setActiveInfoTab('review')}
                          className={`px-6 py-3 font-medium md:text-sm text-xs transition-all duration-200  border-b-4 -mb-px ${activeInfoTab === 'review'
                            ? 'text-[#007BFF] border-[#007BFF] font-semibold'
                            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                          Review
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Tab Content */}
                {activeInfoTab === 'gameplay' && (
                  <div
                    role="tabpanel"
                    id="gameplay-panel"
                    aria-labelledby="gameplay-tab"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-md font-bold text-gray-900 mb-0">Description</h3>
                      <span className="text-[10px] sm:text-xs text-gray-500">Created: {game.createdAt ? format(new Date(game.createdAt), "d MMM yyyy") : ""}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed break-words [overflow-wrap:anywhere] mb-6">{game.description}</p>

                    {/* Game Settings */}
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-md font-bold text-gray-900 mb-4">Game Rules</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {gameSettings.map((setting) => {
                          const Icon = setting.icon;
                          return (
                            <div key={setting.label} className={`${setting.color} border rounded-xl p-4 flex items-center gap-3`}>
                              <div className="p-2 rounded-lg bg-white/50">
                                <Icon className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">{setting.label}</p>
                                <p className="font-semibold text-gray-900">{setting.value}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeInfoTab === 'leaderboard' && (
                  <div
                    role="tabpanel"
                    id="leaderboard-panel"
                    aria-labelledby="leaderboard-tab"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Top Players</h3>
                    </div>
                    {leaderboard.length > 0 ? (
                      <div className="space-y-3">
                        {leaderboard.map((entry, index) =>
                          entry.isSeparator ? (
                            <div key={`sep-${index}`} className="pb-2 pt-2.5 text-center text-sm text-gray-400 font-medium italic">
                              Hidden {entry.hiddenCount} item{entry.hiddenCount !== 1 ? 's' : ''}
                            </div>
                          ) : (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] ${entry.rank <= 3
                                ? "bg-yellow-500/5 border-l-4 border-yellow-400"
                                : "bg-gray-50"
                                }`}
                            >
                              <div
                                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => entry.username && navigate(`/user/${entry.username}`)}
                              >
                                <Avatar className="w-10 h-10 border border-gray-200">
                                  <AvatarImage src={entry.profile_pic_url || ""} className="object-cover" />
                                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                                    {entry.name?.[0]?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 max-w-[100px] lg:max-w-[300px] truncate">{entry.name}</p>
                                    {user?.username === entry.username && (
                                      <Badge className="hidden sm:block h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 pointer-events-none">You</Badge>
                                    )}
                                    {game.creatorUsername === entry.username && (
                                      <Badge className="hidden sm:block h-5 px-1.5 text-[10px] bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 pointer-events-none">Creator</Badge>
                                    )}
                                  </div>
                                  {(user?.username === entry.username || game.creatorUsername === entry.username) && (
                                    <div className="flex items-center gap-2 mt-0.5 mb-2 sm:hidden">
                                      {user?.username === entry.username && (
                                        <Badge className="h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 pointer-events-none">You</Badge>
                                      )}
                                      {game.creatorUsername === entry.username && (
                                        <Badge className="h-5 px-1.5 text-[10px] bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 pointer-events-none">Creator</Badge>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-0 mt-1">
                                    <p className="text-[10px] sm:text-xs text-gray-500 sm:flex sm:items-center sm:gap-1"><span className="hidden sm:block">Rank</span>#{entry.rank}</p>
                                    <Dot className="w-4 h-4 text-gray-400" />
                                    <p className="text-[10px] sm:text-xs text-gray-500">{entry.playedAt}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm lg:text-xl font-bold text-blue-600">{entry.time}</div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No leaderboard data</p>
                      </div>
                    )}
                  </div>
                )}

                {activeInfoTab === 'history' && (
                  <div
                    role="tabpanel"
                    id="history-panel"
                    aria-labelledby="history-tab"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Your Play History</h3>
                    </div>
                    {playHistory.length > 0 ? (
                      <div className="space-y-3">
                        {playHistory.map((play) => (
                          <div
                            key={play.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${play.status === 2 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                {play.status === 2 ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 mb-1">
                                  <span className={`font-bold ${play.status === 2 ? 'text-green-600' : 'text-red-600'}`}>
                                    {play.status === 2 ? 'Passed' : 'Failed'}
                                  </span>
                                  {play.isBest && (
                                    <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-600 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-yellow-300 shadow-sm mb-2 sm:mb-0 w-fit">
                                      <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-yellow-500 text-yellow-500" />
                                      <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
                                        Best Played
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-500">
                                  {format(new Date(play.created_at), "d MMM yyyy, HH:mm")}
                                </p>
                              </div>
                            </div>
                            <div className="text-gray-600 font-semibold text-sm lg:text-base">
                              {Math.floor((play.completion_time || 0) / 60)}m {(play.completion_time || 0) % 60}s
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>{user ? "No play history found" : "Sign in to view history"}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeInfoTab === 'review' && (
                  <div role="tabpanel" id="review-panel" aria-labelledby="review-tab">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
                    </div>
                    {playHistory.length > 0 ? (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 text-center">
                        <p className="text-gray-600 mb-4 font-medium">How would you rate this game?</p>
                        <div className="flex justify-center gap-2 mb-6">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-10 h-10 cursor-pointer transition-all hover:scale-110 ${star <= userRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 hover:text-yellow-200"}`}
                              onClick={() => setUserRating(star)}
                            />
                          ))}
                        </div>
                        <Button
                          onClick={async () => {
                            if (userRating === 0) return toast.error("Please select a rating");
                            try {
                              const loadingToast = toast.loading("Saving review...");
                              await gameService.submitReview(game.id, userRating);
                              toast.dismiss(loadingToast);
                              toast.success("Review saved successfully!");
                            } catch (e: any) {
                              toast.dismiss();
                              const errorMsg = e.response?.data?.error || "Failed to save review";
                              toast.error(errorMsg);
                            }
                          }}
                          className="w-full sm:w-auto min-w-[150px]"
                          disabled={userRating === 0}
                        >
                          Save Review
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Gamepad2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Play the game to leave a review</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>


          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Play Card */}
            <Card className="shadow-lg border-gray-100 sticky top-24">
              <CardContent className="p-6">
                {/* Start Game Button - Primary Blue */}
                <Button
                  onClick={handlePlayNow}
                  variant="default"
                  size="lg"
                  className="w-full font-bold text-lg h-14 shadow-md mb-6 !gap-3"
                >
                  <Play className="!w-5 !h-5 fill-white" />
                  Play Game
                </Button>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-6">
                  <Button
                    variant="outline"
                    className={`flex-1 ${isFavourite ? 'bg-red-50 border-red-200 hover:bg-red-100' : ''}`}
                    onClick={handleToggleFavourite}
                  >
                    <Heart className={`w-4 h-4 ${isFavourite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  {user?.username !== game.creatorUsername && (
                    <Button variant="outline" className="flex-1" onClick={() => {
                      if (!user) {
                        setShowJoinUs(true);
                      } else {
                        setIsReportOpen(true);
                      }
                    }}>
                      <Flag className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Your Progress Section - White background with gray progress bar */}
                <Card className="bg-white border border-gray-200 shadow-sm mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-0.5">Your Progress</h3>

                        {user?.username === game.creatorUsername ? (
                          <p className="text-[10px] sm:text-sm font-semibold text-gray-500">No XP for playing your own game</p>
                        ) : user && playHistory.some(p => p.status === 2) ? (
                          <p className="text-[10px] sm:text-sm font-semibold text-teal-600">Earned {game.xp} XP from this game</p>
                        ) : (
                          <p className="text-[10px] sm:text-sm font-semibold text-gray-500">Play this game to earn {game.xp} XP</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        {user ? (
                          <>
                            {(() => {
                              const levelInfo = calculateLevelProgress(userXP);
                              return (
                                <>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-gray-900">Level {levelInfo.level}</span>
                                    <span className="text-sm text-gray-500">
                                      {levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel} XP
                                    </span>
                                  </div>
                                  {/* Neutral gray progress bar */}
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gray-500 rounded-full transition-all"
                                      style={{ width: `${levelInfo.progressPercent}%` }}
                                    />
                                  </div>
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          <div className="text-center py-2 text-[11px] sm:text-sm text-muted-foreground bg-muted rounded-md px-2 py-3">
                            Sign in to track your progress
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Games Played</span>
                          <span className="font-semibold text-gray-900">{gameStats.gamesPlayed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Passed</span>
                          <span className="font-semibold text-green-600">
                            {gameStats.gamesPlayed > 0 ? gameStats.passedRate : 0}%
                            <span className="text-xs text-gray-400 ml-1">({gameStats.passed})</span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Failed</span>
                          <span className="font-semibold text-red-500">
                            {gameStats.gamesPlayed > 0 ? gameStats.failedRate : 0}%
                            <span className="text-xs text-gray-400 ml-1">({gameStats.failed})</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* How to Play - Only location (right column) */}
                <Collapsible open={isHowToPlayOpen} onOpenChange={setIsHowToPlayOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <Gamepad2 className="w-6 h-6 text-gray-600" />
                        <span className="font-medium text-gray-700">How to Play</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isHowToPlayOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Answer quiz questions correctly to earn ammo for your tank
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Use your ammo to destroy enemy tanks before they reach your base
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Wrong answers reduce your hearts - lose all hearts and it's game over
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        Complete all rounds to earn XP and climb the leaderboard
                      </li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        </div >

        {/* Related Games Section - Full Width */}
        < div className="!mt-20" >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {relatedGames.map((relatedGame) => {
              const gameStats = {
                questions: Array.isArray(relatedGame.questions) ? relatedGame.questions.length : (relatedGame.questions || 0),
                knowledges: Array.isArray(relatedGame.knowledges) ? relatedGame.knowledges.length : 0,
                enemies: relatedGame.enemies || 1,
                duration: Number(relatedGame.duration) || 3,
                hearts: relatedGame.hearts || 1,
                brains: relatedGame.brains || 1,
                initial_ammo: relatedGame.initial_ammo || 0,
                ammo_per_correct: relatedGame.ammo_per_correct || 1
              };

              return (
                <GameCard
                  key={relatedGame.id}
                  id={relatedGame.id}
                  name={relatedGame.title}
                  description={relatedGame.description}
                  imageUrl={relatedGame.image || coverImg}
                  category={relatedGame.category}
                  gameStats={gameStats}
                  rating={relatedGame.rating}
                  ratingCount={relatedGame.rating_count}
                  isFavourite={relatedGame.isFavourite}
                  isAiGenerated={!!relatedGame.ai_generated}
                  onPlay={() => navigate(`/game/${relatedGame.gameCode || relatedGame.id}`)}
                />
              );
            })}
          </div>
        </div >
      </main >

      {/* Report Modal */}
      < Dialog open={isReportOpen} onOpenChange={setIsReportOpen} >
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          {hasReported ? (
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
                Report Submitted
              </DialogTitle>
              <p className="text-gray-500 text-center">
                Your report has been successfully submitted.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="mb-1">
                  Report Issue
                </DialogTitle>
                <DialogDescription>
                  Why are you reporting this game?
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                {['Inappropriate Content', 'Spam or Misleading', 'Bug or Technical Issue', 'Other'].map((reason) => (
                  <div
                    key={reason}
                    className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedReason === reason
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    onClick={() => setSelectedReason(reason)}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedReason === reason ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                      {selectedReason === reason && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <span className="text-sm">
                      {reason}
                    </span>
                  </div>
                ))}

                {selectedReason === 'Other' && (
                  <Textarea
                    placeholder="Please describe the issue..."
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    className="min-h-[100px] resize-none mt-2 animate-in fade-in slide-in-from-top-1"
                    autoFocus
                  />
                )}
              </div>

              <DialogFooter className="gap-4 sm:gap-0">
                <Button variant="outline" onClick={() => setIsReportOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="default"
                  variant="default"
                  onClick={handleSubmitReport}
                  disabled={!selectedReason || (selectedReason === 'Other' && !reportMessage.trim())}
                >
                  Submit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog >

      {/* Share Game Dialog */}
      < Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} >
        <DialogContent className="w-[90vw] max-w-md mx-auto">

          {game.status === 2 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center mt-12">Game is not Published</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-center text-gray-500 mb-12">Publish the game to make it visible to players</p>
            </>
          ) : game.visibility === 2 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center mt-12">Game is Private</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-center text-gray-500 mb-12">Change visibility to public or locked to share</p>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-center mt-4">Share Game</DialogTitle>
              </DialogHeader>

              <div className="flex justify-center gap-2 pt-4 pb-2">
                {(game.gameCode || '000000').split('').map((char, index) => (
                  <div
                    key={index}
                    className="w-10 h-12 sm:w-12 sm:h-14 flex items-center justify-center text-xl sm:text-2xl font-bold rounded-lg sm:rounded-xl border-2 border-primary text-primary bg-primary/5 shadow-sm uppercase font-mono"
                  >
                    {char}
                  </div>
                ))}
              </div>

              {game.visibility === 3 && game.password && user?.username === game.creatorUsername && (
                <div className="bg-muted/50 rounded-lg p-3 mx-1 mb-2 border border-border/50 relative group">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-1.5">
                    <span className="font-medium">Room Password</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-center font-mono font-bold text-lg tracking-wider text-foreground truncate max-w-[200px]">
                      {game.password}
                    </p>
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-transparent text-gray-500 hover:text-gray-700 hover:bg-transparent"
                      onClick={handleCopyPassword}
                      title="Copy Password"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-2">
                <Button onClick={handleCopyPin} className="w-full gap-2" size="default">
                  <Copy className="h-4 w-4" />
                  Copy Code
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full gap-2" size="default">
                      <Ellipsis className="h-4 w-4" />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuItem onClick={() => window.open(`/share/${game.gameCode}`, '_blank')} className="gap-2 cursor-pointer">
                      <Play className="h-4 w-4" />
                      Join Screen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNativeShare} className="gap-2 cursor-pointer">
                      <ExternalLink className="h-4 w-4" />
                      Share to other app
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog >
      <JoinUsModal isOpen={showJoinUs} onOpenChange={setShowJoinUs} />

    </div >
  );
}
