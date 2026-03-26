import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  Loader2
} from "lucide-react";
import { gameRoomService } from "@/services/gameRoomService";
import { GameCard } from "@/components/GameCard";
import { GameFilters } from "@/components/GameFilters";
import { toast } from "sonner";
import { calculateDifficulty } from "@/utils/gameDifficulty";
import coverImg from "@/assets/cover-img.jpg";

export default function Favourites() {
  const navigate = useNavigate();
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchFavourites(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, category, difficulty]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200 &&
        !isLoading &&
        !isLoadingMore &&
        hasMore
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoading, isLoadingMore, hasMore]);

  const loadMore = () => {
    setIsLoadingMore(true);
    const newOffset = offset + 12;
    setOffset(newOffset);
    fetchFavourites(newOffset, true);
  };


  const fetchFavourites = async (currentOffset = 0, isLoadMore = false) => {
    if (!isLoadMore) setIsLoading(true);
    try {
      const catParam = category === 'all' ? undefined : category;
      const diffParam = difficulty === 'all' ? undefined : difficulty;
      const data = await gameRoomService.getMyFavourites(12, currentOffset, sortBy, catParam, diffParam, searchQuery);

      if (data.length < 12) setHasMore(false); else setHasMore(true);

      if (isLoadMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Process games to add stats for GameCard
      const processedGames = data.map((game: any) => {
        const questionCount = Array.isArray(game.questions) ? game.questions.length : 0;

        const gameStats = {
          questions: questionCount,
          knowledges: Array.isArray(game.knowledges) ? game.knowledges.length : 0,
          enemies: game.enemies || 1,
          duration: Number(game.duration) || 3,
          hearts: game.hearts || 1,
          brains: game.brains || 1,
          initial_ammo: game.initial_ammo || 0,
          ammo_per_correct: game.ammo_per_correct || 1
        };

        return {
          ...game,
          gameStats,
          difficulty: calculateDifficulty(gameStats).level,
          rating: game.rating || 0,
          rating_count: game.rating_count || 0,
          play_count: game.play_count || 0,
          imageUrl: game.cover_image || coverImg,
          gameCode: game.gameCode
        };
      });

      if (isLoadMore) {
        setGames((prev) => {
          const existingIds = new Set(prev.map(g => g.id));
          const uniqueNewGames = processedGames.filter((g: any) => !existingIds.has(g.id));
          return [...prev, ...uniqueNewGames];
        });
      } else {
        setGames(processedGames);
      }
    } catch (error) {
      console.error("Failed to fetch favourites:", error);
      toast.error("Failed to load favourite games");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleRemoveFavourite = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await gameRoomService.removeFavourite(gameId);
      setGames(games.filter(g => g.id !== gameId));
      toast.success("Removed from favourites");
    } catch (error) {
      toast.error("Failed to remove favourite");
    }
  };

  const handleShare = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}/game/${gameId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const filteredGames = games;



  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Favourites</h1>
          <p className="text-gray-500">Games you have saved for later</p>
        </div>
        <div className="mb-10">
          <GameFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            category={category}
            onCategoryChange={setCategory}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No favourites found</h3>
            <p className="text-gray-500">Try adjusting your filters or add some games to your favourites!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                name={game.name}
                description={game.description}
                imageUrl={game.imageUrl}
                category={game.category}
                gameStats={game.gameStats}
                rating={game.rating}
                ratingCount={game.rating_count}
                onPlay={() => navigate(`/game/${game.gameCode || game.id}`)}
                isFavourite={true}
                isAiGenerated={!!game.ai_generated}
                onFavouriteToggle={(isLiked) => {
                  if (!isLiked) {
                    // Optional: delayed removal for better UX, or immediate
                    setGames(prev => prev.filter(g => g.id !== game.id));
                  }
                }}
              />
            ))}
          </div>
        )}
        {isLoadingMore && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
