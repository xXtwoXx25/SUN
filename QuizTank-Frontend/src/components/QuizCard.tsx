import { Clock, Star, Zap, Bookmark } from 'lucide-react';
import { Quiz, Difficulty, Category } from '@/types/quiz';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface QuizCardProps {
  quiz: Quiz;
  onPlay?: (quiz: Quiz) => void;
  onBookmark?: (quiz: Quiz) => void;
  showBookmark?: boolean;
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-green-500/20 text-green-600 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-600 border-red-500/30',
};

const categoryLabels: Record<Category, string> = {
  math: 'Math',
  science: 'Science',
  history: 'History',
  geography: 'Geography',
  language: 'Language',
  technology: 'Technology',
  art: 'Art',
  general: 'General',
};

const categoryEmojis: Record<Category, string> = {
  math: '➗',
  science: '🔬',
  history: '🏛️',
  geography: '🌍',
  language: '💬',
  technology: '💻',
  art: '🎨',
  general: '📚',
};

const QuizCard = ({ quiz, onPlay, onBookmark, showBookmark = false }: QuizCardProps) => {
  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col border border-border">
      {/* Card Header / Image */}
      <div className="relative h-36 bg-gradient-to-br from-secondary to-primary/20 flex items-center justify-center">
        <span className="text-5xl">{categoryEmojis[quiz.category]}</span>

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
            {categoryLabels[quiz.category]}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className={`text-xs capitalize ${difficultyColors[quiz.difficulty]}`}>
            {quiz.difficulty}
          </Badge>
        </div>

        {/* AI Generated Badge */}
        {quiz.isAiGenerated && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-600 border-purple-500/30">
              AI Generated
            </Badge>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <h3 className="font-bold text-lg line-clamp-1">{quiz.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {quiz.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{quiz.questionCount} Question</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            <span>+{quiz.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold text-foreground">{quiz.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Play Button */}
        <div className="flex gap-2 mt-auto pt-2">
          <Button
            className={showBookmark ? "flex-1" : "w-full"}
            onClick={() => onPlay?.(quiz)}
          >
            Play Now
          </Button>
          {showBookmark && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onBookmark?.(quiz)}
              className="shrink-0"
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
