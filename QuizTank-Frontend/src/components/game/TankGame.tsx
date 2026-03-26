import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Howl } from 'howler';
import { Heart, Brain, Crosshair, Angry, CircleQuestionMark, Lightbulb, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Timer, Gamepad2, Play, Settings, Volume2, VolumeX, Music } from 'lucide-react';
import { toast } from 'sonner';
import { userService } from '@/services/userService';
import './TankGame.css';

interface TankGameProps {
    gameData: any;
    onGameOver: (status: number, reason?: string) => void;
    onStartGame: () => void;
    onExit?: () => void;

    isPlaying: boolean;
    onPauseToggle?: (isPaused: boolean) => void;
    timerDisplay?: string;
    limitDisplay?: string;
}

export default function TankGame({ gameData, onGameOver, onStartGame, onExit, isPlaying, onPauseToggle, timerDisplay, limitDisplay }: TankGameProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const livesRef = useRef<HTMLSpanElement>(null);
    const bulletsRef = useRef<HTMLSpanElement>(null);
    const enemiesLeftRef = useRef<HTMLSpanElement>(null); // Remaining Enemies
    const scoreRef = useRef<HTMLSpanElement>(null);
    const levelRef = useRef<HTMLSpanElement>(null);
    const healthBarRef = useRef<HTMLDivElement>(null);
    const wrongCountRef = useRef<HTMLSpanElement>(null);
    const [modalConfig, setModalConfig] = React.useState<any>(null);
    const [audioSettings, setAudioSettings] = React.useState({
        master: true,
        music: 0.5, // 50%
        sfx: 0.7    // 70%
    });
    const audioSettingsRef = useRef(audioSettings);
    const updateMusicVolRef = useRef<(() => void) | null>(null);

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false);
    const isMobileRef = useRef(false);
    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 1024 || 'ontouchstart' in window;
            setIsMobile(mobile);
            isMobileRef.current = mobile;
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Toggle body class for sonner toast positioning
    useEffect(() => {
        if (isMobile) {
            document.body.classList.add('is-mobile-game');
        } else {
            document.body.classList.remove('is-mobile-game');
        }
        return () => document.body.classList.remove('is-mobile-game');
    }, [isMobile]);

    // Refs for touch controls to interact with game loop
    const activeKeysRef = useRef<Set<string>>(new Set());
    const joystickRef = useRef({ x: 0, y: 0 });
    const shootRef = useRef<(() => void) | null>(null);
    const previousModalRef = useRef<any>(null);
    const gameEndTimeoutRef = useRef<any>(null);

    // Clear touch keys when modal opens (buttons unmount mid-press)
    useEffect(() => {
        if (modalConfig) {
            activeKeysRef.current.clear();
            joystickRef.current = { x: 0, y: 0 };
        }
        if (onPauseToggle) {
            // Only pause the external timer for settings, continue for questions/knowledge
            const shouldPauseTimer = modalConfig?.type === 'settings';
            onPauseToggle(shouldPauseTimer);
        }
    }, [modalConfig, onPauseToggle]);

    useEffect(() => {
        audioSettingsRef.current = audioSettings;
        if (updateMusicVolRef.current) updateMusicVolRef.current();
    }, [audioSettings]);

    // Fetch user settings if available
    useEffect(() => {
        const fetchUserSettings = async () => {
            try {
                // We don't have user object here easily, but userService.getProfile(undefined) 
                // might not work if it requires username. 
                // Let's assume we can get it from localStorage or something, 
                // but actually AuthService should provide it.
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const u = JSON.parse(storedUser);
                    const data = await userService.getProfile(u.username);
                    if (data?.user) {
                        setAudioSettings({
                            master: data.user.game_audio === undefined ? true : data.user.game_audio === 1,
                            music: data.user.game_music === undefined ? 0.5 : parseFloat(data.user.game_music),
                            sfx: data.user.game_sfx === undefined ? 0.7 : parseFloat(data.user.game_sfx)
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch audio settings", e);
            }
        };
        fetchUserSettings();
    }, []);

    // Constants
    const TILE = 48; const W = 22; const H = 22;
    const MAIN = '#48ACFF'; const MAIN_DARK = '#2b9ae6';
    const MAX_ENEMIES_ON_FIELD = 4;
    const BG_GRAD_A = '#f0f9ff';
    const BG_GRAD_B = '#e0f2fe';
    const TILE_STROKE = 'rgba(148, 163, 184, 0.2)';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- GAME CONFIG FROM PROPS ---
        const TOTAL_ENEMIES = gameData.enemies || 1;
        const MAX_LIVES = gameData.hearts || 1;
        const MAX_WRONG = gameData.brains || 1;
        const INITIAL_AMMO = gameData.initial_ammo || 0;
        const AMMO_PER_CORRECT = gameData.ammo_per_correct || 1;

        // Parse Questions & Knowledges
        const questionDB = (gameData.questions || []).map((q: any) => {
            let type = q.type;
            if (type === 2 || type === '2') type = 'multi';
            else if (type === 1 || type === '1') type = 'single';
            else if (type === 3 || type === '3') type = 'fill';
            else if (!type) type = (q.choices && q.choices.filter((c: any) => c.correct).length > 1 ? 'multi' : 'single');

            let answers = q.choices ? q.choices.filter((c: any) => c.correct).map((c: any) => c.content) : [];
            if (answers.length === 0) {
                if (Array.isArray(q.answers)) answers = q.answers;
                else if (q.answer) answers = [q.answer];
                else if (q.correct_answer) answers = [q.correct_answer];
                else if (q.correctAnswer) answers = [q.correctAnswer];
            }

            return {
                ...q,
                options: q.choices ? q.choices.map((c: any) => c.content) : [],
                answer: answers,
                media: q.media || [],
                type
            };
        });
        const knowledgeDB = (gameData.knowledges || []);

        // --- AUDIO SYSTEM ---
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();

        function beep(freq = 440, dur = 0.08, type: any = 'square', vol = 0.15) {
            if (!audioSettingsRef.current.master || audioSettingsRef.current.sfx <= 0) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.type = type; o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
            const now = audioCtx.currentTime;
            const finalVol = vol * audioSettingsRef.current.sfx;
            g.gain.setValueAtTime(finalVol, now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
            o.start(now); o.stop(now + dur);
        }

        function noise(dur = 0.08, vol = 0.1) {
            if (!audioSettingsRef.current.master || audioSettingsRef.current.sfx <= 0) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const bufferSize = audioCtx.sampleRate * dur;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
            const src = audioCtx.createBufferSource();
            src.buffer = buffer;
            const g = audioCtx.createGain();
            const finalVol = vol * audioSettingsRef.current.sfx;
            g.gain.setValueAtTime(finalVol, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
            src.connect(g); g.connect(audioCtx.destination);
            src.start(); src.stop(audioCtx.currentTime + dur);
        }

        const shootSound = new Howl({
            src: ['/sounds/shoot.mp3'],
            volume: audioSettingsRef.current.sfx
        });

        const enemyDieSound = new Howl({
            src: ['/sounds/enemy.mp3'],
            volume: audioSettingsRef.current.sfx
        });

        const sfx = {
            shoot: () => {
                if (!audioSettingsRef.current.master || audioSettingsRef.current.sfx <= 0) return;
                shootSound.volume(audioSettingsRef.current.sfx * 0.3);
                shootSound.play();
            },

            brickDestroy: () => {
                noise(0.15, 0.15);
                beep(180, 0.10, 'triangle', 0.12);
                setTimeout(() => beep(120, 0.08, 'triangle', 0.10), 35);
                setTimeout(() => beep(80, 0.12, 'triangle', 0.08), 70);
                setTimeout(() => noise(0.08, 0.06), 45);
            },

            steelHit: () => {
                beep(2200, 0.04, 'sine', 0.20);
                setTimeout(() => beep(2800, 0.03, 'sine', 0.14), 15);
                setTimeout(() => beep(1600, 0.05, 'sine', 0.10), 35);
                setTimeout(() => beep(1200, 0.04, 'sine', 0.06), 55);
                noise(0.02, 0.08);
            },

            questionBoxOpen: () => {
                beep(523, 0.08, 'sine', 0.16);
                setTimeout(() => beep(659, 0.08, 'sine', 0.16), 75);
                setTimeout(() => beep(784, 0.08, 'sine', 0.18), 150);
                setTimeout(() => beep(1047, 0.12, 'sine', 0.20), 225);
            },

            knowledgeBoxOpen: () => {
                beep(392, 0.10, 'sine', 0.15);
                setTimeout(() => beep(494, 0.10, 'sine', 0.15), 90);
                setTimeout(() => beep(587, 0.10, 'sine', 0.17), 180);
                setTimeout(() => beep(784, 0.14, 'sine', 0.19), 270);
            },

            enemyDie: () => {
                if (!audioSettingsRef.current.master || audioSettingsRef.current.sfx <= 0) return;
                enemyDieSound.volume(audioSettingsRef.current.sfx * 0.15);
                enemyDieSound.play();
            },

            playerHit: () => {
                beep(300, 0.05, 'sawtooth', 0.24);
                setTimeout(() => beep(240, 0.07, 'sawtooth', 0.22), 45);
                setTimeout(() => beep(180, 0.09, 'sawtooth', 0.18), 95);
                setTimeout(() => beep(120, 0.12, 'sawtooth', 0.14), 150);
                setTimeout(() => noise(0.10, 0.10), 80);
            },

            correct: () => {
                beep(880, 0.06, 'sine', 0.16);
                setTimeout(() => beep(1108, 0.06, 'sine', 0.16), 55);
                setTimeout(() => beep(1318, 0.10, 'sine', 0.18), 110);
            },

            wrong: () => {
                beep(246, 0.08, 'sawtooth', 0.15);
                setTimeout(() => beep(185, 0.10, 'sawtooth', 0.14), 70);
                setTimeout(() => beep(123, 0.12, 'sawtooth', 0.12), 140);
            },

            explosion: () => {
                noise(0.15, 0.12);
                beep(150, 0.06, 'square', 0.20);
                setTimeout(() => beep(100, 0.10, 'triangle', 0.16), 40);
                setTimeout(() => noise(0.12, 0.08), 60);
                setTimeout(() => beep(60, 0.12, 'triangle', 0.10), 100);
            },
            noAmmo: () => {
                beep(120, 0.05, 'square', 0.15);
                setTimeout(() => beep(80, 0.05, 'square', 0.10), 30);
            },
        };

        // --- BACKGROUND MUSIC ---
        let bgMusicGain: GainNode | null = null;
        let bgMusicInterval: ReturnType<typeof setInterval> | null = null;
        let bgMusicStarted = false;

        function startBgMusic() {
            if (bgMusicStarted) return;
            bgMusicStarted = true;
            if (audioCtx.state === 'suspended') audioCtx.resume();

            bgMusicGain = audioCtx.createGain();
            bgMusicGain.connect(audioCtx.destination);
            updateBgMusicVolume();

            // Melody notes (frequencies) in a loop pattern
            const melody = [
                262, 294, 330, 262,   // C D E C
                330, 349, 392, 0,     // E F G rest
                392, 440, 392, 349,   // G A G F
                330, 262, 294, 0,     // E C D rest
                262, 196, 220, 262,   // C G3 A3 C
                294, 262, 220, 196,   // D C A3 G3
                262, 330, 294, 262,   // C E D C
                196, 220, 262, 0,     // G3 A3 C rest
            ];
            let noteIdx = 0;

            function playNote() {
                if (!bgMusicGain || !audioSettingsRef.current.master) return;
                const freq = melody[noteIdx % melody.length];
                noteIdx++;
                if (freq === 0) return; // rest

                const now = audioCtx.currentTime;
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'sine';
                o.frequency.setValueAtTime(freq, now);
                o.connect(g);
                g.connect(bgMusicGain!);
                g.gain.setValueAtTime(0.08, now);
                g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
                o.start(now);
                o.stop(now + 0.30);

                // Add subtle harmony
                const o2 = audioCtx.createOscillator();
                const g2 = audioCtx.createGain();
                o2.type = 'triangle';
                o2.frequency.setValueAtTime(freq * 0.5, now); // octave below
                o2.connect(g2);
                g2.connect(bgMusicGain!);
                g2.gain.setValueAtTime(0.04, now);
                g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
                o2.start(now);
                o2.stop(now + 0.30);
            }

            bgMusicInterval = setInterval(playNote, 300);
        }

        function stopBgMusic() {
            if (bgMusicInterval) { clearInterval(bgMusicInterval); bgMusicInterval = null; }
            bgMusicStarted = false;
        }

        function updateBgMusicVolume() {
            if (bgMusicGain) {
                const vol = audioSettingsRef.current.master ? audioSettingsRef.current.music : 0;
                bgMusicGain.gain.setValueAtTime(vol, audioCtx.currentTime);
            }
        }
        updateMusicVolRef.current = updateBgMusicVolume;

        // --- STATE ---
        let player: any, enemies: any[] = [], bullets: any[] = [];
        let keys: any = {};
        let score = 0, lives = MAX_LIVES, enemiesKilled = 0;
        let gameEnded = false;
        let playerBullets = INITIAL_AMMO;
        let wrongAttempts = 0;
        let questionBoxesCount = 0;
        let questionsSpawnedTotal = 0;
        let usedBoxPositions = new Set<string>(); // Tracks all historically used coordinates "x,y"
        let particles: any[] = [];
        let level: number[] = [];
        let showingModal = false; // To prevent multiple start screens
        let lastBoxTriggerTime = 0;
        let lastBoxX = -1, lastBoxY = -1;

        // Orders
        let questionAssignments: any = {};
        let knowledgeAssignments: any = {};
        let incorrectAttempts: Record<string, any[]> = {};
        let nextQuestionIdx = 0;
        let nextKnowledgeIdx = 0;
        let questionOrder = Array.from({ length: questionDB.length }, (_, i) => i);
        let knowledgeOrder = Array.from({ length: knowledgeDB.length }, (_, i) => i);



        // --- GAME LOGIC ---
        const EMPTY = 0, BRICK = 1, STEEL = 2, WATER = 3, TREE = 4, QUESTION_BOX = 7, KNOWLEDGE_BOX = 8, SPAWN = 9;
        const idx = (x: number, y: number) => y * W + x;
        const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

        const createBrickTexture = () => {
            const c = document.createElement('canvas');
            c.width = TILE; c.height = TILE;
            const cx = c.getContext('2d');
            if (!cx) return c;

            // Base mortar
            cx.fillStyle = '#b7b7b7'; // Light gray mortar
            cx.fillRect(0, 0, TILE, TILE);

            // Brick properties
            const rows = 2;
            const brickH = TILE / rows;

            for (let r = 0; r < rows; r++) {
                const cols = 1;
                const brickW = TILE / cols;
                const offset = (r % 2) * (brickW / 2); // Stagger

                for (let c = -1; c < cols + 1; c++) {
                    const bx = c * brickW + offset;
                    const by = r * brickH;

                    // Gap for mortar
                    const gap = 2;

                    // Brick Gradient
                    const grad = cx.createLinearGradient(bx, by, bx, by + brickH);
                    grad.addColorStop(0, '#e17055'); // Lighter terra cotta
                    grad.addColorStop(1, '#c0392b'); // Darker red

                    cx.fillStyle = grad;
                    cx.fillRect(bx + 1, by + 1, brickW - gap, brickH - gap);

                    // Add Texture Noise
                    cx.globalAlpha = 0.1;
                    cx.fillStyle = '#000';
                    if (Math.random() > 0.5) cx.fillRect(bx + 5, by + 5, 4, 4);
                    if (Math.random() > 0.5) cx.fillRect(bx + brickW - 8, by + brickH - 8, 4, 4);
                    cx.globalAlpha = 1.0;

                    // Highlight top edge
                    cx.fillStyle = 'rgba(255,255,255,0.2)';
                    cx.fillRect(bx + 1, by + 1, brickW - gap, 2);
                }
            }
            return c;
        };

        const createSteelTexture = () => {
            const c = document.createElement('canvas');
            c.width = TILE; c.height = TILE;
            const cx = c.getContext('2d');
            if (!cx) return c;

            // Base Metal
            const grad = cx.createLinearGradient(0, 0, TILE, TILE);
            grad.addColorStop(0, '#bdc3c7');
            grad.addColorStop(1, '#7f8c8d');
            cx.fillStyle = grad;
            cx.fillRect(0, 0, TILE, TILE);

            // Inner Plate
            cx.fillStyle = '#ecf0f1';
            cx.fillRect(4, 4, TILE - 8, TILE - 8);

            const innerGrad = cx.createLinearGradient(4, 4, TILE - 4, TILE - 4);
            innerGrad.addColorStop(0, '#95a5a6');
            innerGrad.addColorStop(1, '#bdc3c7');
            cx.fillStyle = innerGrad;
            cx.fillRect(6, 6, TILE - 12, TILE - 12);

            // Rivets
            cx.fillStyle = '#2c3e50';
            const rivets = [[8, 8], [TILE - 12, 8], [8, TILE - 12], [TILE - 12, TILE - 12]];
            rivets.forEach(([rx, ry]) => {
                cx.beginPath();
                cx.arc(rx + 2, ry + 2, 2, 0, Math.PI * 2);
                cx.fill();
            });

            // Shine
            /*
            cx.strokeStyle = 'rgba(255,255,255,0.4)';
            cx.lineWidth = 2;
            cx.beginPath();
            cx.moveTo(TILE, 0);
            cx.lineTo(0, TILE);
            cx.stroke();
            */

            return c;
        };

        const createTreeTexture = () => {
            const c = document.createElement('canvas');
            c.width = TILE;
            c.height = TILE;
            const cx = c.getContext('2d');
            if (!cx) return c;

            // Fixed leaf data for consistent, seamless tiling
            const leaves = [
                { colorIndex: 0, radius: 7.2, x: 6, y: 8 },
                { colorIndex: 1, radius: 9.5, x: 24, y: 6 },
                { colorIndex: 2, radius: 6.8, x: 42, y: 10 },
                { colorIndex: 1, radius: 8.3, x: 38, y: 28 },
                { colorIndex: 0, radius: 7.5, x: 12, y: 38 },
                { colorIndex: 2, radius: 10.2, x: 28, y: 24 },
                { colorIndex: 0, radius: 6.5, x: 18, y: 18 },
                { colorIndex: 1, radius: 7.8, x: 36, y: 42 },
                { colorIndex: 2, radius: 8.6, x: 8, y: 24 },
                { colorIndex: 0, radius: 9.1, x: 32, y: 14 },
                { colorIndex: 1, radius: 7.3, x: 14, y: 32 },
                { colorIndex: 2, radius: 8.9, x: 42, y: 38 },
                { colorIndex: 0, radius: 6.9, x: 24, y: 42 },
                { colorIndex: 1, radius: 10.5, x: 4, y: 42 },
                { colorIndex: 2, radius: 7.6, x: 40, y: 20 },
                // Edge-wrapping leaves for seamless tiling
                { colorIndex: 0, radius: 8.4, x: 2, y: 2 },
                { colorIndex: 1, radius: 7.1, x: 46, y: 4 },
                { colorIndex: 2, radius: 8.2, x: 4, y: 46 },
                { colorIndex: 0, radius: 7.7, x: 44, y: 44 },
                { colorIndex: 1, radius: 9.3, x: 24, y: 2 }
            ];

            const colors = ['#2ecc71', '#27ae60', '#16a085'];

            // Draw all leaves
            leaves.forEach(leaf => {
                cx.fillStyle = colors[leaf.colorIndex];
                cx.beginPath();
                cx.arc(leaf.x, leaf.y, leaf.radius, 0, Math.PI * 2);
                cx.fill();
            });

            return c;
        };

        const brickImg = createBrickTexture();
        const steelImg = createSteelTexture();
        const treeImg = createTreeTexture();

        // Use map data from game settings if available, otherwise use default static map
        let mapSource = gameData.map_data;
        if (typeof mapSource === 'string') {
            try { mapSource = JSON.parse(mapSource); } catch (e) { console.error("Map parse error", e); }
        }

        if (Array.isArray(mapSource) && mapSource.length !== W * H) {
            console.warn("Map length mismatch!", mapSource.length, "Expected:", W * H);
        }

        const STATIC_MAP = (Array.isArray(mapSource) && mapSource.length > 0)
            ? [...mapSource]
            : [
                2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
                2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2
            ];

        let spawnX = (W / 2) * TILE;
        let spawnY = (H - 2) * TILE;

        function generateMap() {
            const map = [...STATIC_MAP];
            let spawnFound = false;

            // Search for SPAWN point
            for (let i = 0; i < W * H; i++) {
                if (map[i] === SPAWN) {
                    const x = i % W;
                    const y = Math.floor(i / W);
                    spawnX = x * TILE;
                    spawnY = y * TILE;
                    map[i] = EMPTY; // Clear logic
                    spawnFound = true;
                    // Keep one spawn only? If multiple, last one wins or breaks. 
                    // Let's break to respect "1 spawn position" roughly.
                    // But if we want to clean up ALL spawn tiles (invalid map), we should continue.
                    // For now, let's just pick the first one and treat others as empty?
                    // Actually effectively clearing them all is better.
                }
            }

            // If found, we might have multiple. Let's make sure we only use one and clear all.
            // Re-scan to be safe if we want to ensure only one spawn is active? 
            // Better: Scan, if match SPAWN, set spawn coords. Map[i] become EMPTY. 
            // If multiple spawns exist, the LAST one will determine spawnX/Y. All will be cleared.

            if (!spawnFound) {
                // Clear spawn area using array indices directly or logic
                const cx = Math.floor(W / 2);
                // Ensure bottom center is empty for player spawn
                const idx = (x: number, y: number) => y * W + x;
                map[idx(cx, H - 2)] = EMPTY; map[idx(cx - 1, H - 2)] = EMPTY;
                spawnX = (W / 2) * TILE; // Center X (approx)
                // Note: W/2 = 11. 11*48.
                // Correct logic for default spawn:
                // Tank is 32x32. Tile is 48x48. Center tank in tile?
                // Current logic: new Tank((W / 2) * TILE, ...).
                spawnX = (W / 2) * TILE;
                spawnY = (H - 2) * TILE;
            }

            placeAllBoxes(map);
            return map;
        }

        function trySpawnQuestionBox(targetMap: number[], ignoreSpawnBuffer = false) {
            if (questionBoxesCount >= 10 || questionsSpawnedTotal >= questionDB.length) return false;

            const placedLocations: { x: number, y: number }[] = [];
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const t = targetMap[idx(x, y)];
                    if (t === QUESTION_BOX || t === KNOWLEDGE_BOX) placedLocations.push({ x, y });
                }
            }

            // Try with distance 3 first, then fallback to distance 2 if it fails
            for (let minDist = 3; minDist >= 2; minDist--) {
                let attempts = 0;
                while (attempts++ < 100) {
                    const x = 1 + Math.floor(Math.random() * (W - 2));
                    const y = 1 + Math.floor(Math.random() * (H - 4));
                    const posKey = `${x},${y}`;

                    let tooCloseToPlayerOrBoxes = false;
                    // Check other boxes
                    for (const p of placedLocations) {
                        if (Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) < minDist) {
                            tooCloseToPlayerOrBoxes = true; break;
                        }
                    }
                    if (tooCloseToPlayerOrBoxes) continue;

                    // Check player
                    if (player) {
                        const px = Math.floor(player.x / TILE);
                        const py = Math.floor(player.y / TILE);
                        if (Math.max(Math.abs(x - px), Math.abs(y - py)) < minDist) tooCloseToPlayerOrBoxes = true;
                    }
                    if (tooCloseToPlayerOrBoxes) continue;

                    // Check distance from spawn point (at least 4 spaces) only if not ignored
                    const sx = Math.floor(spawnX / TILE);
                    const sy = Math.floor(spawnY / TILE);
                    const isTooCloseToSpawn = !ignoreSpawnBuffer && Math.max(Math.abs(x - sx), Math.abs(y - sy)) < 4;

                    if (targetMap[idx(x, y)] === EMPTY && !isTooCloseToSpawn && !usedBoxPositions.has(posKey)) {
                        targetMap[idx(x, y)] = QUESTION_BOX;
                        usedBoxPositions.add(posKey);
                        questionBoxesCount++;
                        questionsSpawnedTotal++;
                        return true;
                    }
                }
            }
            return false;
        }

        function placeAllBoxes(map: number[]) {
            questionBoxesCount = 0;
            questionsSpawnedTotal = 0;
            usedBoxPositions.clear();

            // Scan map for pre-existing boxes
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const t = map[idx(x, y)];
                    if (t === QUESTION_BOX || t === KNOWLEDGE_BOX) {
                        usedBoxPositions.add(`${x},${y}`);
                        if (t === QUESTION_BOX) {
                            questionBoxesCount++;
                            questionsSpawnedTotal++;
                        }
                    }
                }
            }

            // Fill Question Boxes up to 10
            while (questionBoxesCount < 10 && questionsSpawnedTotal < questionDB.length) {
                if (!trySpawnQuestionBox(map)) break;
            }

            // Check distance for Knowledge boxes
            const isFarEnough = (x: number, y: number) => {
                const currentLocations: { x: number, y: number }[] = [];
                for (let yy = 0; yy < H; yy++) {
                    for (let xx = 0; xx < W; xx++) {
                        const t = map[idx(xx, yy)];
                        if (t === QUESTION_BOX || t === KNOWLEDGE_BOX) currentLocations.push({ x: xx, y: yy });
                    }
                }
                for (const p of currentLocations) {
                    if (Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) < 3) return false;
                }
                return true;
            };

            // Place Knowledge Boxes - Ensure ALL are placed by reducing distance if needed
            for (let i = 0; i < knowledgeDB.length; i++) {
                let placed = false;
                // Try with decreasing distance constraints to ensure all fit
                for (let d = 3; d >= 0 && !placed; d--) {
                    let attempts = 0;
                    while (!placed && attempts++ < 50) {
                        const x = 1 + Math.floor(Math.random() * (W - 2));
                        const y = 1 + Math.floor(Math.random() * (H - 4));
                        const posKey = `${x},${y}`;

                        const checkDist = (nx: number, ny: number, minDist: number) => {
                            const locs: { x: number, y: number }[] = [];
                            for (let yy = 0; yy < H; yy++) {
                                for (let xx = 0; xx < W; xx++) {
                                    const t = map[idx(xx, yy)];
                                    if (t === QUESTION_BOX || t === KNOWLEDGE_BOX) locs.push({ x: xx, y: yy });
                                }
                            }
                            for (const p of locs) {
                                if (Math.max(Math.abs(nx - p.x), Math.abs(ny - p.y)) < minDist) return false;
                            }
                            return true;
                        };

                        // Check distance from spawn point (at least 4 spaces)
                        const sx = Math.floor(spawnX / TILE);
                        const sy = Math.floor(spawnY / TILE);
                        const isTooCloseToSpawn = Math.max(Math.abs(x - sx), Math.abs(y - sy)) < 4;

                        if (map[idx(x, y)] === EMPTY && checkDist(x, y, d) && !isTooCloseToSpawn && !usedBoxPositions.has(posKey)) {
                            map[idx(x, y)] = KNOWLEDGE_BOX;
                            usedBoxPositions.add(posKey);
                            placed = true;
                        }
                    }
                }
            }
        }

        // Entities
        class Entity {
            x: number; y: number; w: number; h: number; dead: boolean; health: number; maxHealth: number;
            constructor(x: number, y: number, w: number, h: number) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; this.health = 100; this.maxHealth = 100; }
            get rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
            takeDamage(amount: number) {
                this.health -= amount;
                if (this.health <= 0) { this.dead = true; createExplosion(this.x + this.w / 2, this.y + this.h / 2); }
            }
        }

        class Tank extends Entity {
            color: string; dir: { x: number, y: number }; speed: number; cooldown: number; isPlayer: boolean; invulnerable: number; ai: any; canShoot: boolean;
            constructor(x: number, y: number, color = 'lime') {
                super(x, y, 32, 32);
                this.color = color;
                this.dir = { x: 0, y: -1 };
                this.speed = 0.15; // Tank Speed
                this.cooldown = 0;
                this.isPlayer = false;
                this.canShoot = true;
                this.invulnerable = 0;
            }
            tryMove(dx: number, dy: number) {
                if (dx || dy) this.dir = { x: Math.sign(dx), y: Math.sign(dy) };
                let nx = this.x + dx, ny = this.y + dy;
                nx = clamp(nx, 0, canvas.width - this.w); ny = clamp(ny, 0, canvas.height - this.h);
                const r = { x: nx, y: ny, w: this.w, h: this.h };
                if (collidesWalls(r) || collidesEntities(r, this)) return;

                // Check Boxes
                if (this.isPlayer) {
                    const box = getSpecialBoxAtRect(r);
                    if (box) {
                        const isSameBox = box.x === lastBoxX && box.y === lastBoxY;
                        const delay = isSameBox ? 3000 : 0;
                        if (Date.now() - lastBoxTriggerTime > delay) {
                            lastBoxX = box.x;
                            lastBoxY = box.y;
                            lastBoxTriggerTime = Date.now();
                            if (box.t === QUESTION_BOX) { sfx.questionBoxOpen(); showQuestionModal(box.x, box.y); }
                            else if (box.t === KNOWLEDGE_BOX) { sfx.knowledgeBoxOpen(); showKnowledgeModal(box.x, box.y); }
                        }
                    }
                }
                this.x = nx; this.y = ny;
            }
            update(dt: number) {
                this.cooldown = Math.max(0, this.cooldown - dt);
                this.invulnerable = Math.max(0, this.invulnerable - dt);
                if (this.ai) this.ai(dt, this);
            }
            shoot() {
                if (!this.canShoot || this.cooldown > 0) return;
                if (this.isPlayer) {
                    if ((window as any).currentModal) return;
                    if (playerBullets <= 0) {
                        sfx.noAmmo();
                        toast.warning("No ammo! Find Question Box!", {
                            id: 'no-ammo-toast',
                            style: { background: '#fef3c6', color: '#e17100', border: '1px solid #fee685' },
                            icon: <Crosshair className="w-5 h-5" />
                        });
                        return;
                    }

                    sfx.shoot();

                    playerBullets--;
                    if (bulletsRef.current) bulletsRef.current.textContent = playerBullets.toString();
                }
                const bx = this.x + this.w / 2 + this.dir.x * 24 - 4, by = this.y + this.h / 2 + this.dir.y * 24 - 4;
                bullets.push(new Bullet(bx, by, this.dir.x * 0.8, this.dir.y * 0.8, this));
                this.cooldown = 250;
            }
            draw() {
                if (this.invulnerable > 0 && Math.floor(this.invulnerable / 100) % 2) ctx.globalAlpha = 0.5;

                const cx = this.x + this.w / 2;
                const cy = this.y + this.h / 2;
                const angle = Math.atan2(this.dir.y, this.dir.x);

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(angle);

                // --- TANK VISUALS (Facing RIGHT corresponds to angle 0) ---

                // 1. Tracks (Treads)
                ctx.fillStyle = '#334155'; // Slate-700
                // Top Track
                ctx.fillRect(-14, -15, 30, 8);
                // Bottom Track
                ctx.fillRect(-14, 7, 30, 8);

                // Tread details (lines)
                ctx.fillStyle = '#1e293b'; // Slate-800
                for (let i = -12; i < 14; i += 4) {
                    ctx.fillRect(i, -15, 2, 8);
                    ctx.fillRect(i, 7, 2, 8);
                }

                // 2. Main Body
                // Shadow
                ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4;
                ctx.fillStyle = this.isPlayer ? '#2563eb' : '#dc2626'; // Blue-600 or Red-600
                if (this.color !== 'lime' && this.color !== '#ff4757') ctx.fillStyle = this.color; // Use custom color if set (but normalize mainly)

                // Using gradient for body to give 3D feel
                const bodyGrad = ctx.createLinearGradient(-12, -10, 12, 10);
                if (this.isPlayer) {
                    bodyGrad.addColorStop(0, '#60a5fa'); bodyGrad.addColorStop(1, '#2563eb');
                } else {
                    bodyGrad.addColorStop(0, '#a684ff'); bodyGrad.addColorStop(1, '#8e51ff');
                }
                ctx.fillStyle = bodyGrad;
                ctx.fillRect(-13, -9, 26, 18);

                ctx.shadowBlur = 0; // Reset shadow

                // 3. Turret
                ctx.fillStyle = this.isPlayer ? '#1d4ed8' : '#5d0ec0'; // Darker shade
                ctx.fillRect(-6, -6, 12, 12);

                // 4. Cannon / Barrel
                ctx.fillStyle = '#1f2937'; // Gray-800
                ctx.fillRect(4, -3, 16, 6); // Stick out to the right
                // Muzzle tip
                ctx.fillStyle = '#000';
                ctx.fillRect(18, -3, 2, 6);

                // 5. Hatch / Highlight
                ctx.fillStyle = this.isPlayer ? '#93c5fd' : '#c4b4ff';
                ctx.beginPath();
                ctx.arc(-2, 0, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                // Health Bar logic if needed (drawn absolutely, not rotated)
                // ctx.fillStyle = 'red'; ctx.fillRect(this.x, this.y - 6, this.w, 4);
                // ctx.fillStyle = 'lime'; ctx.fillRect(this.x, this.y - 6, this.w * (this.health / this.maxHealth), 4);

                ctx.globalAlpha = 1;
            }
        }

        class Bullet extends Entity {
            vx: number; vy: number; owner: any; trail: any[];
            constructor(x: number, y: number, vx: number, vy: number, owner: any) {
                super(x, y, 8, 8); this.vx = vx; this.vy = vy; this.owner = owner; this.trail = [];
            }
            update(dt: number) {
                this.x += this.vx * dt; this.y += this.vy * dt;
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) { this.dead = true; return; }

                // Wall Collision
                const hit = collideTileForBullets({ x: this.x, y: this.y, w: this.w, h: this.h });
                if (hit) {
                    const isPlayerBullet = this.owner && this.owner.isPlayer;
                    if (hit.t === BRICK) { level[idx(hit.x, hit.y)] = EMPTY; if (isPlayerBullet) sfx.brickDestroy(); }
                    else if (hit.t === STEEL && isPlayerBullet) { sfx.steelHit(); }
                    this.dead = true; createExplosion(this.x, this.y, '#fbbf24', !!isPlayerBullet); return;
                }

                // Entity Collision
                const targets = (this.owner && this.owner.isPlayer) ? enemies : [player];
                for (const t of targets) {
                    if (!t || t.dead || t.invulnerable > 0) continue;
                    if (rectsOverlap(this.rect, t.rect)) {
                        if (t === player) {
                            lives--; if (livesRef.current) livesRef.current.textContent = lives.toString();
                            t.invulnerable = 2000; sfx.playerHit();
                            if (lives <= 0) {
                                t.dead = true;
                                gameOver(false, 'no_heart');
                            } // Heart loss
                        } else {
                            t.takeDamage(100); sfx.enemyDie();
                            score += 100; enemiesKilled++;
                            if (scoreRef.current) scoreRef.current.textContent = score.toString();
                            if (enemiesLeftRef.current) enemiesLeftRef.current.textContent = (TOTAL_ENEMIES - enemiesKilled).toString();
                            spawnIfNeeded();
                        }
                        this.dead = true; createExplosion(this.x, this.y);
                        break;
                    }
                }
            }
            draw() { ctx.fillStyle = '#fbbf24'; ctx.fillRect(this.x, this.y, this.w, this.h); }
        }

        // --- UTILS ---
        function rectsOverlap(a: any, b: any) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
        function collidesWalls(r: any) {
            if (r.x < 0 || r.y < 0 || r.x + r.w > canvas.width || r.y + r.h > canvas.height) return true;
            const x0 = Math.floor(r.x / TILE), y0 = Math.floor(r.y / TILE), x1 = Math.floor((r.x + r.w - 1) / TILE), y1 = Math.floor((r.y + r.h - 1) / TILE);
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ([BRICK, STEEL, WATER].includes(level[idx(x, y)])) return true;
            return false;
        }
        function collidesEntities(r: any, self: any) {
            for (const e of [player, ...enemies]) if (e && e !== self && !e.dead && rectsOverlap(r, e.rect)) return true;
            return false;
        }
        function getSpecialBoxAtRect(r: any) {
            const x0 = Math.floor(r.x / TILE), y0 = Math.floor(r.y / TILE), x1 = Math.floor((r.x + r.w - 1) / TILE), y1 = Math.floor((r.y + r.h - 1) / TILE);
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ([QUESTION_BOX, KNOWLEDGE_BOX].includes(level[idx(x, y)])) return { x, y, t: level[idx(x, y)] };
            return null;
        }
        function collideTileForBullets(r: any) {
            const x0 = Math.floor(r.x / TILE), y0 = Math.floor(r.y / TILE), x1 = Math.floor((r.x + r.w - 1) / TILE), y1 = Math.floor((r.y + r.h - 1) / TILE);
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ([BRICK, STEEL].includes(level[idx(x, y)])) return { x, y, t: level[idx(x, y)] };
            return null;
        }

        function spawnIfNeeded() {
            if (enemiesKilled + enemies.length >= TOTAL_ENEMIES) return;
            if (enemies.length >= MAX_ENEMIES_ON_FIELD) return;

            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 50) {
                // Try random positions in the top 3 rows typically, or just top row as before?
                // Original was TILE (y=48). Let's stick to TILE but verify X.
                // Or maybe try random valid spawn points from the map?
                // For now, retry random X at y=TILE.
                const ex = Math.random() * (W - 2) * TILE + TILE;
                // If player is on enemy side (top half), spawn in player side (bottom row)
                const isPlayerOnEnemySide = player && player.y < (H / 2) * TILE;
                const ey = isPlayerOnEnemySide ? (H - 2) * TILE : TILE;

                // Check collisions
                const r = { x: ex, y: ey, w: 32, h: 32 };

                // Check map obstacles (BRICK, STEEL, WATER, boxes?) -> collidesWalls checks B,S,W.
                // We should also check for boxes to avoid spawning ON TOP of them if they are obstacles.
                // Boxes (7,8) are not in collidesWalls.
                let obstacle = false;
                if (collidesWalls(r)) obstacle = true;

                // Manual check for boxes overlap for spawning safety
                if (!obstacle) {
                    const x0 = Math.floor(r.x / TILE), y0 = Math.floor(r.y / TILE);
                    const x1 = Math.floor((r.x + r.w - 1) / TILE), y1 = Math.floor((r.y + r.h - 1) / TILE);
                    for (let y = y0; y <= y1; y++) {
                        for (let x = x0; x <= x1; x++) {
                            const t = level[idx(x, y)];
                            if ([QUESTION_BOX, KNOWLEDGE_BOX, TREE].includes(t)) {
                                // Trees are usually passable? Code: if(t===TREE) continue in draw. 
                                // collideWalls ignores TREE. 
                                // But Boxes trigger events. Maybe better not to spawn ON them.
                                if (t !== TREE) obstacle = true;
                            }
                        }
                    }
                }

                if (!obstacle && !collidesEntities(r, null)) {
                    const e = new Tank(ex, ey, '#ff4757');
                    e.ai = (dt: number, self: any) => {
                        // Simple AI
                        if (Math.random() < 0.02) self.dir = { x: Math.random() < 0.5 ? 1 : -1, y: 0 };
                        if (Math.random() < 0.02) self.dir = { x: 0, y: Math.random() < 0.5 ? 1 : -1 };
                        self.tryMove(self.dir.x * self.speed * dt, self.dir.y * self.speed * dt);
                        if (Math.random() < 0.01) self.shoot();
                    };
                    enemies.push(e);
                    if (enemiesLeftRef.current) enemiesLeftRef.current.textContent = (TOTAL_ENEMIES - enemiesKilled).toString();
                    placed = true;
                }
                attempts++;
            }
        }

        function createExplosion(x: number, y: number, color = '#fbbf24', playSound = true) {
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x: x, y: y,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                    life: 1.0, color: color,
                    update: function (dt: number) {
                        this.x += this.vx * (dt / 16);
                        this.y += this.vy * (dt / 16);
                        this.life -= 0.003 * dt;
                        return this.life > 0;
                    },
                    draw: function () { ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, 4, 4); ctx.globalAlpha = 1; }
                });
            }
            if (playSound) sfx.explosion();
        }

        // --- MODALS ---
        // --- MODALS ---
        function showQuestionModal(x: number, y: number) {
            keys = {}; // Stop movement
            const k = `${x},${y}`;
            if (questionAssignments[k] === undefined) { questionAssignments[k] = questionOrder[nextQuestionIdx++ % questionOrder.length]; }
            const qIdx = questionAssignments[k];
            const q = questionDB[qIdx];
            const failed = incorrectAttempts[k] || [];
            setModalConfig({ type: 'question', data: q, x, y, reward: AMMO_PER_CORRECT, failed });
            (window as any).currentModal = true;
        }

        (window as any).tankGameResult = (success: boolean, x: number, y: number, choice?: string | string[]) => {
            const k = `${x},${y}`;
            if (success) {
                sfx.correct();
                playerBullets += AMMO_PER_CORRECT;
                if (bulletsRef.current) bulletsRef.current.textContent = playerBullets.toString();
                level[idx(x, y)] = EMPTY; // Remove box
                questionBoxesCount--;
                trySpawnQuestionBox(level, true);
                // Handled by Modal UI delay: closeModal();
            } else {
                sfx.wrong();
                wrongAttempts++;
                if (wrongCountRef.current) wrongCountRef.current.textContent = Math.max(0, MAX_WRONG - wrongAttempts).toString();

                if (choice) {
                    if (!incorrectAttempts[k]) incorrectAttempts[k] = [];
                    incorrectAttempts[k].push(choice);
                }

                if (wrongAttempts >= MAX_WRONG) {
                    closeModal();
                    gameOver(false, 'no_brain');
                }
            }
        }

        function closeModal() {
            if ((window as any).currentModal) {
                if ((window as any).currentModal !== true && (window as any).currentModal.parentNode) {
                    document.body.removeChild((window as any).currentModal);
                }
                (window as any).currentModal = null;
            }
            canvas.focus();
            showingModal = false;
            lastBoxTriggerTime = Date.now();

            if (previousModalRef.current) {
                setModalConfig(previousModalRef.current);
                previousModalRef.current = null;
                showingModal = true;
            } else {
                setModalConfig(null);
            }
        }

        function showStartScreen() {
            setModalConfig({ type: 'start' });
            showingModal = true;
        }

        function showKnowledgeModal(x: number, y: number) {
            keys = {};
            const k = `${x},${y}`;
            if (knowledgeAssignments[k] === undefined) { knowledgeAssignments[k] = knowledgeOrder[nextKnowledgeIdx++ % knowledgeOrder.length]; }
            const kIdx = knowledgeAssignments[k];
            const content = knowledgeDB[kIdx];
            setModalConfig({ type: 'knowledge', data: content, x, y });
            (window as any).currentModal = true;
        }
        (window as any).tankGameClose = closeModal;


        function gameOver(win: boolean, reason?: string) {
            if (gameEnded) return;
            gameEnded = true;
            if (onPauseToggle) onPauseToggle(true);
            stopBgMusic();

            closeModal();

            if (gameEndTimeoutRef.current) clearTimeout(gameEndTimeoutRef.current);
            gameEndTimeoutRef.current = setTimeout(() => {
                onGameOver(win ? 2 : 3, reason);
                gameEndTimeoutRef.current = null;
            }, 2000);
        }

        // --- RENDER HELPERS ---
        function drawBackground() {
            const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            bgGrad.addColorStop(0, BG_GRAD_A); bgGrad.addColorStop(1, BG_GRAD_B);
            ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const questionIcon = new Image();
        const knowledgeIcon = new Image();

        const questionSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#fff" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.475 5.458c-.284 0-.514-.237-.47-.517C4.28 3.24 5.576 2 7.825 2c2.25 0 3.767 1.36 3.767 3.215 0 1.344-.665 2.288-1.79 2.973-1.1.659-1.414 1.118-1.414 2.01v.03a.5.5 0 0 1-.5.5h-.77a.5.5 0 0 1-.5-.495l-.003-.2c-.043-1.221.477-2.001 1.645-2.712 1.03-.632 1.397-1.135 1.397-2.028 0-.979-.758-1.698-1.926-1.698-1.009 0-1.71.529-1.938 1.402-.066.254-.278.461-.54.461h-.777ZM7.496 14c.622 0 1.095-.474 1.095-1.09 0-.618-.473-1.092-1.095-1.092-.606 0-1.087.474-1.087 1.091S6.89 14 7.496 14"/></svg>`;
        const knowledgeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#fff" viewBox="0 0 16 16"><path d="m9.708 6.075-3.024.379-.108.502.595.108c.387.093.464.232.38.619l-.975 4.577c-.255 1.183.14 1.74 1.067 1.74.72 0 1.554-.332 1.933-.789l.116-.549c-.263.232-.65.325-.905.325-.363 0-.494-.255-.402-.704zm.091-2.755a1.32 1.32 0 1 1-2.64 0 1.32 1.32 0 0 1 2.64 0"/></svg>`;

        questionIcon.src = 'data:image/svg+xml;base64,' + btoa(questionSVG);
        knowledgeIcon.src = 'data:image/svg+xml;base64,' + btoa(knowledgeSVG);

        function drawMap() {
            const time = Date.now();

            // Tiles (Bottom Layer)
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    const t = level[idx(x, y)], px = x * TILE, py = y * TILE;

                    ctx.globalAlpha = 1.0;

                    if (t === EMPTY) { ctx.strokeStyle = TILE_STROKE; ctx.lineWidth = 0.5; ctx.strokeRect(px, py, TILE, TILE); continue; }
                    if (t === TREE) continue;

                    const isCoolingDown = (t === QUESTION_BOX || t === KNOWLEDGE_BOX) && x === lastBoxX && y === lastBoxY && (Date.now() - lastBoxTriggerTime < 3000);

                    // If cooling down, set opacity to 0 for EVERYTHING (Background + Icon)
                    if (isCoolingDown) {
                        ctx.globalAlpha = 0.5;
                    }

                    let grad;
                    switch (t) {
                        case BRICK:
                            ctx.drawImage(brickImg, px, py);
                            break;
                        case STEEL:
                            ctx.drawImage(steelImg, px, py);
                            break;
                        case WATER:
                            const waveOffset = (time / 100) % TILE;
                            ctx.fillStyle = '#00d3f3';
                            ctx.fillRect(px, py, TILE, TILE);

                            ctx.strokeStyle = '#cefafe';
                            ctx.lineWidth = 2;
                            ctx.beginPath();

                            for (let i = 0; i < TILE; i += 8) {
                                const wx = px + i;
                                const wy = py + 10 + Math.sin((wx + time / 20) * 0.1) * 3;
                                ctx.moveTo(wx, wy);
                                ctx.lineTo(wx + 4, wy);

                                const wy2 = py + 30 + Math.sin((wx + time / 20 + 20) * 0.1) * 3;
                                ctx.moveTo(wx, wy2);
                                ctx.lineTo(wx + 4, wy2);
                            }
                            ctx.stroke();
                            break;
                        case QUESTION_BOX: grad = ctx.createRadialGradient(px + TILE / 2, py + TILE / 2, 0, px + TILE / 2, py + TILE / 2, TILE / 2);
                            grad.addColorStop(0, '#ffa2a2'); grad.addColorStop(1, '#ff6467');
                            ctx.shadowColor = '#ffa2a2'; ctx.shadowBlur = 8;
                            ctx.fillStyle = grad;
                            ctx.fillRect(px, py, TILE, TILE);
                            ctx.shadowBlur = 0;
                            break;
                        case KNOWLEDGE_BOX: grad = ctx.createRadialGradient(px + TILE / 2, py + TILE / 2, 0, px + TILE / 2, py + TILE / 2, TILE / 2);
                            grad.addColorStop(0, '#7dd3fc'); grad.addColorStop(1, '#0ea5e9');
                            ctx.shadowColor = '#7dd3fc'; ctx.shadowBlur = 8;
                            ctx.fillStyle = grad;
                            ctx.fillRect(px, py, TILE, TILE);
                            ctx.shadowBlur = 0;
                            break;
                        default: ctx.fillStyle = 'black';
                    }

                    const iconSize = 28;
                    const ix = px + TILE / 2 - iconSize / 2;
                    const iy = py + TILE / 2 - iconSize / 2;

                    if (t === QUESTION_BOX && questionIcon.complete) {
                        ctx.drawImage(questionIcon, ix, iy, iconSize, iconSize);
                    }

                    if (t === KNOWLEDGE_BOX && knowledgeIcon.complete) {
                        ctx.drawImage(knowledgeIcon, ix, iy, iconSize, iconSize);
                    }
                }
            }
        }

        function drawTrees() {
            ctx.globalAlpha = 0.9;
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    if (level[idx(x, y)] === TREE) {
                        const px = x * TILE, py = y * TILE;
                        ctx.drawImage(treeImg, px, py);
                    }
                }
            }
            ctx.globalAlpha = 1.0;
        }

        // Simple Ambient Music
        let musicOsc: OscillatorNode | null = null;
        let musicGain: GainNode | null = null;

        const updateMusic = () => {
            const shouldPlay = isPlaying && audioSettingsRef.current.master && audioSettingsRef.current.music > 0 && !gameEnded;
            const targetGain = 0.04 * audioSettingsRef.current.music; // Base max music vol is 0.04

            if (shouldPlay && !musicOsc) {
                try {
                    musicGain = audioCtx.createGain();
                    musicGain.gain.setValueAtTime(0, audioCtx.currentTime);
                    musicGain.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 2);
                    musicGain.connect(audioCtx.destination);

                    musicOsc = audioCtx.createOscillator();
                    musicOsc.type = 'triangle';
                    musicOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
                    musicOsc.connect(musicGain);
                    musicOsc.start();
                } catch (e) { console.error("Audio error", e); }
            } else if (!shouldPlay && musicOsc) {
                const curGain = musicGain;
                const curOsc = musicOsc;
                musicGain = null;
                musicOsc = null;
                if (curGain) {
                    curGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
                    setTimeout(() => { if (curOsc && audioCtx.state !== 'closed') try { curOsc.stop(); } catch (e) { } }, 600);
                }
            } else if (musicOsc && musicGain) {
                // Adjust volume in real-time
                musicGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);
            }
        };

        // --- LOOP ---
        let loopId: number;
        let lastTime: number = 0;
        let spawnTimer = 0;

        let loop = function (ts: number) {
            // Calculate real delta time
            if (!lastTime) lastTime = ts;
            let dt = ts - lastTime;
            lastTime = ts;

            // Cap dt to avoid huge jumps (e.g. when tab is inactive)
            if (dt > 100) dt = 16;

            // Poll mobile joystick → 4-direction keys (with deadzone)
            if (isMobileRef.current) {
                const jx = joystickRef.current.x;
                const jy = joystickRef.current.y;
                const DEADZONE = 0.22;
                const absX = Math.abs(jx);
                const absY = Math.abs(jy);
                const active = absX > DEADZONE || absY > DEADZONE;
                keys['ArrowUp'] = active && absY >= absX && jy < 0;
                keys['ArrowDown'] = active && absY >= absX && jy > 0;
                keys['ArrowLeft'] = active && absX > absY && jx < 0;
                keys['ArrowRight'] = active && absX > absY && jx > 0;
            }

            if (!isPlaying) {
                drawBackground();
                drawMap();
                drawTrees();
                loopId = requestAnimationFrame(loop);
                return;
            }

            if ((window as any).currentModal && isPlaying) {
                lastTime = 0; // Reset lastTime so we don't have a huge jump after modal closes
                loopId = requestAnimationFrame(loop);
                return;
            }

            if (!gameEnded) {
                if (keys['ArrowUp']) player.tryMove(0, -player.speed * dt);
                else if (keys['ArrowDown']) player.tryMove(0, player.speed * dt);
                else if (keys['ArrowLeft']) player.tryMove(-player.speed * dt, 0);
                else if (keys['ArrowRight']) player.tryMove(player.speed * dt, 0);

                player.update(dt);

                spawnTimer -= dt;
                if (spawnTimer <= 0) {
                    spawnIfNeeded();
                    spawnTimer = 2000;
                }

                enemies.forEach(e => e.update(dt));
                bullets.forEach(b => b.update(dt));
                bullets = bullets.filter(b => !b.dead);
                enemies = enemies.filter(e => !e.dead);

                // WIN: Remaining Enemies = 0 && Kills >= Total
                if (enemiesKilled >= TOTAL_ENEMIES && enemies.length === 0) gameOver(true);

                // LOSS: Ammo=0 & Q=0 & No Active Player Bullets
                const activePlayerBullets = bullets.filter(b => b.owner && b.owner.isPlayer).length;
                if (playerBullets <= 0 && questionBoxesCount <= 0 && activePlayerBullets === 0) gameOver(false, 'out_of_ammo');
            }

            drawBackground();
            drawMap();

            // Entities
            bullets.forEach(b => b.draw());
            if (!player.dead) player.draw();
            enemies.forEach(e => e.draw());

            // Particles
            particles.forEach((p, i) => { if (p.update(dt)) p.draw(); else particles.splice(i, 1); });

            drawTrees();

            loopId = requestAnimationFrame(loop);
        }

        // INPUT
        const keyHandler = (e: KeyboardEvent) => { keys[e.code] = e.type === 'keydown'; if (e.code === 'Space' && e.type === 'keydown') player.shoot(); };
        window.addEventListener('keydown', keyHandler);
        window.addEventListener('keyup', keyHandler);

        // Expose shoot function for mobile touch controls
        shootRef.current = () => { if (player && !player.dead && !gameEnded) player.shoot(); };

        // Initial Setup
        canvas.width = W * TILE; canvas.height = H * TILE;
        level = generateMap();
        player = new Tank(spawnX, spawnY, MAIN); player.isPlayer = true;

        // Initial UI
        if (livesRef.current) livesRef.current.textContent = lives.toString();
        if (bulletsRef.current) bulletsRef.current.textContent = playerBullets.toString();
        // Initial UI
        if (livesRef.current) livesRef.current.textContent = lives.toString();
        if (bulletsRef.current) bulletsRef.current.textContent = playerBullets.toString();
        if (enemiesLeftRef.current) enemiesLeftRef.current.textContent = TOTAL_ENEMIES.toString();
        if (wrongCountRef.current) wrongCountRef.current.textContent = MAX_WRONG.toString();

        if (!isPlaying) {
            showStartScreen();
        } else {
            spawnIfNeeded();
            startBgMusic();
        }

        loop(0);

        return () => {
            cancelAnimationFrame(loopId);
            window.removeEventListener('keydown', keyHandler);
            window.removeEventListener('keyup', keyHandler);
            closeModal();
            stopBgMusic();
            if (gameEndTimeoutRef.current) clearTimeout(gameEndTimeoutRef.current);
            shootSound.unload();
            enemyDieSound.unload();
            updateMusicVolRef.current = null;
            try { audioCtx.close(); } catch (e) { }
            // Also remove currentModal if it is start screen
            if ((window as any).currentModal) {
                document.body.removeChild((window as any).currentModal);
                (window as any).currentModal = null;
            }
            (window as any).tankGameAnswer = undefined;
            (window as any).tankGameClose = undefined;
        };
    }, [gameData, isPlaying]);

    // Touch control handlers
    const handleTouchStart = useCallback((key: string) => {
        activeKeysRef.current.add(key);
    }, []);

    const handleTouchEnd = useCallback((key: string) => {
        activeKeysRef.current.delete(key);
    }, []);

    const handleShoot = useCallback(() => {
        if (shootRef.current) shootRef.current();
    }, []);

    return (
        <div className={`tank-game-container relative w-full h-full ${isMobile ? 'is-mobile' : ''}`}>
            {/* Settings Button - Desktop */}
            {!isMobile && (
                <button
                    onClick={() => {
                        previousModalRef.current = modalConfig;
                        setModalConfig({ type: 'settings' });
                        (window as any).currentModal = true;
                    }}
                    className="absolute top-8 right-8 z-50 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-semibold transition-colors items-center gap-2 border-2 border-gray-200 hidden lg:flex"
                    title="Game Settings"
                >
                    <Settings className="text-gray-500 !w-5 !h-5" />
                    Settings
                </button>
            )}

            {/* Desktop HUD */}
            {!isMobile && <div className="absolute top-8 left-1/2 -translate-x-1/2 items-center gap-6 bg-black/80 backdrop-blur-xl px-8 py-3 rounded-full border border-white/10 shadow-2xl z-[60] hidden lg:flex">
                <div className="flex items-center gap-3 text-white">
                    <Heart className="w-5 h-5 text-red-400 fill-red-400" />
                    <span ref={!isMobile ? livesRef : undefined} className="font-bold text-xl font-mono tracking-wider">{livesRef.current ? livesRef.current.textContent : 3}</span>
                </div>
                <div className="w-px h-6 bg-white/20"></div>
                <div className="flex items-center gap-3 text-white">
                    <Brain className="w-5 h-5 text-pink-400" />
                    <span ref={!isMobile ? wrongCountRef : undefined} className="font-bold text-xl font-mono tracking-wider">{wrongCountRef.current ? wrongCountRef.current.textContent : 3}</span>
                </div>
                <div className="w-px h-6 bg-white/20"></div>
                <div className="flex items-center gap-3 text-white">
                    <Crosshair className="w-5 h-5 text-amber-400" />
                    <span ref={!isMobile ? bulletsRef : undefined} className="font-bold text-xl font-mono tracking-wider">{bulletsRef.current ? bulletsRef.current.textContent : 20}</span>
                </div>
                <div className="w-px h-6 bg-white/20"></div>
                <div className="flex items-center gap-3 text-white">
                    <Angry className="w-5 h-5 text-violet-400" />
                    <span ref={!isMobile ? enemiesLeftRef : undefined} className="font-bold text-xl font-mono tracking-wider">{enemiesLeftRef.current ? enemiesLeftRef.current.textContent : 0}</span>
                </div>

                {/* Timer Section */}
                {(timerDisplay && limitDisplay) && (() => {
                    const [minStr, secStr] = limitDisplay.split(':');
                    const minutes = Number(minStr);
                    const seconds = Number(secStr);
                    const isDanger = minutes === 0 && seconds < 60;

                    return (
                        <>
                            <div className="w-px h-6 bg-white/20"></div>
                            <div className="flex items-center gap-3 text-white">
                                <Timer className="w-5 h-5 text-emerald-400" />
                                <div className="flex items-end gap-2">
                                    <span
                                        key={limitDisplay}
                                        className={`font-bold text-xl font-mono tracking-wider ${isDanger ? 'text-red-400 animate-pulse' : ''
                                            }`}
                                    >
                                        {limitDisplay}
                                    </span>
                                    <span className="font-bold text-sm font-mono tracking-wider text-gray-200 mb-[3px]">
                                        ({timerDisplay})
                                    </span>
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>}

            {/* Mobile HUD - horizontal bar at top */}
            {isMobile && (
                <div className="mobile-hud">
                    <div className="mobile-hud-item">
                        <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                        <span ref={livesRef}>{livesRef.current ? livesRef.current.textContent : 3}</span>
                    </div>
                    <div className="mobile-hud-sep" />
                    <div className="mobile-hud-item">
                        <Brain className="w-3.5 h-3.5 text-pink-400" />
                        <span ref={wrongCountRef}>{wrongCountRef.current ? wrongCountRef.current.textContent : 3}</span>
                    </div>
                    <div className="mobile-hud-sep" />
                    <div className="mobile-hud-item">
                        <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                        <span ref={bulletsRef}>{bulletsRef.current ? bulletsRef.current.textContent : 20}</span>
                    </div>
                    <div className="mobile-hud-sep" />
                    <div className="mobile-hud-item">
                        <Angry className="w-3.5 h-3.5 text-violet-400" />
                        <span ref={enemiesLeftRef}>{enemiesLeftRef.current ? enemiesLeftRef.current.textContent : 0}</span>
                    </div>
                    {(timerDisplay && limitDisplay) && (() => {
                        const [minStr, secStr] = limitDisplay.split(':');
                        const minutes = Number(minStr);
                        const seconds = Number(secStr);
                        const isDanger = minutes === 0 && seconds < 60;

                        return (
                            <>
                                <div className="mobile-hud-sep" />
                                <div className="mobile-hud-item">
                                    <Timer className="w-3.5 h-3.5 text-emerald-400" />
                                    <div className="flex items-center gap-1">
                                        <span
                                            key={limitDisplay}
                                            className={isDanger ? 'text-red-400 animate-pulse' : ''}
                                        >
                                            {limitDisplay}
                                        </span>
                                        <span className="text-[10px] text-gray-400 hidden sm:block">
                                            ({timerDisplay})
                                        </span>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                    <div className="mobile-hud-actions">
                        <button
                            onClick={() => {
                                previousModalRef.current = modalConfig;
                                setModalConfig({ type: 'settings' });
                                (window as any).currentModal = true;
                            }}
                            className="mobile-hud-settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>

                    </div>
                </div>
            )}

            <canvas ref={canvasRef} tabIndex={0} className={`outline-none ${isMobile ? '' : 'lg:mt-20'}`} />

            {/* Mobile Touch Controls */}
            {isMobile && isPlaying && !modalConfig && (
                <div className="mobile-controls">
                    {/* Virtual Joystick */}
                    <VirtualJoystickRing
                        onMove={(x, y) => { joystickRef.current = { x, y }; }}
                        onEnd={() => { joystickRef.current = { x: 0, y: 0 }; }}
                    />

                    {/* Fire Button */}
                    <button
                        className="fire-btn"
                        onTouchStart={() => handleShoot()}
                        onMouseDown={() => handleShoot()}
                    >
                        <Crosshair className="w-8 h-8 lg:w-12 lg:h-12" />
                    </button>
                </div>
            )}

            {/* Modals */}
            {modalConfig?.type === 'question' && (
                <QuestionModal
                    data={modalConfig.data}
                    reward={modalConfig.reward}
                    failedChoices={modalConfig.failed}
                    isMobile={isMobile}
                    onResult={(s: boolean, choice?: string | string[]) => (window as any).tankGameResult(s, modalConfig.x, modalConfig.y, choice)}
                    onClose={() => (window as any).tankGameClose()}
                />
            )}
            {modalConfig?.type === 'start' && (
                <StartModal
                    gameName={gameData.name}
                    isMobile={isMobile}
                    onStart={() => {
                        setModalConfig(null);
                        onStartGame();
                    }}
                />
            )}
            {modalConfig?.type === 'knowledge' && (
                <KnowledgeModal
                    data={modalConfig.data}
                    isMobile={isMobile}
                    onClose={() => (window as any).tankGameClose()}
                />
            )}
            {modalConfig?.type === 'settings' && (
                <SettingsModal
                    settings={audioSettings}
                    isMobile={isMobile}
                    onExit={onExit}
                    onUpdate={setAudioSettings}
                    onClose={() => (window as any).tankGameClose()}
                />
            )}
        </div>
    );
}

/* ─── Virtual Joystick Ring ────────────────────────────────── */
function VirtualJoystickRing({ onMove, onEnd }: { onMove: (x: number, y: number) => void; onEnd: () => void }) {
    const baseRef = React.useRef<HTMLDivElement>(null);
    const [thumb, setThumb] = React.useState({ x: 0, y: 0 });
    const dragging = React.useRef(false);

    const RADIUS_RATIO = 0.28; // max drag distance as fraction of base size

    const handlePointerDown = (e: React.PointerEvent) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updatePosition(e);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging.current) return;
        updatePosition(e);
    };

    const handlePointerUp = () => {
        dragging.current = false;
        setThumb({ x: 0, y: 0 });
        onEnd();
    };

    const updatePosition = (e: React.PointerEvent) => {
        const base = baseRef.current;
        if (!base) return;
        const rect = base.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxR = rect.width * RADIUS_RATIO;

        let dx = e.clientX - cx;
        let dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxR) {
            dx = (dx / dist) * maxR;
            dy = (dy / dist) * maxR;
        }

        setThumb({ x: dx, y: dy });
        // Normalize to -1..1
        onMove(dx / maxR, dy / maxR);
    };

    return (
        <div
            ref={baseRef}
            className="joystick-base"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Ring background */}
            <div className="joystick-ring" />

            {/* 4 Wedge segments */}
            <div className="joystick-wedge wedge-up" />
            <div className="joystick-wedge wedge-right" />
            <div className="joystick-wedge wedge-down" />
            <div className="joystick-wedge wedge-left" />

            {/* Direction arrows */}
            <div className="joystick-arrow arrow-up" />
            <div className="joystick-arrow arrow-right" />
            <div className="joystick-arrow arrow-down" />
            <div className="joystick-arrow arrow-left" />

            {/* Puck shadow (under thumb) */}
            <div
                className="joystick-puck-shadow"
                style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }}
            />

            {/* Thumb (draggable puck) */}
            <div
                className="joystick-thumb"
                style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }}
            />
        </div>
    );
}

