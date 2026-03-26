import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GameCard } from "@/components/GameCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gamepad2, Search as SearchIcon, Loader2 } from "lucide-react";
import { GameFilters } from "@/components/GameFilters";
import { gameRoomService } from "@/services/gameRoomService";
import { calculateDifficulty } from "@/utils/gameDifficulty";
import coverImg from "@/assets/cover-img.jpg";
import { toast } from "sonner";

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [difficulty, setDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [showFilters, setShowFilters] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearchQuery(q);
    }
    const cat = searchParams.get("category");
    if (cat !== null) {
      setCategory(cat);
    }
  }, [searchParams]);

  useEffect(() => {
    // Check for search query or filter updates
    setOffset(0);
    setHasMore(true);
    // Debounce search
    const timer = setTimeout(() => {
      fetchGames(0);
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
  }, [isLoading, isLoadingMore, hasMore, searchQuery]);

  const loadMore = () => {
    setIsLoadingMore(true);
    const newOffset = offset + 12;
    setOffset(newOffset);
    fetchGames(newOffset, true);
  };


  const fetchGames = async (currentOffset = 0, isLoadMore = false) => {
    if (!isLoadMore) setIsLoading(true);
    try {
      let data;
      const catParam = category === 'all' ? undefined : category;
      const diffParam = difficulty === 'all' ? undefined : difficulty;

      if (searchQuery.trim()) {
        data = await gameRoomService.searchGames(searchQuery, 12, currentOffset, sortBy, catParam, diffParam);
      } else {
        // If no search query, fetch public games to allow category browsing
        // Check if user is filtering by category or difficulty
        data = await gameRoomService.getPublicGames(24, currentOffset, sortBy, catParam, diffParam);
      }

      if (data.length < 12) setHasMore(false); else setHasMore(true);

      if (isLoadMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const processed = data.map((g: any) => {
        const qCount = Array.isArray(g.questions) ? g.questions.length : 0;

        const gameStats = {
          questions: qCount,
          knowledges: Array.isArray(g.knowledges) ? g.knowledges.length : 0,
          enemies: g.enemies || 1,
          duration: Number(g.duration) || 3,
          hearts: g.hearts || 1,
          brains: g.brains || 1,
          initial_ammo: g.initial_ammo || 0,
          ammo_per_correct: g.ammo_per_correct || 1
        };

        return {
          id: g.id,
          title: g.name,
          category: g.category,
          gameStats, // Pass stats object
          difficulty: calculateDifficulty(gameStats).level,
          rating: g.rating || 0,
          ratingCount: g.rating_count || 0,
          play_count: g.play_count || 0,
          description: g.description,
          image: g.cover_image || coverImg,
          isFavourite: g.is_favourite,
          isAiGenerated: !!g.ai_generated,
          gameCode: g.gameCode,
          created_at: g.created_at
        };
      });
      if (isLoadMore) {
        setGames((prev) => {
          const existingIds = new Set(prev.map(g => g.id));
          const uniqueNewGames = processed.filter((g: any) => !existingIds.has(g.id));
          return [...prev, ...uniqueNewGames];
        });
      } else {
        setGames(processed);
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
      toast.error("Failed to load games");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const filteredGames = games;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-8 pb-20">
        {/* Page Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-4">Discover Games</h1>
          <p className="text-muted-foreground text-lg">Find the perfect quiz battle for your learning journey</p>
        </div>

        {/* Search Bar and Filters */}
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

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Found <span className="font-bold text-primary">{filteredGames.length}</span> games
          </p>
        </div>

        {/* Search Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[350px] rounded-3xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filteredGames.length === 0 && (searchQuery.trim() || category !== "all") ? (
          <Card className="p-12 text-center shadow-neumorphic">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search query or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCategory("all");
                setDifficulty("all");
              }}
            >
              Clear All Filters
            </Button>
          </Card>
        ) : filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game, index) => (
              <div
                key={game.id}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <GameCard
                  id={game.id}
                  name={game.title}
                  description={game.description}
                  imageUrl={game.image}
                  category={game.category}
                  gameStats={game.gameStats}
                  rating={game.rating}
                  ratingCount={game.ratingCount}
                  isFavourite={game.isFavourite}
                  isAiGenerated={game.isAiGenerated}
                  onPlay={() => navigate(`/game/${game.gameCode || game.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center shadow-neumorphic">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No games found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters to find more games
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCategory("all");
                setDifficulty("all");
              }}
            >
              Clear All Filters
            </Button>
          </Card>
        )}
        {isLoadingMore && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;
