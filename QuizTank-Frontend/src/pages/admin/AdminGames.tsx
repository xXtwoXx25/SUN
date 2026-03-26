import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const AdminGames = () => {
    const navigate = useNavigate();
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const data = await adminService.getGames();
                setGames(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load games');
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, []);

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <Badge variant="outline" className="bg-green-500 text-white border-0">Published</Badge>;
            case 2: return <Badge variant="outline" className="bg-gray-500 text-white border-0">Draft</Badge>;
            case 3: return <Badge variant="outline" className="bg-red-500 text-white border-0">Deleted</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    if (loading) return <div>Loading games...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Games</h1>
                    <p className="text-muted-foreground mt-2">Manage all games and quizzes.</p>
                </div>
                <Button onClick={() => navigate('/admin/games/create')}>
                    <Plus className="h-4 w-4" /> Add Game
                </Button>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {games.map((game) => (
                            <TableRow key={game.id}>
                                <TableCell className="font-medium">{game.id}</TableCell>
                                <TableCell className="truncate overflow-hidden max-w-[200px]">{game.name}</TableCell>
                                <TableCell>{getStatusBadge(game.status)}</TableCell>
                                <TableCell>{game.creator_name}</TableCell>
                                <TableCell>{game.game_code}</TableCell>
                                <TableCell>
                                    {
                                        game.visibility === 1 ? 'Public' : (
                                            game.visibility === 2 ? 'Private' : (
                                                game.visibility === 3 ? 'Locked' : (
                                                    game.visibility === 4 ? 'Unlisted' : 'Unknown')
                                            ))
                                    }
                                </TableCell>
                                <TableCell>{new Date(game.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" onClick={() => window.open(`/game/${game.game_code}`, '_blank')}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/games/${game.id}/edit`)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminGames;
