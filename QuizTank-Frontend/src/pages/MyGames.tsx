import { useState, useEffect } from "react";
import { gameRoomService, GAME_STATUS, GAME_VISIBILITY } from "@/services/gameRoomService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
  Play,
  Eye,
  Edit,
  Trash2,
  Clock,
  Gamepad2,
  Star,
  Dot,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Plus,
  Globe,
  EyeOff,
  Lock,
  Copy,
  Share2,
  Ellipsis,
  ListX,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import coverImg from "@/assets/cover-img.jpg";

interface Game {
  id: number;
  name: string;
  category: string;
  questionCount?: number;
  knowledgeCount?: number;
  status: number; // 1=Published, 2=Draft
  visibility: number; // 1=Public, 2=Private
  cover_image: string;
  created_at: string;
  duration?: number;
  tags?: string[];
  password?: string;
  gameCode?: string;
  rating?: number;
  rating_count?: number;
  play_count?: number;
}


// Mock user profile data
const userProfile = {
  displayName: "Wittawin Susutti",
  username: "DSGas",
  avatar: "",
  bio: "Creating fun quiz battles for my class. Love teaching math and science!",
  joinedDate: "2024-01-01",
  badges: ["Creator", "Educator"],
};

const MyGames = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [gameToPublish, setGameToPublish] = useState<Game | null>(null);

  // Share dialog states
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [gameToShare, setGameToShare] = useState<Game | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 5;

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const data = await gameRoomService.getMyGames();
      // Cast the response to our Game interface
      setGames(Array.isArray(data) ? data.map(g => ({
        id: g.id,
        name: g.name,
        category: g.category || '',
        questionCount: (g as any).questionCount,
        knowledgeCount: (g as any).knowledgeCount,
        status: g.status,
        visibility: g.visibility,
        cover_image: g.cover_image || '',
        created_at: g.created_at,
        duration: g.duration,
        tags: g.tags,
        password: g.password,
        gameCode: (g as any).gameCode,
        rating: (g as any).rating,
        rating_count: (g as any).rating_count,
        play_count: (g as any).play_count || (g as any).total_plays || 0
      })) : []);
    } catch (error) {
      console.error("Fetch games error:", error);
      toast.error("Failed to load games");
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = games.slice(indexOfFirstGame, indexOfLastGame);
  const totalPages = Math.ceil(games.length / gamesPerPage);

  const totalPlayers = 0; // Stats placeholder
  const avgRating = "0.0"; // Stats placeholder

  const handleDeleteClick = (game: Game) => {
    setSelectedGame(game);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedGame) {
      try {
        await gameRoomService.deleteGame(selectedGame.id.toString());
        setGames(games.filter(g => g.id !== selectedGame.id));
        toast.success("Game deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedGame(null);
      } catch (error) {
        toast.error("Failed to delete game");
      }
    }
  };

  const handlePublishClick = (game: Game) => {
    setGameToPublish(game);
    setPublishDialogOpen(true);
  };

  const handlePublishConfirm = async () => {
    if (gameToPublish) {
      try {
        await gameRoomService.updateGame(gameToPublish.id.toString(), { status: GAME_STATUS.PUBLISHED });
        setGames(games.map(g => g.id === gameToPublish.id ? { ...g, status: GAME_STATUS.PUBLISHED } : g));
        toast.success("Game published successfully");
        setPublishDialogOpen(false);
        setGameToPublish(null);
      } catch (error) {
        toast.error("Failed to publish game");
      }
    }
  };

  const handleShareClick = (game: Game) => {
    setGameToShare(game);
    setShareDialogOpen(true);
  };

  const handleCopyPin = () => {
    if (gameToShare) {
      const pin = gameToShare.gameCode;
      navigator.clipboard.writeText(pin);
      toast.success("Game Code copied to clipboard!");
    }
  };

  const handleCopyPassword = () => {
    if (gameToShare?.password) {
      navigator.clipboard.writeText(gameToShare.password);
      toast.success("Password copied to clipboard!");
    }
  };

  const handleNativeShare = async () => {
    if (gameToShare) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: gameToShare.name,
            text: `Join my game "${gameToShare.name}" on QuizTank!`,
            url: window.location.origin, // Or a specific join link if available
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
    }
  };

  const handleToggleStatus = async (gameId: number) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    // Prevent changing from Published to Draft
    if (game.status === GAME_STATUS.PUBLISHED) {
      toast.error("Published games cannot be reverted to draft");
      return;
    }

    const newStatus = game.status === GAME_STATUS.PUBLISHED ? GAME_STATUS.DRAFT : GAME_STATUS.PUBLISHED;
    try {
      await gameRoomService.updateGame(gameId.toString(), { status: newStatus });
      setGames(games.map(g => g.id === gameId ? { ...g, status: newStatus } : g));
      toast.success(`Game ${newStatus === GAME_STATUS.PUBLISHED ? "published" : "unpublished"} successfully`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 pt-8 pb-20">
        {/* Page Header with Create Game button */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">My Games</h1>
            <p className="text-muted-foreground hidden lg:block">Manage and track your created games</p>
          </div>
          <Button onClick={() => navigate('/games/create')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Game
          </Button>
        </div>



        {/* Games List */}
        <div className="space-y-4 mb-8">
          {currentGames.map((game, index) => (
            <Card
              key={game.id}
              className="p-6 shadow-neumorphic hover-lift transition-smooth animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Thumbnail */}
                <div className="w-full h-40 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                  <img
                    src={game.cover_image || coverImg}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Game Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex-1 items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center justify-between gap-6 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground truncate max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[700px]">{game.name}</h3>
                        <div className="flex items-center gap-2">
                          <Star className="text-yellow-500 fill-yellow-500 w-4 h-4 mb-0.5" />
                          <span className="text-yellow-500 font-medium">{Number(game.rating) > 0 ? Number(game.rating).toFixed(1) : "-"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs lg:text-sm text-muted-foreground">
                        <p>{game.category}</p>
                        <Dot className="hidden md:block w-4 h-4" />
                        <p className="hidden md:block">{game.questionCount || 0}{" "}{(game.questionCount || 0) === 1 ? "Question" : "Questions"}</p>
                        <Dot className="hidden md:block w-4 h-4" />
                        <p className="hidden md:block">{game.knowledgeCount || 0}{" "}{(game.knowledgeCount || 0) === 1 ? "Knowledge" : "Knowledges"}</p>
                        <Dot className="w-4 h-4" />
                        <p>{game.play_count || 0} Players</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-2.5 mb-5">
                    {game.status === GAME_STATUS.PUBLISHED ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Published
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1">
                        <Save className="w-3 h-3" />
                        Draft
                      </span>
                    )}

                    {game.visibility === 1 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    ) : game.visibility === 2 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Private
                      </span>
                    ) : game.visibility === 3 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    ) : game.visibility === 4 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1">
                        <ListX className="w-3 h-3" />
                        Unlisted
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1">
                        Unknown
                      </span>
                    )}

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4">
                    {/* Desktop View */}
                    <div className="hidden lg:flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button onClick={() => window.open(`/game/${game.gameCode}`, '_blank')} variant="default" size="sm">
                          <Play className="w-4 h-4" />
                          Play
                        </Button>
                        <Button onClick={() => navigate(`/games/view/${game.id}`)} variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button onClick={() => navigate(`/games/edit/${game.id}`)} variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>

                        {game.status !== GAME_STATUS.PUBLISHED && (
                          <Button onClick={() => handlePublishClick(game)} variant="outline" size="sm" className="text-green-600 hover:text-green-600 hover:bg-green-600/10">
                            <Check className="w-4 h-4" />
                            Publish
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(game)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => handleShareClick(game)}>
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                    </div>

                    {/* Mobile View */}
                    <div className="flex lg:hidden items-center gap-2 w-full">
                      <Button onClick={() => window.open(`/game/${game.gameCode}`, '_blank')} variant="default" size="sm" className="flex-1 sm:max-w-[200px]">
                        <Play className="w-4 h-4" />
                        Play
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/games/view/${game.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/games/edit/${game.id}`)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit Game
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {game.status !== GAME_STATUS.PUBLISHED && (
                            <DropdownMenuItem onClick={() => handlePublishClick(game)} className="text-green-600 focus:text-green-600 focus:bg-green-50">
                              <Check className="w-4 h-4 mr-2" /> Publish
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => handleShareClick(game)}>
                            <Share2 className="w-4 h-4 mr-2" /> Share
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => handleDeleteClick(game)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Improved Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 animate-fade-in">
            <div className="flex justify-center overflow-x-auto w-full no-scrollbar">
              <nav className="flex items-center gap-0.5 sm:gap-1 min-w-max px-2" aria-label="Pagination">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex shrink-0 items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all ${currentPage === 1
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => (
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="flex shrink-0 items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground text-xs sm:text-base">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`flex shrink-0 items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-xs sm:text-base transition-all ${currentPage === page
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  )
                ))}

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex shrink-0 items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all ${currentPage === totalPages
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Empty State */}
        {games.length === 0 && (
          <Card className="p-12 text-center animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Gamepad2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">No Games Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start creating engaging quiz games for your learners
              </p>
              <Button onClick={() => navigate("/games/create")} size="lg">
                Create Your First Game
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Game?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this game? This action cannot be undone and all game data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Game?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish this game? Once published, the game will be visible to players and some editing features will be locked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishConfirm}>
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Game Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto">

          {gameToShare?.status === 2 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center mt-12">Game is not Published</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-center text-gray-500 mb-12">Publish the game to make it visible to players</p>
            </>
          ) : gameToShare?.visibility === 2 ? (
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
                {(gameToShare?.gameCode || '000000').split('').map((char, index) => (
                  <div
                    key={index}
                    className="w-10 h-12 sm:w-12 sm:h-14 flex items-center justify-center text-xl sm:text-2xl font-bold rounded-lg sm:rounded-xl border-2 border-primary text-primary bg-primary/5 shadow-sm uppercase font-mono"
                  >
                    {char}
                  </div>
                ))}
              </div>

              {gameToShare?.visibility === 3 && (
                <div className="bg-muted/50 rounded-lg p-3 mx-1 mb-2 border border-border/50 relative group">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-1.5">
                    <span className="font-medium">Room Password</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-center font-mono font-bold text-lg tracking-wider text-foreground truncate max-w-[200px]">
                      {gameToShare.password}
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
                    <DropdownMenuItem onClick={() => window.open(`/share/${gameToShare?.gameCode}`, '_blank')} className="gap-2 cursor-pointer">
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
    </div >
  );
};

export default MyGames;
