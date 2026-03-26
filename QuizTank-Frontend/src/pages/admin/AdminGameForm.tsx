import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { adminService } from '@/services/adminService';
import { gameService } from '@/services/gameService';
import { mapService, MapData } from '@/services/mapService';
import { MediaUpload } from '@/components/games/MediaUpload';
import { optionService } from '@/services/optionService';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface MediaFile {
    id: string;
    url: string;
    type: "image" | "video";
    name: string;
}

const AdminGameForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        language: '',
        status: 1,
        visibility: 1,
        game_code: '',
        password: '',
        tags: [] as string[],
        cover_image: '',
        duration: 3,
        enemies: 1,
        hearts: 1,
        brains: 1,
        initial_ammo: 0,
        ammo_per_correct: 1,
        map: undefined as number | undefined,
        questions: [] as any[],
        knowledges: [] as any[],
        questions_order: null as number | null,
        knowledges_order: null as number | null,
        user_id: ''
    });

    const [coverImage, setCoverImage] = useState<MediaFile[]>([]);

    const [categories, setCategories] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [maps, setMaps] = useState<MapData[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const options = await optionService.getOptions();
                const cats = options.find((o: any) => o.key === 'categories')?.value || [];
                const langs = options.find((o: any) => o.key === 'languages')?.value || [];
                setCategories(cats);
                setLanguages(langs);
            } catch (error) {
                console.error('Failed to fetch options:', error);
            }
        };

        const fetchUsers = async () => {
            try {
                const data = await adminService.getUsers();
                setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        const fetchMaps = async () => {
            try {
                const data = await mapService.getAllMaps();
                // Filter for active maps (status === 1)
                setMaps(data.filter(m => m.status === 1));
            } catch (error) {
                console.error('Failed to fetch maps:', error);
            }
        };

        fetchOptions();
        fetchUsers();
        fetchMaps();
    }, []);

    useEffect(() => {
        if (isEdit) {
            const fetchGame = async () => {
                try {
                    const data = await adminService.getGame(id!);
                    setFormData({
                        name: data.name || '',
                        description: data.description || '',
                        category: data.category || '',
                        language: data.language || 'English',
                        status: data.status || 1,
                        visibility: data.visibility || 1,
                        game_code: data.game_code || '',
                        password: data.password || '',
                        tags: Array.isArray(data.tags) ? data.tags : [],
                        cover_image: data.cover_image || '',
                        duration: data.duration || 3,
                        enemies: data.enemies || 1,
                        hearts: data.hearts || 1,
                        brains: data.brains || 1,
                        initial_ammo: data.initial_ammo !== undefined ? data.initial_ammo : 0,
                        ammo_per_correct: data.ammo_per_correct !== undefined ? data.ammo_per_correct : 1,
                        map: data.map !== undefined ? data.map : 1,
                        questions: data.questions || [],
                        knowledges: data.knowledges || [],
                        questions_order: data.questions_order !== undefined ? data.questions_order : null,
                        knowledges_order: data.knowledges_order !== undefined ? data.knowledges_order : null,
                        user_id: data.user_id?.toString() || ''
                    });

                    if (data.cover_image) {
                        setCoverImage([{
                            id: 'cover-image',
                            url: data.cover_image,
                            type: 'image',
                            name: 'cover-image'
                        }]);
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to load game data');
                } finally {
                    setLoading(false);
                }
            };
            fetchGame();
        }
    }, [id, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'game_code' ? value.toUpperCase() : value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'status' || name === 'visibility' || name === 'duration' || name === 'enemies' || name === 'hearts' || name === 'brains' || name === 'initial_ammo' || name === 'ammo_per_correct' || name === 'map' || name === 'user_id')
                ? (value === '' ? '' : parseInt(value))
                : value
        }));
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

    const handleCoverImageChange = (files: MediaFile[]) => {
        setCoverImage(files);
        setFormData(prev => ({
            ...prev,
            cover_image: files.length > 0 ? files[0].url : ''
        }));
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const handleJsonChange = (name: 'questions' | 'knowledges', value: string) => {
        try {
            const parsed = JSON.parse(value);
            setFormData(prev => ({ ...prev, [name]: parsed }));
        } catch (e) {
            // Just let it be for now, validation happens on submit if needed
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit) {
                await adminService.updateGame(id!, formData);
                toast.success('Game updated successfully');
            } else {
                await adminService.createGame(formData);
                toast.success('Game created successfully');
            }

            if (!isEdit) {
                navigate('/admin/games');
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to save game');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading game data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/games')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isEdit ? 'Edit Game' : 'Create Game'}
                </h1>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="data">Questions & Knowledges</TabsTrigger>
                                <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Game Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="user_id">User</Label>
                                        <Select
                                            value={formData.user_id?.toString()}
                                            onValueChange={(v) => handleSelectChange('user_id', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map(u => (
                                                    <SelectItem key={u.user_id} value={u.user_id.toString()}>
                                                        {u.username}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        className='resize-none'
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(v) => handleSelectChange('category', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="language">Language</Label>
                                        <Select
                                            value={formData.language}
                                            onValueChange={(v) => handleSelectChange('language', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {languages.map(lang => (
                                                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                <SelectItem value="1">Published</SelectItem>
                                                <SelectItem value="2">Draft</SelectItem>
                                                <SelectItem value="3">Deleted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="visibility">Visibility</Label>
                                        <Select
                                            value={formData.visibility.toString()}
                                            onValueChange={(v) => handleSelectChange('visibility', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Public</SelectItem>
                                                <SelectItem value="2">Private</SelectItem>
                                                <SelectItem value="3">Locked</SelectItem>
                                                <SelectItem value="4">Unlisted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="game_code">Game Code</Label>
                                        <Input
                                            id="game_code"
                                            name="game_code"
                                            value={formData.game_code}
                                            onChange={handleChange}
                                            className="font-mono uppercase"
                                            maxLength={6}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Game Room Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            minLength={4}
                                            maxLength={12}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    <div className="space-y-2">
                                        <Label>Tags</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                                placeholder="Add tag..."
                                            />
                                            <Button type="button" onClick={addTag}>Add</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {formData.tags.map(tag => (
                                                <Badge key={tag} variant="secondary" className="gap-1">
                                                    {tag}
                                                    <button type="button" onClick={() => removeTag(tag)}>
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cover_image">Cover Image</Label>
                                        <MediaUpload
                                            files={coverImage}
                                            onChange={handleCoverImageChange}
                                            maxFiles={1}
                                            accept="image/*"
                                            placeholder="Click to upload cover image"
                                            onUpload={handleMediaUpload}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="gameplay" className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duration (minutes)</Label>
                                        <Input
                                            id="duration"
                                            name="duration"
                                            type="number"
                                            value={formData.duration}
                                            onChange={handleChange}
                                            min={3}
                                            max={30}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="enemies">Enemies</Label>
                                        <Input
                                            id="enemies"
                                            name="enemies"
                                            type="number"
                                            value={formData.enemies}
                                            onChange={handleChange}
                                            min={1}
                                            max={100}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hearts">Hearts</Label>
                                        <Input
                                            id="hearts"
                                            name="hearts"
                                            type="number"
                                            value={formData.hearts}
                                            onChange={handleChange}
                                            min={1}
                                            max={100}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="brains">Brains</Label>
                                        <Input
                                            id="brains"
                                            name="brains"
                                            type="number"
                                            value={formData.brains}
                                            onChange={handleChange}
                                            min={1}
                                            max={100}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="initial_ammo">Initial Ammo</Label>
                                        <Input
                                            id="initial_ammo"
                                            name="initial_ammo"
                                            type="number"
                                            value={formData.initial_ammo}
                                            onChange={handleChange}
                                            min={0}
                                            max={100}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ammo_per_correct">Ammo Per Correct Answer</Label>
                                        <Input
                                            id="ammo_per_correct"
                                            name="ammo_per_correct"
                                            type="number"
                                            value={formData.ammo_per_correct}
                                            onChange={handleChange}
                                            min={1}
                                            max={100}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="questions_order">Question Order</Label>
                                        <Select
                                            value={formData.questions_order === 1 ? "1" : "null"}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, questions_order: v === "1" ? 1 : null }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select order" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">Random</SelectItem>
                                                <SelectItem value="1">Sequential</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="knowledges_order">Knowledge Order</Label>
                                        <Select
                                            value={formData.knowledges_order === 1 ? "1" : "null"}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, knowledges_order: v === "1" ? 1 : null }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select order" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">Random</SelectItem>
                                                <SelectItem value="1">Sequential</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="map">Map</Label>
                                        <Select
                                            value={formData.map ? formData.map.toString() : ""}
                                            onValueChange={(v) => handleSelectChange('map', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select map" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {maps.map((map) => (
                                                    <SelectItem key={map.map_id} value={map.map_id.toString()}>
                                                        {map.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="data" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="questions_json">Questions (JSON)</Label>
                                    <Textarea
                                        id="questions_json"
                                        className="font-mono text-xs"
                                        rows={12}
                                        value={JSON.stringify(formData.questions, null, 2)}
                                        onChange={(e) => handleJsonChange('questions', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="knowledges_json">Knowledges (JSON)</Label>
                                    <Textarea
                                        id="knowledges_json"
                                        className="font-mono text-xs"
                                        rows={8}
                                        value={JSON.stringify(formData.knowledges, null, 2)}
                                        onChange={(e) => handleJsonChange('knowledges', e.target.value)}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div >
    );
};

export default AdminGameForm;
