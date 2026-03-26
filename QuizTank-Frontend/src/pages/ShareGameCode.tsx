import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Trophy, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { gameRoomService } from '@/services/gameRoomService';
import { Button } from '@/components/ui/button';

const ShareGameCode = () => {
    const navigate = useNavigate();
    const { code } = useParams();
    const [searchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gameData, setGameData] = useState<{ name: string; gameCode: string } | null>(null);
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);

        const validateGame = async () => {
            if (!code) {
                setError("No game code provided.");
                setIsLoading(false);
                return;
            }

            try {
                const data = await gameRoomService.getGame(code);

                // Enforce using game_code in URL check
                const actualCode = (data as any).game_code;
                if (actualCode && code !== actualCode) {
                    setError("Invalid game code.");
                    setIsLoading(false);
                    return;
                }

                // Check status = 1 (Published)
                if (data.status !== 1) {
                    setError("This game is not available for sharing.");
                    setIsLoading(false);
                    return;
                }

                // Check visibility = 1, 3, 4 (Public, Locked, Unlisted)
                const allowedVisibility = [1, 3, 4];
                if (!allowedVisibility.includes(data.visibility || 1)) {
                    setError("This game's visibility settings prevent sharing.");
                    setIsLoading(false);
                    return;
                }

                setGameData({
                    name: data.name || "Untitled Game",
                    gameCode: actualCode || code
                });
            } catch (err) {
                console.error("Error validating game:", err);
                setError("Game not found or could not be loaded.");
            } finally {
                setIsLoading(false);
            }
        };

        validateGame();
    }, [code]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#0F172A] flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-white font-medium">Validating game code...</p>
            </div>
        );
    }

    if (error || !gameData) {
        return (
            <div className="fixed inset-0 bg-[#0F172A] flex flex-col items-center justify-center font-sans px-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-12 max-w-md w-full flex flex-col items-center text-center gap-6">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
                        <AlertCircle className="text-destructive w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white">Oops!</h2>
                        <p className="text-slate-400 font-medium">{error || "Something went wrong."}</p>
                    </div>
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full h-14 rounded-2xl text-lg font-bold"
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    const { name: gameName, gameCode } = gameData;
    const fullUrl = `${origin}/game/${gameCode}`;

    return (
        <div className="min-h-screen w-full bg-[#0F172A] flex flex-col items-center justify-start lg:justify-center overflow-x-hidden font-sans py-12 px-4 md:px-8 relative">
            {/* Background decorations - Animated blobs for Kahoot feel */}
            <div className="fixed top-[-10%] left-[-10%] w-[70%] h-[70%] bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-accent/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 flex flex-col items-center gap-8 md:gap-12 max-w-6xl w-full">
                {/* Header/Logo */}
                <div className="flex flex-col items-center gap-3 animate-fade-in w-full">
                    <div className="flex flex-col items-center gap-2 min-w-0">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none truncate">
                            QUIZ<span className="text-primary">TANK</span>
                        </h1>
                        <p className="text-slate-400 font-bold tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs uppercase mt-1">{import.meta.env.VITE_FRONTEND_URL}</p>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] md:rounded-[48px] p-8 md:p-12 lg:p-16 flex flex-col items-center gap-10 md:gap-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-slide-in-right overflow-hidden">
                    <div className="flex flex-col items-center gap-3 w-full text-center">
                        <span className="text-primary text-[10px] md:text-sm lg:text-base font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Join the Game</span>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight break-words break-all line-clamp-1 max-w-4xl px-2">
                            {gameName}
                        </h2>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 xl:gap-24 w-full">
                        {/* QR Code Section */}
                        <div className="flex flex-col items-center gap-6 group shrink-0 w-full lg:w-auto">
                            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-glow transform group-hover:scale-105 transition-all duration-500 overflow-hidden">
                                <QRCodeCanvas
                                    value={fullUrl}
                                    size={Math.min(240, window.innerWidth - 100)}
                                    level="H"
                                    includeMargin={false}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        maxWidth: '240px'
                                    }}
                                    imageSettings={{
                                        src: "/favicon.ico",
                                        x: undefined,
                                        y: undefined,
                                        height: 48,
                                        width: 48,
                                        excavate: true,
                                    }}
                                />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-white font-bold text-lg md:text-xl">Scan QR Code</p>
                                <p className="text-slate-400 text-xs md:text-sm font-medium">to join instantly</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="lg:hidden w-24 h-1 bg-white/10 rounded-full shrink-0" />
                        <div className="hidden lg:block w-1 h-32 bg-white/10 rounded-full shrink-0" />

                        {/* Game Code Section */}
                        <div className="flex flex-col items-center gap-6 group w-full lg:w-auto overflow-hidden">
                            <div className="flex flex-col items-center w-full max-w-md">
                                <div className="bg-white/10 w-full px-8 md:px-12 py-6 md:py-8 rounded-[32px] md:rounded-[40px] border-2 border-primary/50 group-hover:border-primary/70 transition-colors shadow-2xl relative overflow-hidden flex items-center justify-center">
                                    {/* Subtle inner glow */}
                                    <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none" />
                                    <span className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-[0.1em] md:tracking-[0.15em] relative z-10 font-mono break-all text-center">
                                        {gameCode}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-center">
                                <p className="text-white font-bold text-lg md:text-xl">Game Code</p>
                                <p className="text-slate-400 text-xs md:text-sm font-medium">Enter at {import.meta.env.VITE_FRONTEND_URL}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer info */}
                <div className="flex flex-col items-center gap-4 animate-fade-in mt-4" style={{ animationDelay: '0.6s' }}>
                    <p className="text-slate-400 font-medium text-base md:text-lg uppercase tracking-widest">Waiting for players...</p>
                    <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareGameCode;
