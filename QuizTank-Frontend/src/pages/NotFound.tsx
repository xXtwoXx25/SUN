import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, Gamepad2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="container py-12 md:py-20">
      <div className="max-w-lg mx-auto text-center">
        {/* 404 Illustration */}
        <div className="mb-6">
          <div className="text-8xl md:text-9xl font-bold text-primary/20 select-none">
            404
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Don't worry, you can find plenty of other quizzes to explore!
        </p>

        {/* Action Buttons */}
        <div className="mb-12">
          <Link to={ROUTES.HOME}>
            <Button className="w-full sm:w-auto">
              Back to Home
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
