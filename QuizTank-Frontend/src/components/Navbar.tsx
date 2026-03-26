import { useState, useRef, useEffect } from 'react';
import { gameService } from '@/services/gameService';
import { Home, Trophy, Hash, Search, ChevronDown, Settings, Swords, ArrowRight, LayoutDashboard, User, Heart, LogOut, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { userService } from "@/services/userService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  isLoggedIn?: boolean;
  username?: string;
}


const Navbar = ({ isLoggedIn: propIsLoggedIn, username: propUsername }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn: authIsLoggedIn, logout } = useAuth();
  const [profileAvatar, setProfileAvatar] = useState<string>("");

  const isLoggedIn = propIsLoggedIn !== undefined ? propIsLoggedIn : authIsLoggedIn;
  const username = propUsername || user?.username || 'Guest';
  const [gamePin, setGamePin] = useState(['', '', '', '', '', '']);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Handle PIN input change with auto-focus
  const handlePinChange = (index: number, value: string) => {
    if (!/^[A-Za-z0-9]*$/.test(value)) return; // Only allow alphanumeric

    const newPin = [...gamePin];
    newPin[index] = value.slice(-1).toUpperCase(); // Take only last character and uppercase
    setGamePin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !gamePin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleJoinGame();
    }
  };

  // Handle paste
  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();
    const newPin = [...gamePin];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newPin[i] = char;
    });
    setGamePin(newPin);
    if (pastedData.length === 6) {
      pinInputRefs.current[5]?.focus();
    } else {
      pinInputRefs.current[pastedData.length]?.focus();
    }
  };

  const handleJoinGame = async () => {
    const pin = gamePin.join('');
    if (pin.length === 6) {
      try {
        const result = await gameService.checkGamePin(pin);
        if (result.valid) {
          toast.success(`Joining game with code: ${pin}`);
          setPinDialogOpen(false);
          setGamePin(['', '', '', '', '', '']);
          navigate(`/game/${pin}`); // Pass PIN to gameplay
        } else {
          toast.error(result.message || 'Invalid Game Code');
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Error checking game code');
      }
    } else {
      toast.error('Please enter a complete game code');
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleRoomClick = (roomName: string) => {
    toast.success(`Joining room: ${roomName}`);
    setSearchQuery('');
  };

  // Reset PIN inputs when dialog opens
  useEffect(() => {
    if (pinDialogOpen) {
      setGamePin(['', '', '', '', '', '']);
      setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
    }
  }, [pinDialogOpen]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.username) {
        try {
          const data = await userService.getProfile(user.username);
          if (data?.user?.profile_pic_url) {
            setProfileAvatar(data.user.profile_pic_url);
          }
        } catch (err) {
          console.error("Failed to load avatar", err);
        }
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 md:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 md:gap-2 font-bold text-lg md:text-xl">
            <Swords className="w-5 h-5 md:w-6 md:h-6 text-primary fill-primary/25" />
            <span className="text-foreground">Quiz<span className="text-primary">Tank</span></span>
          </Link>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/challenge">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary">
                <Trophy className="h-4 w-4" />
                Challenges
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        {location.pathname !== '/search' && (
          <div className="relative hidden lg:block w-64 xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9 bg-muted/50 border-border/50 focus:bg-background transition-all rounded-full"
            />
          </div>
        )}

        {/* Right Side */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2 md:gap-3">

            {/* Enter Game PIN Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setPinDialogOpen(true)}
              className="flex px-4 py-2 shadow-sm transition-all font-semibold text-xs sm:text-sm"
            >
              <Hash className="h-4 w-4" />
              <span>Enter Code</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 md:gap-2 px-1 md:px-2 border-0 bg-transparent !ring-0 !focus:ring-0">
                  <Avatar className="h-7 w-7 md:h-8 md:w-8">
                    {profileAvatar && (
                      <AvatarImage
                        src={profileAvatar}
                        alt="Profile"
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline font-medium text-sm md:text-base">{username}</span>
                  <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Mobile-only menu items */}
                {user?.role?.toUpperCase() === 'ADMIN' && (
                  <>
                    <DropdownMenuItem className="cursor-pointer font-semibold text-primary" onClick={() => navigate('/admin/dashboard')}>
                      <ShieldCheck className="h-4 w-4 mr-2.5" />
                      Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem className="lg:hidden cursor-pointer" onClick={() => navigate('/')}>
                  <Home className="h-4 w-4 mr-2.5" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem className="lg:hidden cursor-pointer" onClick={() => navigate('/search')}>
                  <Search className="h-4 w-4 mr-2.5" />
                  Search
                </DropdownMenuItem>
                <DropdownMenuItem className="lg:hidden cursor-pointer" onClick={() => navigate('/challenge')}>
                  <Trophy className="h-4 w-4 mr-2.5" />
                  Challenge
                </DropdownMenuItem>
                <DropdownMenuSeparator className='lg:hidden' />
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/user/${username}`)}>
                  <User className="h-4 w-4 mr-2.5" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/games')}>
                  <LayoutDashboard className="h-4 w-4 mr-2.5" />
                  Creator Area
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/favourites')}>
                  <Heart className="h-4 w-4 mr-2.5" />
                  Favourites
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2.5" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2.5" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>


          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">

            <Button
              variant="default"
              size="sm"
              onClick={() => setPinDialogOpen(true)}
              className="flex px-4 py-2 shadow-sm transition-all font-semibold text-xs sm:text-sm"
            >
              <Hash className="h-4 w-4" />
              <span>Enter Code</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="lg:gap-2 py-2 px-2 lg:px-4 !ring-0 !focus:ring-0">
                  <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  <span className="text-gray-600 font-semibold hidden lg:block">My Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/login')}>
                  <LogIn className="h-4 w-4 mr-2.5" />
                  Login
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/register')}>
                  <UserPlus className="h-4 w-4 mr-2.5" />
                  Register
                </DropdownMenuItem>
                <DropdownMenuSeparator className='lg:hidden' />
                <DropdownMenuItem className="lg:hidden cursor-pointer" onClick={() => navigate('/')}>
                  <Home className="h-4 w-4 mr-2.5" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem className="lg:hidden cursor-pointer" onClick={() => navigate('/search')}>
                  <Search className="h-4 w-4 mr-2.5" />
                  Search
                </DropdownMenuItem>
                <DropdownMenuItem className="lg:hidden cursor-pointer" onClick={() => navigate('/challenge')}>
                  <Trophy className="h-4 w-4 mr-2.5" />
                  Challenge
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Enter Game PIN Dialog - Beautiful Redesign */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md mx-auto p-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pt-8 pb-6 text-center">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-bold">Join a Game</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter the game code to join an active game
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* PIN Input Section */}
          <div className="p-6 space-y-6">
            {/* PIN Input Grid */}
            <div
              className="flex justify-center gap-2 "
              onPaste={handlePinPaste}
            >
              {gamePin.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (pinInputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  className={`
                    w-10 h-12 sm:w-12 sm:h-14 text-center sm:text-2xl font-bold rounded-lg sm:rounded-xl
                    border-2 transition-all duration-200
                    bg-muted/50 focus:bg-background
                    ${digit
                      ? 'border-primary text-primary shadow-sm'
                      : 'border-border hover:border-primary/50'}
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                  `}
                />
              ))}
            </div>

            {/* Helper Text */}
            <p className="text-center text-sm text-muted-foreground">
              Ask the game host for the game code
            </p>

            {/* Join Button */}
            <Button
              onClick={handleJoinGame}
              disabled={gamePin.some(d => !d)}
              className="w-full h-12 text-lg font-semibold gap-2 shadow-lg disabled:opacity-50"
            >
              Join Game
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navbar;
