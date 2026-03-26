import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { mapService, MapData } from '@/services/mapService';
import { toast } from 'sonner';
import { ArrowLeft, Eraser, Info, Save } from 'lucide-react';
import { MediaUpload } from "@/components/games/MediaUpload";
import { gameService } from "@/services/gameService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaFile {
    id: string;
    url: string;
    type: "image" | "video";
    name: string;
}

const W = 22;
const H = 22;

const TILE_TYPES = [
    { id: 0, name: 'Empty', color: '#f8fafc', border: '#e2e8f0' },
    { id: 1, name: 'Brick', color: '#ea580c', border: '#c2410c' }, // orange-600
    { id: 2, name: 'Steel', color: '#64748b', border: '#475569' }, // slate-500
    { id: 3, name: 'Water', color: '#0ea5e9', border: '#0284c7' }, // sky-500
    { id: 4, name: 'Tree', color: '#16a34a', border: '#15803d' },  // green-600
    { id: 9, name: 'Spawn', color: '#fbbf24', border: '#f0b100' },  // amber-400 (Spawn)
];

const AdminMapForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<MapData>>({
        name: '',
        description: '',
        image_url: '',
        status: 1, // Default to 1 (active)
        data: Array(W * H).fill(0)
    });

    const [coverImage, setCoverImage] = useState<MediaFile[]>([]);

    // Editor State
    const [grid, setGrid] = useState<number[]>(Array(W * H).fill(0));
    const [selectedTile, setSelectedTile] = useState(1);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (isEditMode && id) {
            const fetchMap = async () => {
                try {
                    setLoading(true);
                    const data = await mapService.getMapById(parseInt(id));
                    setFormData(data);

                    if (data.data && Array.isArray(data.data) && data.data.length === W * H) {
                        setGrid(data.data);
                    } else if (data.data) {
                        // Handle potential migration or partial data?
                        // For now assume format is correct or default to empty
                        // console.log("Loaded data length mismatch", data.data.length);
                        // Try to pad or slice?
                        // setGrid(data.data);
                    }

                    if (data.image_url) {
                        setCoverImage([{
                            id: 'cover',
                            url: data.image_url,
                            type: 'image',
                            name: 'cover'
                        }]);
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to load map details');
                    navigate('/admin/maps');
                } finally {
                    setLoading(false);
                }
            };
            fetchMap();
        }
    }, [isEditMode, id, navigate]);

    useEffect(() => {
        if (coverImage.length > 0) {
            setFormData(prev => ({ ...prev, image_url: coverImage[0].url }));
        } else {
            setFormData(prev => ({ ...prev, image_url: '' }));
        }
    }, [coverImage]);

    // Sync grid to formData
    useEffect(() => {
        setFormData(prev => ({ ...prev, data: grid }));
    }, [grid]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMediaUpload = async (file: File) => {
        try {
            const data = await gameService.uploadMedia(file);
            if (data.success && data.url) {
                return data.url;
            }
            throw new Error("Invalid response from server");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload media");
            throw error;
        }
    };

    const handleStatusChange = (value: string) => {
        setFormData(prev => ({ ...prev, status: parseInt(value) }));
    };

    const handleGridDraw = (index: number) => {
        setGrid(prevGrid => {
            const newGrid = [...prevGrid];

            // If placing a Spawn point (9), remove existing one
            if (selectedTile === 9) {
                for (let i = 0; i < newGrid.length; i++) {
                    if (newGrid[i] === 9) newGrid[i] = 0;
                }
            }

            newGrid[index] = selectedTile;
            return newGrid;
        });
    };

    const handleMouseDown = (index: number) => {
        setIsDrawing(true);
        handleGridDraw(index);
    };

    const handleMouseEnter = (index: number) => {
        if (isDrawing) {
            handleGridDraw(index);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const clearGrid = () => {
        if (confirm("Are you sure you want to clear the map?")) {
            setGrid(Array(W * H).fill(0));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Map name is required');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                data: grid
            };

            if (isEditMode && id) {
                await mapService.updateMap(parseInt(id), payload);
                toast.success('Map updated successfully');
            } else {
                await mapService.createMap(payload);
                toast.success('Map created successfully');
            }

            if (!isEditMode) {
                navigate('/admin/maps');
            }
        } catch (error) {
            console.error(error);
            toast.error(isEditMode ? 'Failed to update map' : 'Failed to create map');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) {
        return <div className="p-8 text-center text-muted-foreground">Loading map details...</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/maps')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditMode ? 'Edit Map' : 'Create Map'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="settings" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="settings">General</TabsTrigger>
                        <TabsTrigger value="editor">Design</TabsTrigger>
                    </TabsList>

                    <TabsContent value="editor" className="pt-4 space-y-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Palette */}
                                    <div className="w-full md:w-48 flex flex-col gap-4">
                                        <div className="font-medium text-lg">Material</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {TILE_TYPES.map(tile => (
                                                <button
                                                    key={tile.id}
                                                    type="button"
                                                    onClick={() => setSelectedTile(tile.id)}
                                                    className={`
                                                        h-20 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all
                                                        ${selectedTile === tile.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}
                                                    `}
                                                    style={{ backgroundColor: tile.id === 0 ? '#fff' : 'transparent' }}
                                                >
                                                    <div
                                                        className="w-8 h-8 rounded border shadow-sm"
                                                        style={{ backgroundColor: tile.color, borderColor: tile.border }}
                                                    />
                                                    <span className="text-xs font-medium">{tile.name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="pt-4 border-t">
                                            <Button
                                                variant="outline"
                                                onClick={clearGrid}
                                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                                type="button"
                                            >
                                                <Eraser className="w-4 h-4 mr-2" />
                                                Clear Map
                                            </Button>
                                        </div>

                                        <div className="text-xs text-muted-foreground mt-4">
                                            <div className="flex items-start gap-2">
                                                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                                <p>Click and drag on the grid to paint tiles. Use "Empty" to erase.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grid */}
                                    <div className="flex-1 overflow-auto flex justify-center bg-slate-100 p-8 rounded-xl border inner-shadow">
                                        <div
                                            className="grid shadow-xl bg-white"
                                            style={{
                                                gridTemplateColumns: `repeat(${W}, 24px)`,
                                                gridTemplateRows: `repeat(${H}, 24px)`,
                                                width: 'fit-content',
                                                border: '1px solid #cbd5e1'
                                            }}
                                        >
                                            {grid.map((cell, i) => {
                                                const tile = TILE_TYPES.find(t => t.id === cell) || TILE_TYPES[0];
                                                return (
                                                    <div
                                                        key={i}
                                                        onMouseDown={() => handleMouseDown(i)}
                                                        onMouseEnter={() => handleMouseEnter(i)}
                                                        className="w-6 h-6 border-[0.5px] border-slate-200"
                                                        style={{
                                                            backgroundColor: tile.color,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="pt-4 space-y-4">
                        <Card>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description || ''}
                                        onChange={handleChange}
                                        className="min-h-[100px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="image_url">Cover Image</Label>
                                    <MediaUpload
                                        files={coverImage}
                                        onChange={setCoverImage}
                                        maxFiles={1}
                                        accept="image/*"
                                        placeholder="Click to upload cover image"
                                        onUpload={handleMediaUpload}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={String(formData.status)}
                                        onValueChange={handleStatusChange}
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
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading}>
                        Save
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AdminMapForm;
