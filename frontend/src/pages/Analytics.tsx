import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Flame, Clock, Target, Users, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AnalyticsData {
    currentStreak: number;
    longestStreak: number;
    avgStreakLength: number;
    streakBreakRate: number;
    totalXP: number;
    bestTimeOfDay: string;
    habitSuccessRate: number;
    streakHistory: Array<{ date: string; streak: number; seasonName: string }>;
    loginTimeDistribution: { [key: string]: number };
    totalSeasons: number;
    activeStreaks: number;
}

interface AdminData {
    dau: number;
    mau: number;
    totalUsers: number;
    avgStreak: number;
    longestPlatformStreak: number;
    topStreaker: string;
}

const Analytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [adminData, setAdminData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const token = localStorage.getItem('auth-token');

    useEffect(() => {
        // Check if user is admin
        try {
            const userData = localStorage.getItem('user-data');
            if (userData) {
                const user = JSON.parse(userData);
                setIsAdmin(user.role === 'admin');
            }
        } catch (e) {
            console.error('Error parsing user data', e);
        }

        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get(`${API_URL}/analytics/user`, {
                headers: { 'auth-token': token }
            });
            setAnalytics(response.data);

            // Fetch admin data if admin
            if (isAdmin) {
                try {
                    const adminResponse = await axios.get(`${API_URL}/analytics/admin`, {
                        headers: { 'auth-token': token }
                    });
                    setAdminData(adminResponse.data);
                } catch (err) {
                    console.error('Error fetching admin analytics:', err);
                }
            }

            setLoading(false);
        } catch (err: any) {
            toast.error('Failed to load analytics');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white">
                No analytics data available
            </div>
        );
    }

    // Prepare chart data
    const timeDistribution = Object.entries(analytics.loginTimeDistribution || {}).map(([time, count]) => ({
        time,
        checkins: count
    }));

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/20 p-6 md:p-8">
            {/* Background Decorations */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                        Analytics Dashboard
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Track your progress, understand your habits, and optimize your streaks
                    </p>
                </motion.div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={<Flame className="text-orange-500" />}
                        label="Current Streak"
                        value={analytics.currentStreak}
                        suffix="days"
                        gradient="from-orange-500 to-red-500"
                    />
                    <StatCard
                        icon={<Award className="text-yellow-500" />}
                        label="Longest Streak"
                        value={analytics.longestStreak}
                        suffix="days"
                        gradient="from-yellow-500 to-orange-500"
                    />
                    <StatCard
                        icon={<TrendingUp className="text-indigo-500" />}
                        label="Total XP"
                        value={analytics.totalXP}
                        suffix="XP"
                        gradient="from-indigo-500 to-purple-500"
                    />
                    <StatCard
                        icon={<Target className="text-green-500" />}
                        label="Success Rate"
                        value={Math.round(analytics.habitSuccessRate * 100)}
                        suffix="%"
                        gradient="from-green-500 to-emerald-500"
                    />
                </div>


                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Streak Progress - Radial Chart */}
                    <ChartCard title="Streak Progress" icon={<TrendingUp className="text-indigo-500" size={20} />}>
                        <div className="flex items-center justify-center h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                    </defs>
                                    <Pie
                                        data={[
                                            { name: 'Current', value: analytics.currentStreak },
                                            { name: 'To Goal', value: Math.max(analytics.longestStreak - analytics.currentStreak, 0) }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        startAngle={90}
                                        endAngle={-270}
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        <Cell fill="url(#progressGradient)" />
                                        <Cell fill="#e5e7eb" opacity={0.2} />
                                    </Pie>
                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                        <tspan x="50%" dy="-10" fontSize="32" fontWeight="bold" fill="#6366f1">
                                            {analytics.currentStreak}
                                        </tspan>
                                        <tspan x="50%" dy="30" fontSize="14" fill="#94a3b8">
                                            / {analytics.longestStreak} days
                                        </tspan>
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    {/* XP & Streak Combined Chart */}
                    {analytics.streakHistory && analytics.streakHistory.length > 0 && (
                        <ChartCard title="Performance Trend" icon={<Flame className="text-orange-500" size={20} />}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.streakHistory.slice(-10)}>
                                    <defs>
                                        <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                                    <XAxis
                                        dataKey="seasonName"
                                        stroke="#64748b"
                                        fontSize={11}
                                        angle={-15}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                                        }}
                                        cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="streak"
                                        stroke="#f97316"
                                        strokeWidth={3}
                                        dot={{ fill: '#f97316', strokeWidth: 2, r: 5, stroke: '#fff' }}
                                        activeDot={{ r: 8, fill: '#f97316', stroke: '#fff', strokeWidth: 3 }}
                                        animationDuration={1500}
                                        animationEasing="ease-in-out"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}

                    {/* Check-in Time Heatmap */}
                    <ChartCard title="Check-in Time Pattern" icon={<Clock className="text-purple-500" size={20} />}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={timeDistribution} margin={{ top: 20 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    stroke="#64748b"
                                    fontSize={12}
                                    label={{ value: 'Time of Day', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                                />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        padding: '12px'
                                    }}
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                    formatter={(value: any) => [`${value} check-ins`, 'Activity']}
                                />
                                <Bar
                                    dataKey="checkins"
                                    fill="url(#barGradient)"
                                    radius={[12, 12, 0, 0]}
                                    animationDuration={1000}
                                    animationBegin={200}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Success Rate Gauge */}
                    <ChartCard title="Success Rate" icon={<Target className="text-green-500" size={20} />}>
                        <div className="flex items-center justify-center h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        <linearGradient id="successGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#059669" />
                                        </linearGradient>
                                    </defs>
                                    <Pie
                                        data={[
                                            { name: 'Success', value: Math.round(analytics.habitSuccessRate * 100) },
                                            { name: 'Remaining', value: 100 - Math.round(analytics.habitSuccessRate * 100) }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius={90}
                                        outerRadius={130}
                                        paddingAngle={0}
                                        dataKey="value"
                                    >
                                        <Cell fill="url(#successGradient)" />
                                        <Cell fill="#e5e7eb" opacity={0.2} />
                                    </Pie>
                                    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle">
                                        <tspan x="50%" dy="0" fontSize="42" fontWeight="bold" fill="#10b981">
                                            {Math.round(analytics.habitSuccessRate * 100)}%
                                        </tspan>
                                        <tspan x="50%" dy="35" fontSize="14" fill="#94a3b8">
                                            Success Rate
                                        </tspan>
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                {/* Insights Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <InsightCard
                        icon={<Clock size={24} />}
                        title="Best Time of Day"
                        value={analytics.bestTimeOfDay}
                        description="Your most productive hour"
                        color="indigo"
                    />
                    <InsightCard
                        icon={<Calendar size={24} />}
                        title="Avg Streak Length"
                        value={`${analytics.avgStreakLength} days`}
                        description="Consistency metric"
                        color="purple"
                    />
                    <InsightCard
                        icon={<Target size={24} />}
                        title="Streak Break Rate"
                        value={`${Math.round(analytics.streakBreakRate * 100)}%`}
                        description="Room for improvement"
                        color="pink"
                    />
                </div>

                {/* Admin Section */}
                {isAdmin && adminData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white mb-8"
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Users size={28} />
                            Admin Analytics
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-white/70 text-sm mb-1">Daily Active Users</p>
                                <p className="text-3xl font-bold">{adminData.dau}</p>
                            </div>
                            <div>
                                <p className="text-white/70 text-sm mb-1">Monthly Active Users</p>
                                <p className="text-3xl font-bold">{adminData.mau}</p>
                            </div>
                            <div>
                                <p className="text-white/70 text-sm mb-1">Total Users</p>
                                <p className="text-3xl font-bold">{adminData.totalUsers}</p>
                            </div>
                            <div>
                                <p className="text-white/70 text-sm mb-1">Platform Avg Streak</p>
                                <p className="text-3xl font-bold">{adminData.avgStreak}</p>
                            </div>
                            <div>
                                <p className="text-white/70 text-sm mb-1">Longest Streak</p>
                                <p className="text-3xl font-bold">{adminData.longestPlatformStreak}</p>
                            </div>
                            <div>
                                <p className="text-white/70 text-sm mb-1">Top Streaker</p>
                                <p className="text-xl font-bold truncate">{adminData.topStreaker}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; suffix: string; gradient: string }> = ({
    icon, label, value, suffix, gradient
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg"
    >
        <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 bg-gradient-to-br ${gradient} bg-opacity-10 rounded-xl`}>
                {icon}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</p>
        </div>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {value} <span className="text-lg text-slate-500">{suffix}</span>
        </p>
    </motion.div>
);

// Chart Card Component
const ChartCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg"
    >
        <div className="flex items-center gap-2 mb-6">
            {icon}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        {children}
    </motion.div>
);

// Insight Card Component
const InsightCard: React.FC<{ icon: React.ReactNode; title: string; value: string; description: string; color: string }> = ({
    icon, title, value, description, color
}) => {
    const colorMap: any = {
        indigo: 'from-indigo-500 to-indigo-600',
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg"
        >
            <div className={`inline-block p-3 bg-gradient-to-br ${colorMap[color]} rounded-xl mb-4 text-white`}>
                {icon}
            </div>
            <h4 className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</h4>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">{description}</p>
        </motion.div>
    );
};

export default Analytics;
