import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Gamepad2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { gameService } from '@/services/gameService';
import heroBg from '@/assets/hero-tank.jpg';

const HeroSection = () => {
  const [gamePin, setGamePin] = useState(['', '', '', '', '', '']);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const navigate = useNavigate();

  const handleJoinGame = async () => {
    const pin = gamePin.join('');
    if (pin.length < 4) {
      toast.error('Please enter a valid game PIN');
      return;
    }

    try {
      const result = await gameService.checkGamePin(pin);
      if (result.valid) {
        toast.success(`Joining game with code: ${pin}`);
        setGamePin(['', '', '', '', '', '']);
        navigate(`/game/${pin}`);
      } else {
        toast.error(result.message || 'Invalid Game Code');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error checking game code');
    }
  };

  return (
    <section className="relative w-full overflow-hidden mb-2">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="QuizTank Hero"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background via-60% md:via-90% to-background z-10" />
      </div>

      <div className="container relative z-20 h-full flex items-center px-6 py-10 lg:px-8 lg:py-20">
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom duration-700">
          <div className="mb-6">
            {/*
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Battle of Knowledge</span>
            </div>
            */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight !leading-[1.3]">
              The Smartest Way to <br />
              <span className="text-primary">Play & Learn</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium max-w-lg !leading-relaxed mt-4">
              Join thousands of players in real-time quiz battles.
              Simple, fast, and addictive learning for everyone.
            </p>
          </div>

          {/* Simplified PIN Box */}
          <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
            <Gamepad2 className="w-5 h-5 mb-0.5" />
            Enter Game Code
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 max-w-md mb-6">
            <div className="flex gap-2">
              {gamePin.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (pinInputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  onPaste={index === 0 ? handlePinPaste : undefined}
                  placeholder=""
                  className={`
                        w-10 h-12 sm:w-12 sm:h-14 text-center sm:text-2xl font-bold rounded-lg sm:rounded-xl
                        border-2 transition-all duration-200
                        bg-background/80 backdrop-blur-sm focus:bg-background
                        ${digit
                      ? 'border-primary text-primary shadow-sm'
                      : 'border-border hover:border-primary/50 text-muted-foreground'}
                        focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                      `}
                />
              ))}
            </div>
            <Button
              size="lg"
              onClick={handleJoinGame}
              className="h-12 px-8 rounded-xl font-bold transition-all shadow-md max-w-fit"
            >
              Join Game
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              {[6, 13, 66].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-300 bg-gray-50 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="User" />
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              Over <span className="text-foreground">5,000</span> battles fought this week
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
