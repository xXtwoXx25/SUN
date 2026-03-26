import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const AdminReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await adminService.getReports();
                setReports(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load reports');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <Badge variant="outline" className="bg-yellow-500 text-white border-0">Pending</Badge>;
            case 2: return <Badge variant="outline" className="bg-green-500 text-white border-0">Reviewed</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    if (loading) return <div>Loading reports...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-2">Manage user reports and content moderation.</p>
                </div>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Game ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6">No reports found</TableCell>
                            </TableRow>
                        )}
                        {reports.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.id}</TableCell>
                                <TableCell>{report.game_room_id}</TableCell>
                                <TableCell>{getStatusBadge(report.status)}</TableCell>
                                <TableCell className="truncate overflow-hidden max-w-[200px]">{report.reason}</TableCell>
                                <TableCell>{report.reporter_name}</TableCell>
                                <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/reports/${report.id}/edit`)}>
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

export default AdminReports;
