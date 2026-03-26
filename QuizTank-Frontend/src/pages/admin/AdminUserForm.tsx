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
import { gameService } from '@/services/gameService';
import { MediaUpload } from '@/components/games/MediaUpload';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';

interface MediaFile {
    id: string;
    url: string;
    type: "image" | "video";
    name: string;
}

const AdminUserForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'USER',
        status: 1,
        xp: 0,
        is_verified: true,
        full_name: '',
        biography: '',
        profile_pic_url: ''
    });

    const [profileImage, setProfileImage] = useState<MediaFile[]>([]);

    useEffect(() => {
        if (isEdit) {
            const fetchUser = async () => {
                try {
                    const data = await adminService.getUser(id!);
                    setFormData({
                        username: data.username || '',
                        email: data.email || '',
                        password: '', // Don't show password
                        role: data.role || 'USER',
                        status: data.status || 1,
                        xp: data.xp || 0,
                        is_verified: data.is_verified ?? true,
                        full_name: data.full_name || '',
                        biography: data.biography || '',
                        profile_pic_url: data.profile_pic_url || ''
                    });

                    if (data.profile_pic_url) {
                        setProfileImage([{
                            id: 'profile-pic',
                            url: data.profile_pic_url,
                            type: 'image',
                            name: 'profile-picture'
                        }]);
                    }
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to load user data');
                } finally {
                    setLoading(false);
                }
            };
            fetchUser();
        }
    }, [id, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'status' || name === 'xp') ? parseInt(value) : value
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

    const handleProfileImageChange = (files: MediaFile[]) => {
        setProfileImage(files);
        setFormData(prev => ({
            ...prev,
            profile_pic_url: files.length > 0 ? files[0].url : ''
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: name === 'status' ? parseInt(value) : (name === 'is_verified' ? value === 'true' : value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit) {
                const updateData = { ...formData };
                if (!updateData.password) delete (updateData as any).password;
                await adminService.updateUser(id!, updateData);
                toast.success('User updated successfully');
            } else {
                await adminService.createUser(formData);
                toast.success('User created successfully');
            }

            if (!isEdit) {
                navigate('/admin/users');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading user data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isEdit ? 'Edit User' : 'Create User'}
                </h1>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Name</Label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="Enter user's name"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="is_verified">Email Verified Status</Label>
                                <Select
                                    value={formData.is_verified.toString()}
                                    onValueChange={(v) => handleSelectChange('is_verified', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Verified</SelectItem>
                                        <SelectItem value="false">Unverified</SelectItem>
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
                                        <SelectItem value="1">Active</SelectItem>
                                        <SelectItem value="2">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(v) => handleSelectChange('role', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">User</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="biography">Biography</Label>
                                <Textarea
                                    id="biography"
                                    name="biography"
                                    value={formData.biography}
                                    onChange={handleChange}
                                    rows={7}
                                    className="resize-none"
                                    placeholder="Enter user's bio"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Profile Picture</Label>
                                <MediaUpload
                                    files={profileImage}
                                    onChange={handleProfileImageChange}
                                    maxFiles={1}
                                    accept="image/*"
                                    placeholder="Click to upload profile picture"
                                    onUpload={handleMediaUpload}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {isEdit ? 'Password (Leave blank to keep current)' : 'Password'}
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!isEdit}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
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

export default AdminUserForm;
