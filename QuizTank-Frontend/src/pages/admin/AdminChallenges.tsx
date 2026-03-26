import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const AdminChallenges = () => {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChallenges = async () => {
        setLoading(true);
        try {
            const data = await adminService.getChallenges();
            setChallenges(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load challenges');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <Badge variant="outline" className="bg-green-500 text-white border-0">Active</Badge>;
            case 2: return <Badge variant="outline" className="bg-red-500 text-white border-0">Inactive</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    if (loading) return <div className="p-8 text-center italic text-muted-foreground">Loading challenges...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Challenges</h1>
                    <p className="text-muted-foreground mt-2">Manage daily and weekly challenges.</p>
                </div>
                <Button onClick={() => navigate('/admin/challenges/create')}>
                    <Plus className="h-4 w-4 mr-2" /> Add Challenge
                </Button>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Difficulty</TableHead>
                            <TableHead>XP</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {challenges.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">
                                    No challenges found. Create one to get started!
                                </TableCell>
                            </TableRow>
                        ) : (
                            challenges.map((challenge) => (
                                <TableRow key={challenge.challenge_id}>
                                    <TableCell className="font-medium">{challenge.challenge_id}</TableCell>
                                    <TableCell className="max-w-[200px] truncate font-semibold" title={challenge.title}>
                                        {challenge.title}
                                    </TableCell>
                                    <TableCell>{challenge.type_id === 1 ? 'Daily' : 'Weekly'}</TableCell>
                                    <TableCell>{challenge.difficulty}</TableCell>
                                    <TableCell>{challenge.xp}</TableCell>
                                    <TableCell>{getStatusBadge(challenge.status)}</TableCell>
                                    <TableCell>{new Date(challenge.start_date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" onClick={() => window.open(`/challenge/${challenge.challenge_id}`, '_blank')}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/challenges/${challenge.challenge_id}/edit`)}>
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

export default AdminChallenges;
