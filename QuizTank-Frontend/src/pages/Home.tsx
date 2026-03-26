
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '@/components/HeroSection';
import CategoryBar from '@/components/CategoryBar';
import DailyChallengeCard from '@/components/DailyChallengeCard';
import { GameCard } from '@/components/GameCard';
import { Category } from '@/types/quiz';
import { useAuth } from '@/contexts/AuthContext';
import { optionService } from '@/services/optionService';
import { gameRoomService } from '@/services/gameRoomService';
import { Flame, Sparkles, Clock, Rocket, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateDifficulty } from "@/utils/gameDifficulty";
import coverImg from "@/assets/cover-img.jpg";
import { toast } from "sonner";

const Home = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [categories, setCategories] = useState<string[]>([]);

  // Tab State
  const [activeTab, setActiveTab] = useState(isLoggedIn ? "foryou" : "trending");
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Use ref to track active tab for async operations
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const options = await optionService.getOptions();
        const cats = options.find((o: any) => o.key === 'categories')?.value || [];
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      setActiveTab("foryou");
    } else {
      if (activeTab === "foryou") {
        setActiveTab("trending");
      }
    }
  }, [isLoggedIn]);

  // Update ref when tab changes
  useEffect(() => {
    activeTabRef.current = activeTab;
    setOffset(0);
    setHasMore(true);
    setGames([]);
    fetchGames(activeTab, 0);
  }, [activeTab]);

  // Infinite Scroll
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
  }, [isLoading, isLoadingMore, hasMore, activeTabRef.current]);

  const loadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const newOffset = offset + 12;
    setOffset(newOffset);
    // Pass the current active tab to fetchGames
    fetchGames(activeTabRef.current, newOffset, true);
  };

  const fetchGames = async (tab: string, currentOffset: number, isLoadMore = false) => {
    // Prevent fetching if tab has changed during a load more op
    if (isLoadMore && tab !== activeTabRef.current) {
      setIsLoadingMore(false);
      return;
    }

    if (!isLoadMore) setIsLoading(true);

    try {
      let data;
      const limit = 12;

      // Map tab to API parameters
      switch (tab) {
        case 'foryou':
          data = await gameRoomService.getPublicGames(limit, currentOffset, 'rating');
          break;
        case 'recent':
          data = await gameRoomService.getPublicGames(limit, currentOffset, 'newest');
          break;
        case 'trending':
          data = await gameRoomService.getPublicGames(limit, currentOffset, 'popularity');
          break;
        case 'ai':
          data = await gameRoomService.getPublicGames(limit, currentOffset, 'newest', undefined, undefined, true);
          break;
        default:
          data = await gameRoomService.getPublicGames(limit, currentOffset, 'newest');
      }

      // Check if tab changed while fetching
      if (tab !== activeTabRef.current) return;

      if (data.length < limit) setHasMore(false); else setHasMore(true);

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
          gameStats,
          difficulty: calculateDifficulty(gameStats).level,
          rating: g.rating || 0,
          ratingCount: g.rating_count || 0,
          play_count: g.play_count || 0,
          description: g.description,
          imageUrl: g.cover_image || coverImg,
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
      if (tab === activeTabRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const handleSelectCategory = (category: Category | undefined) => {
    if (category) {
      navigate(`/search?category=${encodeURIComponent(category)}`);
    } else {
      navigate('/search');
    }
  };

  const handlePlayQuiz = (quiz: any) => {
    navigate(`/game/${quiz.gameCode || quiz.id}`);
  };

  const renderGameGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
      {isLoading && !isLoadingMore && games.length === 0 ? (
        [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-[350px] rounded-3xl bg-muted/50 animate-pulse" />
        ))
      ) : games.length > 0 ? (
        games.map((quiz) => (
          <GameCard
            key={`${activeTab}-${quiz.id}`}
            id={quiz.id}
            name={quiz.title}
            description={quiz.description}
            imageUrl={quiz.imageUrl}
            category={quiz.category}
            rating={quiz.rating}
            gameStats={quiz.gameStats}
            isAiGenerated={quiz.isAiGenerated}
            gameCode={quiz.gameCode}
            isFavourite={quiz.isFavourite}
            onPlay={() => handlePlayQuiz(quiz)}
          />
        ))
      ) : (
        <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/20 rounded-3xl border border-dashed">
          <div className="flex flex-col items-center gap-3">
            <Rocket className="w-10 h-10 text-muted-foreground/50" />
            <p>No games found in this category yet.</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <main id="main-content">
        <HeroSection />

        <div className="container px-6 mb-6">
          <DailyChallengeCard isLoggedIn={isLoggedIn} />
        </div>

        <CategoryBar
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          categories={categories}
        />

        <div className="container px-6 pb-20 mt-10">
          <Tabs defaultValue={isLoggedIn ? "foryou" : "trending"} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col mb-8">
              <TabsList className="w-full md:w-fit flex justify-start md:justify-center overflow-x-auto scrollbar-hide bg-transparent md:bg-muted/80 p-0 md:p-1 gap-3 md:gap-1 rounded-none md:rounded-full pb-2 md:pb-1 h-auto">

                {/* For You - Only for Logged In Users */}
                {isLoggedIn && (
                  <TabsTrigger
                    value="foryou"
                    className="rounded-full px-4 md:px-6 py-2.5 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 border border-border/40 md:border-transparent bg-background/50 md:bg-transparent shadow-sm md:shadow-none"
                  >
                    <span className="flex items-center gap-2">
                      <Rocket className="w-4 h-4" />
                      For You
                    </span>
                  </TabsTrigger>
                )}

                {/* Trending Now */}
                <TabsTrigger
                  value="trending"
                  className="rounded-full px-4 md:px-6 py-2.5 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 border border-border/40 md:border-transparent bg-background/50 md:bg-transparent shadow-sm md:shadow-none"
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Trending Now
                  </span>
                </TabsTrigger>

                {/* Recently Published */}
                <TabsTrigger
                  value="recent"
                  className="rounded-full px-4 md:px-6 py-2.5 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 border border-border/40 md:border-transparent bg-background/50 md:bg-transparent shadow-sm md:shadow-none"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recently Published
                  </span>
                </TabsTrigger>

                {/* AI Generated */}
                <TabsTrigger
                  value="ai"
                  className="rounded-full px-4 md:px-6 py-2.5 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 border border-border/40 md:border-transparent bg-background/50 md:bg-transparent shadow-sm md:shadow-none"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Generated
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="foryou" className="mt-0">
              {renderGameGrid()}
            </TabsContent>
            <TabsContent value="trending" className="mt-0">
              {renderGameGrid()}
            </TabsContent>
            <TabsContent value="recent" className="mt-0">
              {renderGameGrid()}
            </TabsContent>
            <TabsContent value="ai" className="mt-0">
              {renderGameGrid()}
            </TabsContent>
          </Tabs>

          {isLoadingMore && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
