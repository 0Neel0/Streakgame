import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Trash2, Bell, BellOff, CheckCircle, MessageSquare, Shield, X, UserPlus, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Notification {
    _id: string;
    type: string;
    message: string;
    data: any;
    read: boolean;
    createdAt: string;
}

const NotificationList: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const navigate = useNavigate();

    const token = localStorage.getItem('auth-token');

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const url = filter === 'unread'
                ? `${API_URL}/notifications?unreadOnly=true&limit=50`
                : `${API_URL}/notifications?limit=50`;
            const response = await axios.get(url, {
                headers: { 'auth-token': token }
            });
            setNotifications(response.data.notifications);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
            await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
                headers: { 'auth-token': token }
            });
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            await axios.put(`${API_URL}/notifications/read/all`, { all: true }, {
                headers: { 'auth-token': token }
            });
            toast.success("All marked as read");
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            await axios.delete(`${API_URL}/notifications/${notificationId}`, {
                headers: { 'auth-token': token }
            });
            toast.success("Notification removed");
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'clan_checkin':
                return <div className="p-3 bg-green-500/20 rounded-xl text-green-400 border border-green-500/20"><Check size={24} /></div>;
            case 'clan_join':
                return <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/20"><UserPlus size={24} /></div>;
            case 'clan_leave':
                return <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400 border border-orange-500/20"><LogOut size={24} /></div>;
            case 'clan_removed':
                return <div className="p-3 bg-red-500/20 rounded-xl text-red-400 border border-red-500/20"><X size={24} /></div>;
            case 'clan_announcement':
                return <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/20"><MessageSquare size={24} /></div>;
            case 'clan_ownership':
                return <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400 border border-yellow-500/20"><Shield size={24} /></div>;
            default:
                return <div className="p-3 bg-slate-700/50 rounded-xl text-slate-400 border border-slate-600/50"><Bell size={24} /></div>;
        }
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return new Date(date).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 mb-8 text-slate-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </motion.button>

                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <motion.h1
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-2"
                        >
                            Notifications
                        </motion.h1>
                        <p className="text-slate-400">Stay updated with your clan activities and rewards</p>
                    </div>

                    <div className="flex gap-2">
                        <div className="bg-slate-900/50 p-1 rounded-xl border border-slate-800 flex">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all'
                                    ? 'bg-purple-600/20 text-purple-300 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'unread'
                                    ? 'bg-purple-600/20 text-purple-300 shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Unread
                            </button>
                        </div>

                        {notifications.some(n => !n.read) && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={handleMarkAllAsRead}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
                            >
                                <CheckCircle size={16} />
                                Mark all read
                            </motion.button>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="popLayout">
                    {notifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-800"
                        >
                            <div className="w-20 h-20 bg-slate-800/80 rounded-full flex items-center justify-center mb-4">
                                <BellOff size={32} className="text-slate-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-1">No notifications found</h3>
                            <p className="text-slate-500">
                                {filter === 'unread' ? 'You are all caught up!' : 'We will let you know when something happens.'}
                            </p>
                            {filter === 'unread' && (
                                <button
                                    onClick={() => setFilter('all')}
                                    className="mt-6 text-purple-400 hover:text-purple-300 text-sm font-medium"
                                >
                                    View all history
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notif, index) => (
                                <motion.div
                                    key={notif._id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                                    className={`group relative bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border transition-all duration-300 overflow-hidden ${notif.read
                                        ? 'border-slate-800 hover:border-slate-700'
                                        : 'border-purple-500/30 bg-purple-900/10 hover:border-purple-500/50'
                                        }`}
                                >
                                    {/* Read indicator stripe */}
                                    {!notif.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500"></div>
                                    )}

                                    <div className="flex gap-5 items-start">
                                        <div className="shrink-0">
                                            {getNotificationIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-lg font-medium leading-tight ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                                                    {notif.message}
                                                </p>
                                                <span className="text-xs text-slate-500 whitespace-nowrap ml-4 font-mono">
                                                    {getTimeAgo(notif.createdAt)}
                                                </span>
                                            </div>

                                            {notif.data && notif.data.clanName && (
                                                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-slate-800/80 rounded-full text-xs font-medium text-slate-300 border border-slate-700/50">
                                                    <Shield size={12} className="text-purple-400" />
                                                    Clan: <span className="text-purple-300">{notif.data.clanName}</span>
                                                </div>
                                            )}

                                            {/* Action Buttons (Visible on hover/focus) */}
                                            <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                                {!notif.read && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif._id); }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700"
                                                    >
                                                        <Check size={14} />
                                                        Mark Read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(notif._id, e)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium transition-colors border border-red-500/10"
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NotificationList;
