import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadMoreButtonProps {
  onClick?: () => void;
}

const LoadMoreButton = ({ onClick }: LoadMoreButtonProps) => {
  return (
    <div className="flex justify-center py-8">
      <Button
        variant="outline"
        size="lg"
        onClick={onClick}
        className="gap-2 border-2"
      >
        <ArrowRight className="h-4 w-4" />
        Load More Games
      </Button>
    </div>
  );
};

export default LoadMoreButton;
