import { useState, useEffect } from "react";
import { Star, Dot, Heart, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDifficultyColor, calculateDifficulty, GameStats } from "@/utils/gameDifficulty";
import { gameRoomService } from "@/services/gameRoomService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { JoinUsModal } from "@/components/JoinUsModal";
import coverImg from "@/assets/cover-img.jpg";

export interface GameCardProps {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  rating?: number;
  ratingCount?: number;
  isFavourite?: boolean;
  onPlay: () => void;
  onFavouriteToggle?: (isFavourite: boolean) => void;
  isAiGenerated?: boolean;

  // Stats for calculation
  gameStats?: GameStats;

  // Overrides or direct values
  difficulty?: string;
  questions?: number;
  xp?: number;
  gameCode?: string;
}

export const GameCard = ({
  id,
  name,
  description,
  imageUrl,
  category,
  rating,
  ratingCount,
  isFavourite = false,
  onPlay,
  onFavouriteToggle,
  gameStats,
  difficulty,
  questions,
  xp,
  isAiGenerated,
}: GameCardProps) => {
  const [isLiked, setIsLiked] = useState(isFavourite);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn } = useAuth();
  const [showJoinUs, setShowJoinUs] = useState(false);

  useEffect(() => {
    setIsLiked(isFavourite);
  }, [isFavourite]);

  const handleToggleFavourite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isLoggedIn) {
      setShowJoinUs(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isLiked) {
        await gameRoomService.removeFavourite(String(id));
        toast.success("Removed from favourites");
      } else {
        await gameRoomService.addFavourite(String(id));
        toast.success("Added to favourites");
      }
      const newState = !isLiked;
      setIsLiked(newState);
      if (onFavouriteToggle) {
        onFavouriteToggle(newState);
      }
    } catch (error) {
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate difficulty if stats provided
  let displayDifficulty = difficulty || "Normal";
  let displayXp = xp;
  let displayQuestions = questions || 0;

  if (gameStats) {
    const result = calculateDifficulty(gameStats);
    displayDifficulty = result.level;
    displayXp = result.xp;
    displayQuestions = gameStats.questions;
  }

  return (
    <>
      <Card
        className="shadow-md hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer h-full flex flex-col"
        onClick={onPlay}
      >
        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden flex-shrink-0">
          <img
            src={imageUrl || coverImg}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          {/*
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="bg-blue-500 border-blue-500 text-white text-xs">{category || "General"}</Badge>
          </div>
          */}
          <div className="absolute bottom-3 right-3">
            <Badge variant="outline" className={`${getDifficultyColor(displayDifficulty)} text-xs`}>
              {displayDifficulty}
            </Badge>
          </div>
          {isAiGenerated && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="outline" className="bg-violet-100 border-violet-200 text-violet-600 text-xs">AI Generated</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <h3 className="font-bold text-gray-900 mb-2 truncate overflow-hidden">{name}</h3>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-grow">{description || ""}</p>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4 mt-auto">
            <div className="flex items-center gap-0.5">
              <span>{category || "General"}</span>
              <Dot className="text-gray-400 w-4 h-4" />
              <span>{displayQuestions} Questions</span>
              {/*
              {displayXp !== undefined && (
                <>
                  <Dot className="text-gray-400 w-4 h-4" />
                  <span className="text-green-600">+{displayXp} XP</span>
                </>
              )}
              */}
            </div>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mb-1" />
              {Number(rating) > 0 ? Number(rating).toFixed(1) : "-"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
            >
              Play Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`p-2 !rounded-sm ${isLiked ? 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100' : 'bg-transparent'}`}
              onClick={handleToggleFavourite}
              disabled={isLoading}
            >
              <Heart className={`w-4 h-4 min-w-[30px] ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
      <JoinUsModal isOpen={showJoinUs} onOpenChange={setShowJoinUs} />
    </>
  );
};
