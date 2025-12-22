import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, MessageSquare, Shield, UserPlus, LogOut, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Notification {
    _id: string;
    type: string;
    message: string;
    data: any;
    read: boolean;
    createdAt: string;
}

interface NotificationBellProps {
    token: string | null;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ token }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchNotifications();
            fetchUnreadCount();
        }

        // Auto-refresh every minute
        const interval = setInterval(() => {
            if (token) {
                fetchUnreadCount();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [token]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications?limit=5`, {
                headers: { 'auth-token': token }
            });
            setNotifications(response.data.notifications);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications/unread/count`, {
                headers: { 'auth-token': token }
            });
            setUnreadCount(response.data.count);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    const handleMarkAsRead = async (notificationId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
                headers: { 'auth-token': token }
            });
            // Background refresh to sync perfectly
            fetchUnreadCount();
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleViewAll = () => {
        setShowDropdown(false);
        navigate('/notifications');
    };

    const handleNotificationClick = (notif: Notification) => {
        if (!notif.read) {
            handleMarkAsRead(notif._id);
        }

        // Navigate based on type
        if (notif.type.includes('clan') && notif.data?.clanId) {
            navigate(`/clan/${notif.data.clanId}`);
            setShowDropdown(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'clan_checkin':
                return <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Check size={18} /></div>;
            case 'clan_join':
                return <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><UserPlus size={18} /></div>;
            case 'clan_leave':
                return <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><LogOut size={18} /></div>;
            case 'clan_removed':
                return <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><X size={18} /></div>;
            case 'clan_announcement':
                return <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><MessageSquare size={18} /></div>;
            case 'clan_ownership':
                return <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400"><Shield size={18} /></div>;
            default:
                return <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"><Info size={18} /></div>;
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
        if (diffHours < 24) return `${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setShowDropdown(!showDropdown);
                    if (!showDropdown) fetchNotifications();
                }}
                className="relative p-2.5 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl transition-all border border-slate-200 dark:border-slate-700/50 hover:border-purple-500/30 group"
            >
                <Bell size={22} className={`text-slate-600 dark:text-slate-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors ${unreadCount > 0 ? 'animate-swing' : ''}`} />

                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-slate-900 shadow-lg"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden z-50 ring-1 ring-black/5"
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-500/20">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h3>
                            <button
                                onClick={handleViewAll}
                                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
                            >
                                View All
                            </button>
                        </div>

                        <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                                        <Bell size={24} />
                                    </div>
                                    <p className="text-slate-500 text-sm">All caught up! No new notifications.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {notifications.map((notif) => (
                                        <motion.div
                                            key={notif._id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors relative group ${!notif.read ? 'bg-purple-50 dark:bg-purple-900/10' : ''}`}
                                        >
                                            <div className="flex gap-3.5">
                                                <div className="shrink-0 mt-0.5">
                                                    {getNotificationIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm leading-snug mb-1 ${!notif.read ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        {getTimeAgo(notif.createdAt)}
                                                    </p>
                                                </div>
                                                {!notif.read && (
                                                    <div className="shrink-0 self-center">
                                                        <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                                    </div>
                                                )}

                                                {/* Hover actions */}
                                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    {!notif.read && (
                                                        <button
                                                            onClick={(e) => handleMarkAsRead(notif._id, e)}
                                                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                                                            title="Mark as read"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-center">
                            <button
                                onClick={handleViewAll}
                                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto w-full py-1"
                            >
                                See full history
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