function StartModal({ gameName, isMobile, onStart }: { gameName: string, isMobile: boolean, onStart: () => void }) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="animate-in fade-in zoom-in duration-300 w-full max-w-lg">
                <div className="relative w-full">
                    <div className={`bg-white rounded-3xl shadow-2xl w-full relative ${isMobile ? 'mt-8' : 'lg:mt-20'} flex flex-col overflow-hidden`}>
                        {/* Header */}
                        <div className="bg-white border-b border-gray-200 flex justify-between items-center px-6 py-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/20 p-2.5 rounded-full">
                                    <Gamepad2 className="w-6 h-6 text-primary" />
                                </div>
                                <span className="font-bold text-gray-800 line-clamp-1 break-all pr-1">{gameName || 'Tank Game'}</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 text-center bg-gray-50/50">
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Ready to Battle?</h2>
                            <button
                                onClick={onStart}
                                className="w-full py-4 text-lg bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                            >
                                <Play className="w-6 h-6 fill-white" />
                                Start Game
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuestionModal({ data, reward, failedChoices, isMobile, onResult, onClose }: { data: any, reward: number, failedChoices: any[], isMobile: boolean, onResult: (success: boolean, choice?: string | string[]) => void, onClose: () => void }) {
    const [selected, setSelected] = React.useState<string | string[]>(data.type === 'multi' ? [] : '');
    const [textInput, setTextInput] = React.useState('');
    const [error, setError] = React.useState(false);
    const [shake, setShake] = React.useState(false);
    const [crossedOut, setCrossedOut] = React.useState<any[]>(failedChoices || []);
    const [success, setSuccess] = React.useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
    const [canInteract, setCanInteract] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setCanInteract(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Reset error on interaction
    React.useEffect(() => { setError(false); }, [selected, textInput]);

    const handleSingleSubmit = (opt: string) => {
        if (!canInteract || crossedOut.includes(opt) || success) return;
        setSelected(opt);

        const ans = Array.isArray(data.answer) ? data.answer[0] : data.answer;
        const isCorrect = opt === ans;

        onResult(isCorrect, isCorrect ? undefined : opt);

        if (!isCorrect) {
            setError(true);
            setShake(true);
            setCrossedOut(prev => [...prev, opt]);
            setTimeout(() => setShake(false), 500);
        } else {
            setSuccess(true);
            setTimeout(onClose, 2000);
        }
    };

    const handleMultiSubmit = () => {
        if (!canInteract || success) return;
        let isCorrect = false;
        if (data.type === 'multi') {
            const ans = data.answer as string[]; // Array of correct answers
            const sel = selected as string[];
            isCorrect = sel.length === ans.length && sel.every(s => ans.includes(s));

            if (!isCorrect) {
                setCrossedOut(prev => [...prev, sel]);
                setSelected([]); // Clear all selections on error
                onResult(isCorrect, sel);
            } else {
                onResult(isCorrect);
            }
        } else if (data.type === 'fill') {
            const possibleAnswers = Array.isArray(data.answer) ? data.answer : [data.answer];
            const userAns = textInput.trim();
            isCorrect = possibleAnswers.some((ans: any) => String(ans).trim().toLowerCase() === userAns.toLowerCase());

            if (!isCorrect) {
                setCrossedOut(prev => [...prev, userAns]);
                setTextInput(''); // Clear input on error
                onResult(isCorrect, userAns);
            } else {
                onResult(isCorrect);
            }
        }

        if (!isCorrect) {
            setError(true);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } else {
            setSuccess(true);
            setTimeout(onClose, 2000);
        }
    };

    const toggleMulti = (val: string) => {
        if (!canInteract || success) return;
        const sel = selected as string[];
        const ans = data.answer as string[];

        if (sel.includes(val)) {
            setSelected(sel.filter(s => s !== val));
        } else if (sel.length < ans.length) {
            setSelected([...sel, val]);
        }
    };

    const isFillSubmitDisabled = !canInteract || (data.type === 'fill' && (
        !textInput.trim() ||
        crossedOut.some(attempt => typeof attempt === 'string' && attempt.toLowerCase() === textInput.trim().toLowerCase())
    ));

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="animate-in fade-in zoom-in duration-300 w-full max-w-2xl">
                <div className={`relative w-full ${shake ? 'animate-shake' : ''}`}>
                    {/* Main Card with clipped progress bar */}
                    <div className={`bg-white rounded-3xl shadow-2xl w-full relative max-h-[80vh] ${isMobile ? 'mt-8' : 'lg:mt-20'} flex flex-col overflow-hidden`}>

                        {/* Sticky Header */}
                        <div className="bg-white border-b border-gray-200 flex justify-between items-center px-6 py-4 sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="bg-rose-100 p-2.5 rounded-full">
                                    <CircleQuestionMark className="w-6 h-6 text-rose-500" />
                                </div>
                                <span className="font-bold text-lg text-gray-800">Answer to Fire!</span>
                                {/* <span className="font-bold text-lg text-gray-800"><span className="text-amber-500">Gain {reward} Ammo</span> or <span className="text-pink-500">Lose 1 Brain</span></span> */}
                            </div>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="pt-10 p-8 overflow-y-auto">
                            <div className="text-center">

                                <h2 className="lg:text-xl font-bold text-gray-900 mb-10 break-words [overflow-wrap:anywhere]">{data.question}</h2>

                                {/* Media Display */}
                                {data.media && data.media.length > 0 && (
                                    <div className="flex flex-col items-center mb-10">
                                        <div className="w-full flex justify-center">
                                            <div className="rounded-xl overflow-hidden max-w-full mx-0 lg:mx-16">
                                                {data.media[currentMediaIndex].type === 'video' ? (
                                                    <video src={data.media[currentMediaIndex].url} controls className="max-h-64 max-w-full object-contain mx-auto" />
                                                ) : (
                                                    <img src={data.media[currentMediaIndex].url} alt={`Media ${currentMediaIndex + 1}`} className="max-h-64 max-w-full object-contain mx-auto" />
                                                )}
                                            </div>
                                        </div>
                                        {data.media.length > 1 && (
                                            <div className="flex w-fit justify-center items-center gap-6 mt-4 px-4 py-2 bg-gray-100 rounded-full shadow-sm">
                                                <button
                                                    onClick={() => setCurrentMediaIndex(prev => (prev - 1 + data.media.length) % data.media.length)}
                                                    className="p-2 rounded-full hover:bg-gray-200"
                                                >
                                                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                                                </button>
                                                <div className="text-sm font-bold text-gray-700">
                                                    {currentMediaIndex + 1} / {data.media.length}
                                                </div>
                                                <button
                                                    onClick={() => setCurrentMediaIndex(prev => (prev + 1) % data.media.length)}
                                                    className="p-2 rounded-full hover:bg-gray-200"
                                                >
                                                    <ChevronRight className="w-6 h-6 text-gray-600" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}



                                {data.type === 'multi' && (
                                    <div className="flex flex-col gap-2 mb-5">
                                        <p className="text-left text-sm font-semibold text-gray-500 ml-1">
                                            Select {Array.isArray(data.answer) ? data.answer.length : 'all'} answers
                                        </p>
                                        {crossedOut.length > 0 && (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-rose-500 text-sm font-bold ml-1">
                                                <span>Incorrect attempts:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {crossedOut.map((item, idx) => {
                                                        if (Array.isArray(item)) {
                                                            const letters = item.map(opt => String.fromCharCode(65 + data.options.indexOf(opt))).join(', ');
                                                            return <span key={idx} className="bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{letters}</span>;
                                                        } else {
                                                            const letterIdx = data.options.indexOf(item);
                                                            return <span key={idx} className="bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{String.fromCharCode(65 + letterIdx)}</span>;
                                                        }
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {data.type === 'fill' && (
                                    <div className="flex flex-col gap-2">
                                        {crossedOut.length > 0 && (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-rose-500 text-sm font-bold ml-1 mb-5">
                                                <span className="min-w-fit">Incorrect attempts:</span>
                                                <div className="flex gap-2 flex-wrap">
                                                    {crossedOut.map((txt, idx) => (
                                                        <span key={idx} className="bg-rose-50 px-2 py-0.5 rounded border border-rose-100 max-w-[200px] truncate">{txt}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Options */}
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
                                    {data.type === 'fill' ? (
                                        <input
                                            type="text"
                                            value={textInput}
                                            onChange={e => setTextInput(e.target.value)}
                                            disabled={!canInteract || success}
                                            className={`col-span-2 w-full p-4 border-2 rounded-xl focus:outline-none transition-colors
                                            ${success ? 'border-green-500 bg-green-50 text-green-900' : 'border-gray-200 focus:border-blue-500'}
                                        `}
                                            placeholder="Type your answer here..."
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !isFillSubmitDisabled) {
                                                    handleMultiSubmit();
                                                }
                                            }}
                                        />
                                    ) : (
                                        data.options.map((opt: string, i: number) => {
                                            const isSel = data.type === 'multi' ? (selected as string[]).includes(opt) : selected === opt;
                                            const isCrossed = crossedOut.includes(opt);

                                            // Determine if this option is part of correct answer
                                            const ans = data.answer;
                                            const isCorrectOption = Array.isArray(ans) ? ans.includes(opt) : ans === opt;
                                            const showGreen = success && isCorrectOption;

                                            const letter = String.fromCharCode(65 + i);

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        if (data.type === 'multi') toggleMulti(opt);
                                                        else handleSingleSubmit(opt);
                                                    }}
                                                    disabled={!canInteract || (data.type !== 'multi' && isCrossed) || success}
                                                    className={`group relative p-4 rounded-2xl border-2 text-left transition-all break-words [overflow-wrap:anywhere] flex items-center gap-4
                                                    ${showGreen
                                                            ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20'
                                                            : (data.type !== 'multi' && isCrossed)
                                                                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed decoration-slate-400 line-through'
                                                                : 'hover:shadow-md cursor-pointer'
                                                        }
                                                    ${!showGreen && !(data.type !== 'multi' && isCrossed) && isSel
                                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                                                            : !showGreen && !(data.type !== 'multi' && isCrossed) && 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                                                        }
                                                    ${!showGreen && !(data.type !== 'multi' && isCrossed) && error && isSel ? 'border-red-500 bg-red-50 ring-red-500/20' : ''}
                                                `}
                                                >
                                                    <div className="flex">
                                                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors
                                                    ${showGreen ? 'bg-green-500 text-white' : (data.type !== 'multi' && isCrossed) ? 'bg-gray-200 text-gray-400' : isSel ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'}
                                                `}>
                                                            {letter}
                                                        </span>
                                                    </div>
                                                    <span className={`font-medium 
                                                    ${showGreen ? 'text-green-900' : isSel ? 'text-blue-900' : 'text-gray-700'} 
                                                    ${(data.type !== 'multi' && isCrossed) ? 'text-gray-400 line-through' : ''}
                                                `}>
                                                        {opt}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {(data.type === 'multi' || data.type === 'fill') && (
                                    <button
                                        onClick={handleMultiSubmit}
                                        disabled={
                                            success ||
                                            (data.type === 'multi' && (
                                                (selected as string[]).length < (data.answer as string[]).length ||
                                                crossedOut.some(attempt => {
                                                    if (Array.isArray(attempt)) {
                                                        const s1 = [...(selected as string[])].sort().join(',');
                                                        const s2 = [...attempt].sort().join(',');
                                                        return s1 === s2;
                                                    }
                                                    return false;
                                                })
                                            )) ||
                                            isFillSubmitDisabled
                                        }
                                        className={`w-full py-4 rounded-xl text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed ${success ? 'bg-green-500' : 'bg-primary'}`}
                                    >
                                        {success ? 'Correct' : 'Submit Answer'}
                                    </button>
                                )}

                                {/* Footer Rewards */}
                                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row gap-4 justify-between items-center text-sm px-2 mt-8">
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Crosshair className="w-5 h-5" />
                                        <span className="font-semibold">+{reward} Ammo for correct answer</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-pink-500">
                                        <Brain className="w-5 h-5" />
                                        <span className="font-semibold">-1 Brain for wrong answer</span>
                                    </div>
                                </div>
                            </div>

                            {/* Closing Timer Bar */}
                            {success && (
                                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-100 overflow-hidden">
                                    <div className="h-full bg-green-500 animate-timer" />
                                </div>
                            )}
                        </div>
                        <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.3s ease-in-out; }
                
                @keyframes timer {
                    0% { width: 100%; }
                    100% { width: 0%; }
                }
                .animate-timer { 
                    animation: timer 2s linear forwards; 
                }
            `}</style>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KnowledgeModal({ data, isMobile, onClose }: { data: any, isMobile: boolean, onClose: () => void }) {
    const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
    const content = typeof data === 'string' ? data : data.content;
    const media = typeof data === 'string' ? [] : (data.media || []);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="animate-in fade-in zoom-in duration-300 w-full max-w-2xl">
                <div className="relative w-full">
                    {/* Main Card */}
                    <div className={`bg-white rounded-3xl shadow-2xl w-full relative max-h-[80vh] ${isMobile ? 'mt-8' : 'lg:mt-20'} flex flex-col overflow-hidden`}>

                        {/* Sticky Header */}
                        <div className="bg-white border-b border-gray-200 flex justify-between items-center px-6 py-4 sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-2.5 rounded-full">
                                    <Lightbulb className="w-6 h-6 text-blue-500" />
                                </div>
                                <span className="font-bold text-lg text-gray-800">Did you know?</span>
                            </div>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="pt-10 p-8 overflow-y-auto">
                            <div className="text-center">
                                {/* Media Display */}
                                {media && media.length > 0 && (
                                    <div className="flex flex-col items-center mb-8">
                                        <div className="w-full flex justify-center">
                                            <div className="rounded-xl overflow-hidden max-w-full mx-0 lg:mx-16">
                                                {media[currentMediaIndex].type === 'video' ? (
                                                    <video src={media[currentMediaIndex].url} controls className="max-h-64 max-w-full object-contain mx-auto" />
                                                ) : (
                                                    <img src={media[currentMediaIndex].url} alt={`Media ${currentMediaIndex + 1}`} className="max-h-64 max-w-full object-contain mx-auto" />
                                                )}
                                            </div>
                                        </div>
                                        {media.length > 1 && (
                                            <div className="flex w-fit justify-center items-center gap-6 mt-4 px-4 py-2 bg-gray-100 rounded-full shadow-sm">
                                                <button
                                                    onClick={() => setCurrentMediaIndex(prev => (prev - 1 + media.length) % media.length)}
                                                    className="p-2 rounded-full hover:bg-gray-200"
                                                >
                                                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                                                </button>
                                                <div className="text-sm font-bold text-gray-700">
                                                    {currentMediaIndex + 1} / {media.length}
                                                </div>
                                                <button
                                                    onClick={() => setCurrentMediaIndex(prev => (prev + 1) % media.length)}
                                                    className="p-2 rounded-full hover:bg-gray-200"
                                                >
                                                    <ChevronRight className="w-6 h-6 text-gray-600" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <p className="text-gray-600 text-lg leading-relaxed mb-10 break-words [overflow-wrap:anywhere]">{content}</p>

                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    Got it
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsModal({ settings, isMobile, onExit, onUpdate, onClose }: { settings: any, isMobile: boolean, onExit?: () => void, onUpdate: (s: any) => void, onClose: () => void }) {
    const handleValueChange = (key: string, value: number) => {
        onUpdate({ ...settings, [key]: value });
    };

    const toggleMaster = () => {
        onUpdate({ ...settings, master: !settings.master });
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="animate-in fade-in zoom-in duration-300 w-full max-w-md">
                <div className={`bg-white rounded-3xl shadow-2xl w-full relative max-h-[80vh] ${isMobile ? 'mt-8' : 'lg:mt-20'} flex flex-col overflow-hidden`}>
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 flex justify-between items-center px-6 py-4 sticky top-0 z-20">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded-xl">
                                <Settings className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="font-bold text-xl text-gray-800">Game Settings</span>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
                        {/* Master Audio */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl transition-colors ${settings.master ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {settings.master ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                                </div>
                                <div className="font-bold text-gray-900 text-sm sm:text-lg">Sound Enabled</div>
                            </div>
                            <button
                                onClick={toggleMaster}
                                className={`min-w-12 sm:min-w-14 h-6 sm:h-8 rounded-full transition-colors relative ${settings.master ? 'bg-blue-500' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full transition-transform ${settings.master ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className={`space-y-6 sm:space-y-8 transition-opacity px-2 ${!settings.master ? 'opacity-40 pointer-events-none' : ''}`}>
                            {/* Music Slider */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                            <Music className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm sm:text-base font-bold text-gray-700">Background Music</span>
                                    </div>
                                    <span className="text-sm font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{Math.round(settings.music * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={settings.music}
                                    onChange={(e) => handleValueChange('music', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>

                            {/* SFX Slider */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                            <Crosshair className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm sm:text-base font-bold text-gray-700">Sound Effects</span>
                                    </div>
                                    <span className="text-sm font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{Math.round(settings.sfx * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={settings.sfx}
                                    onChange={(e) => handleValueChange('sfx', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                                />
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-all"
                            >
                                Return to Game
                            </button>

                            {isMobile && onExit && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onExit();
                                    }}
                                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Exit Game
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}