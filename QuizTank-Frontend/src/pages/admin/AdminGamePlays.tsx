import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const AdminGamePlays = () => {
    const [plays, setPlays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPlays = async () => {
        setLoading(true);
        try {
            const data = await adminService.getGamePlays();
            setPlays(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load game plays');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlays();
    }, []);

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <Badge variant="outline" className="bg-blue-500 text-white border-0">Playing</Badge>;
            case 2: return <Badge variant="outline" className="bg-green-500 text-white border-0">Passed</Badge>;
            case 3: return <Badge variant="outline" className="bg-red-500 text-white border-0">Failed</Badge>;
            case 4: return <Badge variant="outline" className="bg-gray-500 text-white border-0">Canceled</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const formatDuration = (seconds: number | null) => {
        if (seconds === null) return '-';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    if (loading) return <div className="p-8 text-center italic text-muted-foreground">Loading game plays...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Plays</h1>
                <p className="text-muted-foreground mt-2">View real-time history of game sessions.</p>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Game ID</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Played At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plays.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                                    No game plays recorded yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            plays.map((play) => (
                                <TableRow key={play.id}>
                                    <TableCell className="font-medium">{play.id}</TableCell>
                                    <TableCell>{play.game_room_id}</TableCell>
                                    <TableCell>{play.username || 'Unknown'}</TableCell>
                                    <TableCell>{getStatusBadge(play.status)}</TableCell>
                                    <TableCell>{formatDuration(play.completion_time)}</TableCell>
                                    <TableCell>{new Date(play.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminGamePlays;
