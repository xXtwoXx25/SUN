import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await adminService.getUsers();
                setUsers(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 1: return <Badge variant="outline" className="bg-green-500 text-white border-0">Active</Badge>;
            case 2: return <Badge variant="outline" className="bg-red-500 text-white border-0">Inactive</Badge>;
            default: return <Badge variant="outline">Unknown</Badge>;
        }
    };

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-2">Manage platform users.</p>
                </div>
                <Button onClick={() => navigate('/admin/users/create')}>
                    <Plus className="h-4 w-4" /> Add User
                </Button>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.user_id}>
                                <TableCell className="font-medium">{user.user_id}</TableCell>
                                <TableCell className="truncate overflow-hidden max-w-[200px]">{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{getStatusBadge(user.status)}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.is_verified ? 'Yes' : 'No'}</TableCell>
                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-center">
                                    <Button variant="ghost" size="icon" onClick={() => window.open(`/user/${user.username}`, '_blank')}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/users/${user.user_id}/edit`)}>
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

export default AdminUsers;
