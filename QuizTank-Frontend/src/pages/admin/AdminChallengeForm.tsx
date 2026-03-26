import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, ChevronUp, ChevronDown, X as CloseIcon, Check, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

const AdminChallengeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'Medium',
        game_room: [] as number[],
        xp: 100,
        status: 1,
        type_id: 1,
        start_date: undefined as Date | undefined,
    });

    const [games, setGames] = useState<any[]>([]);
    const [gamesLoading, setGamesLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const data = await adminService.getGames({ role: 'ADMIN' });
                setGames(data.filter((g: any) => g.status === 1 && g.visibility === 4));
            } catch (error) {
                console.error('Failed to load games', error);
            } finally {
                setGamesLoading(false);
            }
        };
        fetchGames();

        if (isEdit) {
            const fetchChallenge = async () => {
                try {
                    const data = await adminService.getChallenge(id!);
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        difficulty: data.difficulty || 'Medium',
                        game_room: Array.isArray(data.game_room) ? data.game_room : [],
                        xp: data.xp || 100,
                        status: data.status || 1,
                        type_id: data.type_id || 1,
                        start_date: data.start_date ? (() => {
                            const d = new Date(data.start_date);
                            // Use UTC date components to display the challenge date
                            // This aligns with the backend logic where challenges are based on UTC dates
                            return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
                        })() : undefined,
                    });
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to load challenge data');
                } finally {
                    setLoading(false);
                }
            };
            fetchChallenge();
        }
    }, [id, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'xp' || name === 'status' || name === 'type_id')
                ? parseInt(value) || 0
                : value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        const isNumeric = name === 'status' || name === 'type_id';
        const val = isNumeric ? parseInt(value) : value;

        setFormData(prev => {
            const updates: any = { [name]: val };

            // Validation logic: if switching to Weekly (2), and current date is not Sunday, reset it
            if (name === 'type_id' && val === 2 && prev.start_date) {
                if (prev.start_date.getDay() !== 0) {
                    updates.start_date = undefined; // Reset if invalid
                    toast.info('Start date reset. Weekly challenges must start on Sunday.');
                }
            }
            return {
                ...prev,
                ...updates
            };
        });
    };

    const handleGameToggle = (gameId: number) => {
        setFormData(prev => {
            const current = [...prev.game_room];
            const index = current.indexOf(gameId);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(gameId);
            }
            return { ...prev, game_room: current };
        });
    };

    const moveGame = (index: number, direction: 'up' | 'down') => {
        setFormData(prev => {
            const newOrder = [...prev.game_room];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;

            if (targetIndex >= 0 && targetIndex < newOrder.length) {
                [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
            }

            return { ...prev, game_room: newOrder };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Prepare payload with start_date shifted to UTC to ensure the day is preserved in backend
            const payload = { ...formData };
            if (formData.start_date) {
                const d = formData.start_date;
                // Create a date that corresponds to UTC midnight of the selected local date
                // e.g. Local Feb 5 00:00 -> UTC Feb 5 00:00
                const utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                payload.start_date = utcDate as any;
            }

            if (isEdit) {
                await adminService.updateChallenge(id!, payload);
                toast.success('Challenge updated successfully');
            } else {
                await adminService.createChallenge(payload);
                toast.success('Challenge created successfully');
            }

            if (!isEdit) {
                navigate('/admin/challenges');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to save challenge');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground italic">Loading challenge data...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/challenges')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isEdit ? 'Edit Challenge' : 'Create Challenge'}
                </h1>
            </div>

            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status.toString()}
                                    onValueChange={(v) => handleSelectChange('status', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Active</SelectItem>
                                        <SelectItem value="2">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="type_id">Type</Label>
                                <Select
                                    value={formData.type_id.toString()}
                                    onValueChange={(v) => handleSelectChange('type_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Daily</SelectItem>
                                        <SelectItem value="2">Weekly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 flex flex-col">
                                <Label className="mb-2">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !formData.start_date && "text-muted-foreground"
                                            )}
                                        >
                                            {formData.start_date ? (
                                                format(formData.start_date, "MMMM d, yyyy")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.start_date}
                                            onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date }))}
                                            disabled={(date) => {
                                                if (formData.type_id === 2) {
                                                    return date.getDay() !== 0;
                                                }
                                                return false;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="difficulty">Difficulty</Label>
                                <Select
                                    value={formData.difficulty}
                                    onValueChange={(v) => handleSelectChange('difficulty', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Very Easy">Very Easy</SelectItem>
                                        <SelectItem value="Easy">Easy</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Hard">Hard</SelectItem>
                                        <SelectItem value="Very Hard">Very Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="xp">XP Reward</Label>
                                <Input
                                    id="xp"
                                    name="xp"
                                    type="number"
                                    value={formData.xp}
                                    onChange={handleChange}
                                    min={0}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base font-semibold">All Game Rooms</Label>
                            <Card className="p-0 overflow-hidden border-slate-200 shadow-none">
                                <div className="h-[400px] w-full overflow-y-auto">
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {gamesLoading ? (
                                            <div className="col-span-full text-center py-8 text-muted-foreground animate-pulse">
                                                Loading available games...
                                            </div>
                                        ) : games.length === 0 ? (
                                            <div className="col-span-full text-center py-8 text-muted-foreground italic">
                                                No games found in the system.
                                            </div>
                                        ) : (
                                            games.map((game) => (
                                                <div
                                                    key={game.id}
                                                    className={cn(
                                                        "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-slate-50",
                                                        formData.game_room.includes(game.id)
                                                            ? "border-primary bg-primary/5 shadow-sm"
                                                            : "border-slate-100"
                                                    )}
                                                    onClick={() => handleGameToggle(game.id)}
                                                >
                                                    <div className={cn(
                                                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                                                        formData.game_room.includes(game.id)
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50"
                                                    )}>
                                                        {formData.game_room.includes(game.id) && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold leading-none truncate overflow-hidden max-w-[150px]">{game.name}</span>
                                                        <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">ID: {game.id}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {formData.game_room.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Selected Game Rooms</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setFormData(prev => ({ ...prev, game_room: [] }))}
                                    >
                                        Remove All
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {formData.game_room.map((id, index) => {
                                        const game = games.find(g => g.id === id);
                                        return (
                                            <div key={id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-primary/30">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-bold">{game?.name || `Game ID: ${id}`}</span>
                                                    <p className="text-[10px] text-muted-foreground uppercase">ID: {id}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-primary disabled:opacity-30"
                                                        disabled={index === 0}
                                                        onClick={() => moveGame(index, 'up')}
                                                    >
                                                        <ChevronUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-primary disabled:opacity-30"
                                                        disabled={index === formData.game_room.length - 1}
                                                        onClick={() => moveGame(index, 'down')}
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                        onClick={() => handleGameToggle(id)}
                                                    >
                                                        <CloseIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminChallengeForm;
