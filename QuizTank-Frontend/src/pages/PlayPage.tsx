
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Lock, Gamepad2, Timer, RotateCcw, Trophy, ArrowLeft, CheckCircle, Star, X, Crown, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { gameRoomService } from '@/services/gameRoomService';
import { gameService } from '@/services/gameService';
import { toast } from 'sonner';
import TankGame from '@/components/game/TankGame';

// Helper to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const PlayPage = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [game, setGame] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [winXP, setWinXP] = useState<number | null>(null);
    const [gameResultStatus, setGameResultStatus] = useState<number>(0);
    const [gameReason, setGameReason] = useState<string>("");
    const [isNewBest, setIsNewBest] = useState(false);
    const [isFirstWin, setIsFirstWin] = useState(false);

    // Access Control
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [accessDenied, setAccessDenied] = useState<{ reason: string, badge: string } | null>(null);

    // Play State
    const [playStatus, setPlayStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [playId, setPlayId] = useState<number | null>(null);
    const [counter, setCounter] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);

    // Mobile detection (matches TankGame)
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024 || 'ontouchstart' in window);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Refs for event listeners
    const playingRef = useRef(false);
    const playIdRef = useRef<number | null>(null);
    const counterRef = useRef(0);
    const isPausedRef = useRef(false);

    useEffect(() => {
        playingRef.current = playStatus === 'playing';
        playIdRef.current = playId;
        counterRef.current = counter;
        isPausedRef.current = isPaused;
    }, [playStatus, playId, counter, isPaused]);

    useEffect(() => {
        const fetchGame = async () => {
            try {
                if (!code) return;
                const data = await gameRoomService.getGame(code);

                // Enforce using game_code
                const actualCode = (data as any).game_code;
                if (actualCode && code !== actualCode) {
                    setAccessDenied({ reason: "", badge: "Game not found" });
                    setLoading(false);
                    return;
                }

                const isCreator = user?.username === (data.creator_name || "");

                // Access Control Logic
                if (data.status === 3) {
                    setAccessDenied({ reason: "", badge: "Game not found" });
                    setLoading(false);
                    return;
                } else if (data.status === 2) { // Private/Draft
                    if (!isCreator) {
                        setAccessDenied({ reason: "", badge: "Game not found" });
                        setLoading(false);
                        return;
                    }
                } else if (data.visibility === 2) { // Private
                    if (!isCreator) {
                        setAccessDenied({ reason: "", badge: "Game not found" });
                        setLoading(false);
                        return;
                    }
                } else if (data.visibility === 3) { // Locked
                    if (!isCreator) {
                        if (data.is_unlocked) {
                            setIsUnlocked(true);
                        } else {
                            setShowPasswordModal(true);
                        }
                    }
                }

                // Handle Randomization based on settings (null = random, 1 = sequential)
                // Use Number() to handle potential string "1" from API
                if (Number(data.questions_order) !== 1 && data.questions?.length > 0) {
                    data.questions = shuffleArray(data.questions);
                }

                if (Number(data.knowledges_order) !== 1 && data.knowledges?.length > 0) {
                    data.knowledges = shuffleArray(data.knowledges);
                }

                setGame(data);
            } catch (error) {
                console.error("Failed to load game", error);
                setAccessDenied({ reason: "", badge: "Game not found" });
            } finally {
                setLoading(false);
            }
        };
        fetchGame();
    }, [code, user]);

    const handleUnlock = async () => {
        if (!game?.id) return;
        if (!passwordInput) {
            toast.error("Please enter password");
            return;
        }
        try {
            const isValid = await gameRoomService.verifyPassword(game.id.toString(), passwordInput);
            if (isValid) {
                setIsUnlocked(true);
                setShowPasswordModal(false);
                toast.success("Unlocked successfully");
            } else {
                toast.error("Incorrect password");
            }
        } catch (e) {
            toast.error("Verification failed");
        }
    };

    const startTimer = () => {
        setCounter(0);
        setIsPaused(false);
        isPausedRef.current = false;
        if ((window as any).timerInterval) clearInterval((window as any).timerInterval);

        // Check game duration
        const durationLimit = game?.duration ? game.duration * 60 : 0;

        (window as any).timerInterval = window.setInterval(() => {
            if (isPausedRef.current) return;
            setCounter(c => {
                const next = c + 1;
                counterRef.current = next; // Sync Ref
                if (durationLimit > 0 && next >= durationLimit) {
                    clearInterval((window as any).timerInterval);
                    handleEndGame(3, 'timeout'); // Time out = Loss
                    return next;
                }
                return next;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if ((window as any).timerInterval) {
            clearInterval((window as any).timerInterval);
            (window as any).timerInterval = null;
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => stopTimer();
    }, []);

    // 1. Browser Refresh / Close Handling (Native Dialog)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (playingRef.current) {
                e.preventDefault();
                e.returnValue = ''; // Shows native browser warning
            }
        };

        const handleUnload = () => {
            if (playingRef.current && playIdRef.current) {
                const token = localStorage.getItem('token');
                const apiBase = import.meta.env.VITE_API_URL;
                const url = `${apiBase}/game-plays/${playIdRef.current}/end`;

                const data = {
                    status: 4, // Canceled
                    completionTime: counterRef.current
                };

                fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data),
                    keepalive: true
                }).catch(err => console.error("Failed to update status on unload", err));
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleUnload);
        };
    }, []);

    // 2. Back Button Handling (Custom Popup)
    useEffect(() => {
        // Push state when playing starts to intercept back button
        if (playStatus === 'playing') {
            window.history.pushState(null, '', window.location.href);
        }

        const handlePopState = (event: PopStateEvent) => {
            if (playingRef.current) {
                // Prevent navigation by pushing state again
                window.history.pushState(null, '', window.location.href);
                // Show our custom warning
                setShowExitDialog(true);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [playStatus]);

    const handleConfirmExit = async () => {
        setShowExitDialog(false);
        stopTimer();

        // Update status to Canceled
        if (playId) {
            try {
                await gameService.endPlay(playId, 4, counter);
            } catch (e) {
                console.error(e);
            }
        }

        // Update state so we don't intercept anymore
        setPlayStatus('finished');

        // Navigate away (Back to game details)
        if (code) {
            navigate(`/game/${code}`);
        } else {
            navigate(-1);
        }
    };

    const handleCancelExit = () => {
        setShowExitDialog(false);
    };

    const handleStartGame = async () => {
        if (!game) return;

        if (user) {
            try {
                const play = await gameService.startPlay(game.id);
                setPlayId(play.id);
                setPlayStatus('playing');
                startTimer();
                //toast.info("Game Started!");
            } catch (error) {
                console.error(error);
                toast.error("Failed to start game session");
            }
        } else {
            // Guest Mode
            setPlayId(null);
            setPlayStatus('playing');
            startTimer();
            //toast.info("Game Started (Guest Mode)");
        }
    };

    const handleEndGame = async (status: number, reason?: string) => { // 2=Win, 3=Lost, 4=Cancel
        stopTimer();
        if (reason) setGameReason(reason);

        if (user && playId) {
            try {
                // Use counterRef to get latest value (avoid closure staleness)
                const finalTime = counterRef.current || counter;
                const result = await gameService.endPlay(playId, status, finalTime);
                setGameResultStatus(status);
                setPlayStatus('finished');

                if (status === 2) {
                    if (result.is_new_best) setIsNewBest(true);
                    else setIsNewBest(false);

                    if (result.is_first_win) setIsFirstWin(true);
                    else setIsFirstWin(false);

                    if (result.xp_awarded) {
                        setWinXP(result.xp_awarded);
                        //toast.success(`You Won! +${result.xp_awarded} XP`);
                    } else {
                        setWinXP(null);
                        //toast.success("You Won!");
                    }
                }
                else if (status === 3) {
                    setWinXP(null);
                    //toast.error("You Lost!");
                }
                else {
                    setWinXP(null);
                    //toast.info("Game Canceled");
                }

            } catch (error) {
                console.error(error);
                toast.error("Failed to update game status");
            }
        } else {
            // Guest Logic
            setGameResultStatus(status);
            setPlayStatus('finished');
            //if (status === 2) toast.success("You Won!");
            //else if (status === 3) toast.error("You Lost!");
            //else toast.info("Game Canceled");
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="p-10 text-center">Loading game...</div>;

    if (accessDenied) {
        return (
            <div className="h-[80vh] flex items-center justify-center bg-white">
                <div className="text-center p-8 max-w-md">
                    <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{accessDenied.badge}</h1>
                    <p className="text-gray-500 mb-6">{accessDenied.reason}</p>
                    <Button onClick={() => navigate("/")}>Go Home</Button>
                </div>
            </div>
        );
    }

    if (showPasswordModal && !isUnlocked) {
        return (
            <div className="h-[80vh] flex items-center justify-center bg-white">
                <div className="text-center p-8 max-w-sm w-full">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Locked</h1>
                    <p className="text-gray-500 mb-6">This game room is protected.</p>

                    <div className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="text-center"
                        />
                        <Button onClick={handleUnlock} variant="default" className="w-full">Unlock</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!game) return <div className="p-10 text-center">Game not found</div>;

    if (playStatus !== 'finished' && game) {
        const timeLeft = game.duration ? (game.duration * 60) - counter : 0;
        return (
            <div className="fixed inset-0 z-50 bg-zinc-900 overflow-hidden select-none">
                {/* Exit Button - Only show when playing */}

                {/* Exit Button - Only show when playing (desktop only) */}
                {playStatus === 'playing' && !isMobile && (
                    <button
                        onClick={() => setShowExitDialog(true)}
                        className="absolute top-8 left-8 z-50 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-semibold transition-colors hidden lg:flex items-center gap-2 border-2 border-gray-200"
                    >
                        <ChevronLeft className="text-gray-500 !w-5 !h-5" />
                        Exit Game
                    </button>
                )}

                <TankGame
                    gameData={game}
                    onGameOver={handleEndGame}
                    onStartGame={handleStartGame}
                    onExit={() => setShowExitDialog(true)}
                    isPlaying={playStatus === 'playing'}
                    onPauseToggle={setIsPaused}
                    timerDisplay={formatTime(counter)}
                    limitDisplay={game.duration > 0 ? formatTime(timeLeft) : undefined}
                />

                <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Exit Game?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to quit? Your progress will be lost.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmExit} className="bg-red-500 hover:bg-red-600">
                                Exit Game
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    const getLoseReasonText = () => {
        switch (gameReason) {
            case 'no_heart': return "You ran out of lives!";
            case 'no_brain': return "Too many wrong answers!";
            case 'out_of_ammo': return "You ran out of ammo!";
            case 'timeout': return "Time's up!";
            default: return "Mission Failed";
        }
    };

    // --- WIN / GAME OVER MODAL ---
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in duration-300">
                {/* Header Decoration */}
                <div className={`h-3 w-full ${gameResultStatus === 2 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}></div>

                <div className="p-8 text-center overflow-y-auto max-h-[80vh]">
                    {/* Status Icon */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 
                        ${gameResultStatus === 2 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {gameResultStatus === 2 ? <CheckCircle className="w-10 h-10" /> : <X className="w-10 h-10" />}
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {gameResultStatus === 2 ? 'Victory' : 'Game Over'}
                    </h2>
                    <p className={`text-gray-500 ${(isNewBest || isFirstWin) ? 'mb-7' : 'mb-8'}`}>
                        {gameResultStatus === 2 ? 'Great job completing the mission' : getLoseReasonText()}
                    </p>

                    {(isNewBest || isFirstWin) && (
                        <div className="flex justify-center mb-6 animate-bounce">
                            {isFirstWin ? (
                                <div className="inline-flex items-center gap-1.5 bg-amber-100 ring-2 ring-amber-500 ring-offset-2 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                    <Trophy className="w-4 h-4" />
                                    FIRST WIN
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 bg-blue-100 ring-2 ring-blue-500 ring-offset-2 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                    <Star className="w-4 h-4" />
                                    NEW RECORD
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold mb-2">
                                <Timer className="w-4 h-4" />
                                Duration
                            </div>
                            <div className="text-2xl font-bold text-gray-900 font-mono">
                                {formatTime(counter)}
                            </div>
                        </div>

                        {gameResultStatus === 2 && winXP && winXP > 0 ? (
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold mb-2">
                                    <Crown className="w-4 h-4" />
                                    XP Gained
                                </div>
                                <div className="text-2xl font-bold text-amber-600 font-mono">
                                    +{winXP}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold mb-2">
                                    <Crown className="w-4 h-4" />
                                    XP Gained
                                </div>
                                <div className="text-lg font-medium text-gray-400">
                                    -
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <Button
                            onClick={handleStartGame}
                            className="w-full h-12 font-bold rounded-xl transition-all"
                            size="lg"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Play Again
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate(`/game/${code}?tab=leaderboard`)}
                            className="w-full h-12 font-bold rounded-xl border bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 transition-all"
                        >
                            <Trophy className="w-5 h-5" />
                            View Leaderboard
                        </Button>

                        <button
                            onClick={() => navigate(`/game/${code}`)}
                            className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors pt-2 flex items-center justify-center gap-1 mx-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Game Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayPage;
