import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mapService, MapData } from '@/services/mapService';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminMaps = () => {
    const navigate = useNavigate();
    const [maps, setMaps] = useState<MapData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMaps = async () => {
        try {
            const data = await mapService.getAllMaps();
            setMaps(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load maps');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaps();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await mapService.deleteMap(id);
            toast.success('Map deleted successfully');
            fetchMaps();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete map');
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <Badge variant="outline" className="bg-green-500 text-white border-0">Active</Badge>;
            case 2: return <Badge variant="outline" className="bg-red-500 text-white border-0">Inactive</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Maps</h1>
                    <p className="text-muted-foreground mt-2">Manage game maps and environments.</p>
                </div>
                <Button onClick={() => navigate('/admin/maps/create')}>
                    <Plus className="h-4 w-4 mr-2" /> Add Map
                </Button>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Loading maps...
                                </TableCell>
                            </TableRow>
                        ) : maps.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No maps found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            maps.map((map) => (
                                <TableRow key={map.map_id}>
                                    <TableCell className="font-medium">{map.map_id}</TableCell>
                                    <TableCell>
                                        {map.image_url ? (
                                            <img src={map.image_url} alt={map.name} className="w-16 h-10 object-cover rounded-md bg-muted" />
                                        ) : (
                                            <div className="w-16 h-10 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">No img</div>
                                        )}
                                    </TableCell>
                                    <TableCell>{map.name}</TableCell>
                                    <TableCell>{getStatusBadge(map.status)}</TableCell>
                                    <TableCell>
                                        {map.created_at ? new Date(map.created_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/maps/${map.map_id}/edit`)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminMaps;
