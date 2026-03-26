import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { gameRoomService, QUESTION_TYPES, GAME_VISIBILITY, GAME_STATUS } from "@/services/gameRoomService";
import { gameService } from "@/services/gameService";
import { mapService } from "@/services/mapService";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Share2,
  Pencil,
  Star,
  Image as ImageIcon,
  Check,
  Copy,
  Ellipsis,
  Heart,
  Swords,
  Map as MapIcon,
  Globe,
  Lock,
  EyeOff,
  Save,
  ListX,
  Play,
  ExternalLink
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { GameTabs } from "@/components/games/GameTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "general", label: "General" },
  { id: "questions", label: "Questions" },
  { id: "knowledge", label: "Knowledges" },
  { id: "gameplay", label: "Gameplay" },
];

export default function GameDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isVideo = (url: string, type?: string) => {
    if (type === 'video') return true;
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  useEffect(() => {
    if (id) {
      fetchGameDetails();
    }
  }, [id]);

  const fetchGameDetails = async () => {
    try {
      const [data, stats, maps] = await Promise.all([
        gameRoomService.getGame(id!),
        gameService.getGameStats(id!),
        mapService.getAllMaps()
      ]);

      // Check ownership
      if (user?.id && (data as any).user_id && String(user.id) !== String((data as any).user_id)) {
        navigate('/404');
        return;
      }

      // Check if removed (status === 3)
      if (Number(data.status) === 3) {
        navigate('/404');
        return;
      }

      // Transform data for display
      const getQuestionTypeLabel = (type: number) => {
        switch (type) {
          case QUESTION_TYPES.FILL: return 'fill';
          case QUESTION_TYPES.MULTIPLE: return 'multiple';
          default: return 'single';
        }
      };

      const selectedMap = maps.find((m: any) => m.map_id === (data.map || 1));

      setGame({
        ...data,
        name: data.name || "Untitled Game",
        // Keep raw values for logic
        rawVisibility: data.visibility,
        gameCode: (data as any).game_code,
        password: (data as any).password,
        visibility: data.visibility === GAME_VISIBILITY.PUBLIC ? 'public' : 'private',
        questions: (data.questions || []).map((q: any, idx: number) => ({
          id: `q${idx + 1}`,
          type: getQuestionTypeLabel(q.type),
          question: q.question,
          choices: (q.choices || []).map((c: any, cidx: number) => ({
            id: `c${cidx + 1}`,
            text: c.content,
            isCorrect: c.correct === 1
          })),
          fillAnswers: q.answers || [],
          media: q.media || []
        })),
        knowledges: (data.knowledges || []).map((k: any, idx: number) => ({
          id: `k${idx + 1}`,
          content: k.content,
          media: k.media || (k.media_url ? [{ url: k.media_url, type: 'image' }] : [])
        })),
        gameplay: {
          duration: data.duration !== undefined ? data.duration : 3,
          enemies: data.enemies !== undefined ? data.enemies : 1,
          hearts: data.hearts !== undefined ? data.hearts : 1,
          brains: data.brains !== undefined ? data.brains : 1,
          initialAmmo: data.initial_ammo !== undefined ? data.initial_ammo : 0,
          ammoPerCorrect: data.ammo_per_correct !== undefined ? data.ammo_per_correct : 1,
          mapName: selectedMap?.name || "",
          mapImage: selectedMap?.image_url || "",
          questionsOrder: !!(data as any).questions_order,
          knowledgesOrder: !!(data as any).knowledges_order
        },
        stats: {
          players: stats.totalPlays || 0,
          favorites: (data as any).favorites_count || 0,
          rating: (data as any).rating_count > 0 ? Number((data as any).rating).toFixed(1) : "-",
          winRate: stats.globalWinRate || 0,
          passedCount: stats.totalPassed || 0,
          reviews: (data as any).rating_count || 0
        },
        cover_image: data.cover_image
      });
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 404) {
        navigate('/404');
        return;
      }
      toast.error("Failed to load game details");
      // navigate("/my-games"); // Stay on page to debug or show error
    } finally {
      setLoading(false);
    }
  };



  const handleCopyCode = () => {
    navigator.clipboard.writeText(game.gameCode);
    toast.success("Game Code copied to clipboard!");
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
          title: game.name,
          text: `Join my game "${game.name}" on QuizTank!`,
          url: window.location.origin + `/game/${game.gameCode}`,
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

  const handlePlayGame = () => {
    navigate(`/gameplay/${id}`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!game) return null;

  return (
    <PageLayout title="Game Details">

      {/* Tabbed Content */}
      <div className="rounded-xl bg-card shadow-md overflow-hidden">
        <GameTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="border-t-4 border-primary" />

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Hero Stat: Win Rate */}
              <Card className="md:col-span-2 overflow-hidden relative shadow-md border-0 bg-gradient-to-br from-primary/5 via-background to-background">
                <div className="p-8 flex flex-col gap-8 relative z-10">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">Performance</h3>
                    <p className="text-muted-foreground text-sm">Global win rate across all players for this game.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-10">
                    {/* Ring Chart */}
                    <div className="relative">
                      <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-full flex items-center justify-center relative bg-background">
                        {/* Fallback to simple reliable visualization */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-200"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className="text-primary drop-shadow-sm"
                            strokeDasharray={`${game.stats.winRate}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                        </svg>
                        <div className="text-center">
                          <span className="text-2xl font-bold">{game.stats.winRate}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 min-w-[100px] lg:min-w-[120px]">
                      <div className="flex justify-between items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">Passed</span>
                        </div>
                        <span className="font-bold">{game.stats.passedCount}</span>
                      </div>
                      <div className="flex justify-between items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          <span className="font-medium text-muted-foreground">Failed</span>
                        </div>
                        <span className="font-bold text-muted-foreground">{game.stats.players - game.stats.passedCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Key Metrics Columns */}
              <div className="space-y-4">
                <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
                  <div className="p-3 bg-blue-500/10 text-blue-600 rounded-full">
                    <Swords className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Total Plays</h4>
                    <span className="text-2xl font-bold">{game.stats.players}</span>
                  </div>
                </Card>

                <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
                  <div className="p-3 bg-amber-500/10 text-amber-600 rounded-full">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Rating</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{game.stats.rating}</span>
                      <span className="text-xs text-muted-foreground">({game.stats.reviews} reviews)</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
                  <div className="p-3 bg-pink-500/10 text-pink-600 rounded-full">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Favorites</h4>
                    <span className="text-2xl font-bold">{game.stats.favorites}</span>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Name</label>
                    <div className="text-sm font-medium truncate overflow-hidden">{game.name}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Category</label>
                    <div className="text-sm font-medium">{game.category}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Status</label>
                    <div className="text-sm flex items-center gap-2">
                      {game.status === GAME_STATUS.PUBLISHED ? (
                        <span className="font-medium flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Published
                        </span>
                      ) : (
                        <span className="font-medium flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Visibility</label>
                    <div className="text-sm flex items-center gap-2">
                      {game.rawVisibility === GAME_VISIBILITY.PUBLIC ? (
                        <span className="font-medium flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Public
                        </span>
                      ) : game.rawVisibility === GAME_VISIBILITY.PRIVATE ? (
                        <span className="font-medium flex items-center gap-2">
                          <EyeOff className="w-4 h-4" />
                          Private
                        </span>
                      ) : game.rawVisibility === GAME_VISIBILITY.LOCKED ? (
                        <span className="font-medium flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Locked
                        </span>
                      ) : game.rawVisibility === GAME_VISIBILITY.UNLISTED ? (
                        <span className="font-medium flex items-center gap-2">
                          <ListX className="w-4 h-4" />
                          Unlisted
                        </span>
                      ) : (
                        <span className="font-medium flex items-center gap-2">
                          Unknown
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Language</label>
                    <div className="text-sm font-medium">{game.language}</div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {game.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="px-3 py-1 bg-muted hover:bg-muted/80 text-xs break-words [overflow-wrap:anywhere]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Description</label>
                    <div className="text-sm flex flex-wrap gap-2 break-words [overflow-wrap:anywhere]">
                      {game.description}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="overflow-hidden shadow-sm">
                  <div className="aspect-video bg-muted relative">
                    {game.cover_image ? (
                      <img src={game.cover_image} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-muted/20 border-t">
                    <div className="text-xs font-medium text-muted-foreground text-center">Cover Image</div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Questions ({game.questions.length})</h3>
                <div className="text-sm text-muted-foreground hidden lg:block">
                  {game.questions.filter((q: any) => q.type === 'single').length} Single Answer, {' '}
                  {game.questions.filter((q: any) => q.type === 'multiple').length} Multiple Answers, {' '}
                  {game.questions.filter((q: any) => q.type === 'fill').length} Fill-in
                </div>
              </div>

              <div className="space-y-6">
                {game.questions.map((question: any, index: number) => (
                  <Card key={question.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                          {index + 1}
                        </span>
                        <Badge variant="outline" className="font-normal bg-background">
                          {question.type === "single" ? "Single Answer" :
                            question.type === "multiple" ? "Multiple Answers" : "Fill-in Answer"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 p-6">
                      <div className="flex-1 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Question</h4>
                          <p className="text-lg font-medium leading-relaxed break-words [overflow-wrap:anywhere]">{question.question}</p>
                        </div>

                        <div className="space-y-3 pt-2">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            {question.type === 'fill' ? 'Correct Answers' : 'Choices'}
                          </h4>

                          {question.type === 'fill' ? (
                            <div className="flex flex-wrap gap-2">
                              {question.fillAnswers && question.fillAnswers.length > 0 ? (
                                question.fillAnswers.map((ans: string, i: number) => (
                                  <div key={i} className="bg-green-500/10 border border-green-500/30 text-green-900 rounded-lg px-3 py-2 font-medium text-sm flex items-center gap-2">
                                    <span className="break-words [overflow-wrap:anywhere]">{ans}</span>
                                    <Check className="w-4 h-4 text-green-600 min-w-fit" />
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted-foreground italic">No answers defined</div>
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {question.choices.map((choice: any, cIndex: number) => (
                                <div
                                  key={choice.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors ${choice.isCorrect
                                    ? "bg-green-500/10 border-green-500/30 text-green-900 dark:text-green-100"
                                    : "bg-background border-border text-muted-foreground"
                                    }`}
                                >
                                  <div className={`w-5 h-5 flex items-center justify-center rounded-full text-xs border ${choice.isCorrect ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30"
                                    }`}>
                                    {cIndex + 1}
                                  </div>
                                  <span className="flex-1 font-medium break-words [overflow-wrap:anywhere]">{choice.text}</span>
                                  {choice.isCorrect && <Check className="w-4 h-4 text-green-600" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
                        {question.media && question.media.length > 0 ? (
                          <div className={`grid gap-2 ${question.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {question.media.map((m: any, i: number) => (
                              <div key={i} className="rounded-xl bg-muted/50 aspect-square overflow-hidden relative border border-border/50">
                                {isVideo(m.url, m.type) ? (
                                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                                    <video
                                      src={m.url}
                                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                      autoPlay
                                      muted
                                      loop
                                      playsInline
                                    />
                                  </a>
                                ) : (
                                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                                    <img
                                      src={m.url}
                                      alt={`Question Media ${i + 1}`}
                                      className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl bg-muted/50 p-4 aspect-square flex flex-col items-center justify-center text-center border-2 border-dashed border-muted-foreground/20">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
                            <span className="text-xs text-muted-foreground">Question Media</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "knowledge" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-2">Knowledges ({game.knowledges.length})</h3>

              <div className="grid grid-cols-1 gap-6">
                {game.knowledges.map((knowledge: any, index: number) => (
                  <Card key={knowledge.id} className="p-0 overflow-hidden hover:bg-muted/5 transition-colors">
                    <div className="flex flex-col md:flex-row">
                      <div className="p-6 flex-1 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                              {index + 1}
                            </span>
                          </div>
                          <p className="text-sm leading-7 break-words [overflow-wrap:anywhere]">
                            {knowledge.content}
                          </p>
                        </div>
                      </div>
                      <div className="w-full md:w-64 bg-muted/30 border-0 md:border-l flex flex-col items-center justify-center p-0 gap-2 text-center relative overflow-hidden h-40 md:h-auto">
                        {knowledge.media && knowledge.media.length > 0 ? (
                          <div className={`grid gap-2 w-full h-full p-4 ${knowledge.media.length > 1 ? 'grid-cols-2 overflow-y-auto' : 'grid-cols-1'}`}>
                            {knowledge.media.map((m: any, i: number) => (
                              <div key={i} className="rounded-lg bg-muted/50 aspect-square overflow-hidden relative border border-border/50">
                                {isVideo(m.url, m.type) ? (
                                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                                    <video
                                      src={m.url}
                                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                      autoPlay
                                      muted
                                      loop
                                      playsInline
                                    />
                                  </a>
                                ) : (
                                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                                    <img
                                      src={m.url}
                                      alt={`Knowledge Media ${i + 1}`}
                                      className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 flex flex-col items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
                            <span className="text-xs text-muted-foreground/70">Knowledge Media</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "gameplay" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Game Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 flex flex-col justify-between transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Duration</span>
                    </div>
                    <div className="text-3xl font-bold">{game.gameplay.duration}<span className="ml-1 text-sm font-medium text-muted-foreground">min</span></div>
                  </Card>

                  <Card className="p-4 flex flex-col justify-between transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Enemies</span>
                    </div>
                    <div className="text-3xl font-bold">{game.gameplay.enemies}</div>
                  </Card>

                  <Card className="p-4 flex flex-col justify-between transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Hearts</span>
                    </div>
                    <div className="text-3xl font-bold">{game.gameplay.hearts}</div>
                  </Card>

                  <Card className="p-4 flex flex-col justify-between transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Brains</span>
                    </div>
                    <div className="text-3xl font-bold">{game.gameplay.brains}</div>
                  </Card>

                  <Card className="p-4 flex flex-col justify-between transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Initial Ammo</span>
                    </div>
                    <div className="text-3xl font-bold">{game.gameplay.initialAmmo}</div>
                  </Card>

                  <Card className="p-4 flex flex-col justify-between transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Ammo Per Correct Answer</span>
                    </div>
                    <div className="text-3xl font-bold">+{game.gameplay.ammoPerCorrect}</div>
                  </Card>

                  <Card className="p-4 flex flex-col justify-between transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Question Order</span>
                    </div>
                    <div className="text-xl font-bold truncate">{game.gameplay.questionsOrder ? "Sequential" : "Random"}</div>
                  </Card>

                  <Card className="p-4 flex flex-col justify-between transition-colors">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-wider">Knowledge Order</span>
                    </div>
                    <div className="text-xl font-bold truncate">{game.gameplay.knowledgesOrder ? "Sequential" : "Random"}</div>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Map</h3>
                {game.gameplay.mapImage && (
                  <Card className="overflow-hidden border-0 h-64 md:h-80 md:w-80 p-3 bg-muted">
                    <div className="relative h-full w-full">
                      <img
                        src={game.gameplay.mapImage}
                        alt={game.gameplay.mapName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-end justify-center">
                        <Badge variant="outline" className="bg-gray-900/90 text-white backdrop-blur-sm border-0 mb-6 text-sm px-6 py-2 font-semibold">
                          {game.gameplay.mapName}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer Actions */}
      <div className="sticky bottom-0 bg-white py-6 px-4 mt-8">
        <div className="flex justify-end gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Link to={`/games/edit/${id}`}>
            <Button className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit Game
            </Button>
          </Link>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">
          {game.status === 2 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center mt-12">Game is not Published</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-center text-gray-500 mb-12">Publish the game to make it visible to players</p>
            </>
          ) : game.rawVisibility === 2 ? (
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
                {(game.gameCode || '000000').split('').map((char: string, index: number) => (
                  <div
                    key={index}
                    className="w-10 h-12 sm:w-12 sm:h-14 flex items-center justify-center text-xl sm:text-2xl font-bold rounded-lg sm:rounded-xl border-2 border-primary text-primary bg-primary/5 shadow-sm uppercase font-mono"
                  >
                    {char}
                  </div>
                ))}
              </div>

              {game.rawVisibility === 3 && (
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
                      className="h-8 w-8 bg-transparent text-gray-500 hover:text-gray-700 hover:bg-transparent shadow-none"
                      onClick={handleCopyPassword}
                      title="Copy Password"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-2">
                <Button onClick={handleCopyCode} className="w-full gap-2" size="default">
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
      </Dialog>
    </PageLayout>
  );
}
