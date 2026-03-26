import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Gamepad2, Flag, Activity } from 'lucide-react';
import api from '@/services/api';

const AdminDashboard = () => {
    const [statsData, setStatsData] = useState({
        totalUsers: 0,
        totalGames: 0,
        totalReports: 0,
        totalChallenges: 0,
        totalPlays: 0,
        totalMaps: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/stats');
                setStatsData(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    // Stats config
    const stats = [
        { title: "Total Users", value: statsData.totalUsers.toLocaleString() },
        { title: "Total Games", value: statsData.totalGames.toLocaleString() },
        { title: "Total Plays", value: statsData.totalPlays.toLocaleString() },
        { title: "Total Challenges", value: statsData.totalChallenges.toLocaleString() },
        { title: "Total Reports", value: statsData.totalReports.toLocaleString() },
        { title: "Total Maps", value: statsData.totalMaps.toLocaleString() }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">Overview of platform activity and statistics.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {stats.map((stat, i) => (
                    <Card key={i} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
