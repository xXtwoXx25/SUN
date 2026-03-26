import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-6 md:py-8">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>© 2026 QuizTank</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              to="/about"
              className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Contact Us
            </Link>
            <Link
              to="/terms"
              className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Use
            </Link>
            <Link
              to="/privacy"
              className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
