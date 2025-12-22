import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Flame, Calendar, Trophy, LogOut, X, Shield, User, UserCheck, Crown, ArrowRight, Zap, Star, Clock, Search, Gift, MessageSquare, Send, Users } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { getSeasonTheme } from '../utils/theme';
import toast from 'react-hot-toast';

import ProfileModal from '../components/ProfileModal';
import Leaderboard from '../components/Leaderboard';
import SpinWheel from '../components/SpinWheel';
import RiskMeter from '../components/RiskMeter';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15
        }
    }
};

interface RoyalPassCardProps {
    pass: any;
    user: any;
    refreshUser: () => Promise<void>;
}

const RoyalPassCard: React.FC<RoyalPassCardProps> = ({ pass, user, refreshUser }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isRenewable, setIsRenewable] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const qualifyingSeasons = user.seasonStreaks?.filter((s: any) => s.streak >= pass.minStreak).length || 0;
            const isEligible = qualifyingSeasons >= pass.minSeasons;

            // Check if THIS specific pass is claimed
            const claimedPass = user.claimedRoyalPasses?.find((p: any) => p.passId === pass._id);
            // Legacy Fallback (only if no claimedRoyalPasses array or empty, and hasClaimedRoyalPass is true - strictly specific to the "legacy" pass concept if we wanted, but better to just ignore legacy for specific named passes)
            // Actually, we should probably ignore legacy hasClaimedRoyalPass for new specific passes to be clean.

            if (claimedPass) {
                const lastClaim = new Date(claimedPass.claimDate);
                const now = new Date();
                const renewalDate = new Date(lastClaim.getTime() + (10 * 24 * 60 * 60 * 1000)); // +10 days
                const diffTime = renewalDate.getTime() - now.getTime();

                if (diffTime <= 0) {
                    setIsRenewable(true);
                    setTimeLeft('');
                } else {
                    setIsRenewable(false);
                    const d = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const h = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((diffTime % (1000 * 60)) / 1000);
                    setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
                }
            } else if (isEligible) {
                // Not claimed, but eligible
                setIsRenewable(true);
            } else {
                // Not eligible
                setIsRenewable(false);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [user, pass]);

    const handleClaimPass = async () => {
        try {
            const res = await api.post('/auth/claim-royal-pass', { passId: pass._id });
            if (res.data.success) {
                // Removed popup, logic handled by refreshUser triggering CountUp
                toast.success(res.data.message || `Pass Claimed! +${res.data.xpGained} XP`);
                await refreshUser();
            }
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to claim');
        }
    };

    const qualifyingSeasons = user.seasonStreaks?.filter((s: any) => s.streak >= pass.minStreak).length || 0;
    const isEligible = qualifyingSeasons >= pass.minSeasons;
    const isClaimed = user.claimedRoyalPasses?.some((p: any) => p.passId === pass._id);

    return (
        <div className="relative group w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass-panel bg-white/80 dark:bg-slate-900 rounded-2xl p-6 md:p-8 overflow-hidden h-full flex flex-col justify-between transition-colors duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 w-full text-slate-900 dark:text-white">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-300 to-yellow-600 rounded-2xl transform rotate-3 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                            <Crown size={40} className="text-white fill-white/20" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{pass.name}</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-xs text-sm">{pass.description || `Unlock by maintaining ${pass.minStreak}+ day streaks in ${pass.minSeasons} seasons.`}</p>
                            <div className="mt-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded inline-block">
                                Reward: {pass.xpReward} XP
                            </div>
                        </div>
                    </div>

                    {/* Logic Branching */}
                    {isClaimed && !isRenewable ? (
                        <div className="flex flex-col items-center min-w-[140px]">
                            <div className="bg-yellow-500/20 text-yellow-400 px-6 py-2 rounded-full font-bold border border-yellow-500/50 flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                <Crown size={18} className="fill-current" />
                                Active
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-slate-400">
                                <Clock size={14} />
                                <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
                                    {timeLeft}
                                </span>
                            </div>
                        </div>
                    ) : (isEligible || isRenewable) ? (
                        <button
                            onClick={handleClaimPass}
                            className="bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 min-w-[170px] justify-center"
                        >
                            <Crown size={20} className="fill-current" />
                            {isClaimed ? 'Renew Pass' : 'Claim Pass'}
                        </button>
                    ) : (
                        <div className="text-center bg-slate-800/50 p-4 rounded-xl border border-white/5 min-w-[140px]">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Progress</div>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-3xl font-black text-white">{qualifyingSeasons}</span>
                                <span className="text-sm text-slate-500 font-bold">/ {pass.minSeasons}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                Needs {pass.minStreak} day streaks
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CountUp = ({ value }: { value: number }) => {
    const motionValue = useMotionValue(value);
    const rounded = useTransform(motionValue, latest => Math.round(latest));

    useEffect(() => {
        const controls = animate(motionValue, value, { duration: 1.5, ease: "easeOut" });
        return () => controls.stop();
    }, [value, motionValue]);

    return <motion.span>{rounded}</motion.span>;
};

const Dashboard: React.FC = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [activeSeasons, setActiveSeasons] = useState<any[]>([]);
    const [royalPasses, setRoyalPasses] = useState<any[]>([]);

    // Modal State
    const [selectedSeason, setSelectedSeason] = useState<any>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [checkInMessage, setCheckInMessage] = useState('');
    const [checkingIn, setCheckingIn] = useState(false);

    // XP Data
    // XP Data
    // const [xpReward, setXpReward] = useState(0); 
    // const [showXPPopup, setShowXPPopup] = useState(false);
    // (Used to be here, now removed for CountUp animation)

    // Friend System State
    const [showFriendsModal, setShowFriendsModal] = useState(false);
    const [friendTab, setFriendTab] = useState<'search' | 'requests' | 'friends'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [friendRequests, setFriendRequests] = useState<any[]>([]);
    const [myFriends, setMyFriends] = useState<any[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(false);

    // XP Transfer State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferTarget, setTransferTarget] = useState<any>(null);
    const [transferAmount, setTransferAmount] = useState<string>('');
    const [transferLoading, setTransferLoading] = useState(false);

    // Chat State
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatFriend, setChatFriend] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
    const [riskAnalysis, setRiskAnalysis] = useState<any>(null);

    // Poll for unread counts globally
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                if (user) {
                    const res = await api.get('/chat/unread');
                    // Convert array [{_id, count}] to map {id: count}
                    const counts: any = {};
                    res.data.forEach((c: any) => counts[c._id] = c.count);
                    setUnreadCounts(counts);
                }
            } catch (err) {
                console.error("Unread poll error", err);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    }, [user, showChatModal]); // Re-fetch when chat modal state changes (opening/closing might affect reads)

    useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const endpoint = user?.role === 'admin' ? '/admin/seasons' : '/season/active';
                const res = await api.get(endpoint);
                setActiveSeasons(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        const fetchRoyalPasses = async () => {
            try {
                if (user?.role !== 'admin') {
                    const res = await api.get('/auth/royal-passes');
                    setRoyalPasses(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch RP", err);
            }
        };

        const fetchRisk = async () => {
            if (user?.role !== 'admin') {
                try {
                    const res = await api.get('/risk/status');
                    setRiskAnalysis(res.data);
                } catch (err) {
                    console.error("Risk fetch failed", err);
                }
            }
        };

        fetchSeasons();
        fetchRoyalPasses();
        fetchRisk();
    }, [user?.role]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSeasonClick = (season: any) => {
        if (user?.role === 'admin') {
            navigate(`/season/${season._id}`);
        } else {
            // User: Open Login Modal
            setSelectedSeason(season);
            setShowLoginModal(true);
            setCheckInMessage('');
        }
    };

    const handleCheckInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCheckingIn(true);
        setCheckInMessage('');

        try {
            // Check-in directly
            const res = await api.post(`/season/${selectedSeason._id}/checkin`, {});

            // Success Feedback
            setCheckInMessage(res.data.message || 'Checked in successfully!');

            // Check XP (From Season Check-in)
            const seasonXp = res.data.xpGained || 0;

            if (seasonXp > 0) {
                // Removed popup, logic handled by refreshUser triggering CountUp
                toast.success(`+${seasonXp} XP!`);
            }

            // Update Streak Data (refresh user context)
            await refreshUser();

            // Close after delay
            setTimeout(() => {
                setShowLoginModal(false);
            }, 1500);

        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data;
            setCheckInMessage(typeof msg === 'string' ? msg : 'Check-in failed.');
        } finally {
            setCheckingIn(false);
        }
    };

    const searchUsers = async () => {
        if (!searchQuery.trim()) return;
        setLoadingFriends(true);
        try {
            const res = await api.get(`/friends/search?query=${searchQuery}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Search failed");
        } finally {
            setLoadingFriends(false);
        }
    };

    const fetchFriendRequests = async () => {
        try {
            const res = await api.get('/friends/requests');
            setFriendRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFriends = async () => {
        try {
            const res = await api.get('/friends/list');
            setMyFriends(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (showFriendsModal) {
            if (friendTab === 'requests') fetchFriendRequests();
            if (friendTab === 'friends') fetchFriends();
        }
    }, [showFriendsModal, friendTab]);

    const handleSendRequest = async (userId: string) => {
        try {
            await api.post('/friends/request', { targetUserId: userId });
            toast.success("Request sent!");
            searchUsers(); // Refresh component state
        } catch (err: any) {
            toast.error(err.response?.data || "Failed to send");
        }
    };

    const handleCancelRequest = async (userId: string) => {
        try {
            await api.post('/friends/cancel', { targetUserId: userId });
            toast.success("Request canceled");
            searchUsers();
        } catch (err: any) {
            toast.error(err.response?.data || "Failed to cancel");
        }
    };

    const handleAcceptRequest = async (requesterId: string) => {
        try {
            await api.post('/friends/accept', { requesterId: requesterId });
            toast.success("Friend added!");
            fetchFriendRequests();
        } catch (err: any) {
            toast.error(err.response?.data || "Failed to accept");
        }
    };

    const handleRejectRequest = async (requesterId: string) => {
        try {
            await api.post('/friends/reject', { requesterId: requesterId });
            toast.success("Request rejected");
            fetchFriendRequests();
        } catch (err: any) {
            toast.error(err.response?.data || "Failed to reject");
        }
    };

    const openTransferModal = (friend: any) => {
        setTransferTarget(friend);
        setTransferAmount('');
        setShowTransferModal(true);
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferTarget || !transferAmount) return;

        const amount = parseInt(transferAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (amount > (user?.xp || 0)) {
            toast.error("Insufficient XP balance");
            return;
        }

        setTransferLoading(true);
        try {
            await api.post('/friends/transfer', {
                targetUserId: transferTarget._id,
                amount: amount
            });

            toast.success(`Sent ${amount} XP to ${transferTarget.username}!`);
            setShowTransferModal(false);
            setTransferTarget(null);
            setTransferAmount('');

            // Refresh data
            await refreshUser(); // Updates my XP
            fetchFriends(); // Updates friend's XP if visible

        } catch (err: any) {
            toast.error(err.response?.data || "Transfer failed");
        } finally {
            setTransferLoading(false);
        }
    };

    // --- Chat Logic ---
    const openChat = (friend: any) => {
        setChatFriend(friend);
        setMessages([]);
        setNewMessage('');
        setShowChatModal(true);
        fetchMessages(friend._id);
    };

    const fetchMessages = async (friendId: string) => {
        setIsChatLoading(true);
        try {
            const res = await api.get(`/chat/history/${friendId}`);
            setMessages(res.data);

            // Mark as read
            await api.post('/chat/read', { friendId });

            // Update local unread state immediately
            setUnreadCounts(prev => ({ ...prev, [friendId]: 0 }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Poll for messages when chat is open
    useEffect(() => {
        let interval: any;
        if (showChatModal && chatFriend) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/chat/history/${chatFriend._id}`);
                    // Only update if length differs to avoid jitter, or deep compare if needed. 
                    // For now, simple length check or just replacing is fine for small chats.
                    // Ideally we should check IDs.
                    // Let's just set it for simplicity, React handles diffing DOM.
                    setMessages(res.data);
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 3000); // Poll every 3 seconds
        }
        return () => clearInterval(interval);
    }, [showChatModal, chatFriend]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatFriend) return;

        try {
            // Optimistic UI could go here
            const res = await api.post('/chat/send', {
                recipientId: chatFriend._id,
                content: newMessage
            });

            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
        } catch (err: any) {
            toast.error("Failed to send");
        }
    };


    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8 relative overflow-x-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-300">
            {/* <XPPopup /> removed */}
            <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

            {/* XP Transfer Modal */}
            <AnimatePresence>
                {showTransferModal && transferTarget && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6 mt-2">
                                <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-indigo-500/10">
                                    <Gift size={28} className="text-indigo-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Gift XP</h2>
                                <p className="text-slate-400 text-xs">
                                    Send XP to <span className="text-white font-bold">{transferTarget.username}</span>
                                </p>
                            </div>

                            <form onSubmit={handleTransferSubmit} className="space-y-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2">Amount to Send</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={transferAmount}
                                            onChange={(e) => setTransferAmount(e.target.value)}
                                            className="bg-transparent text-center text-3xl font-black text-white w-32 focus:outline-none placeholder:text-slate-700"
                                            placeholder="0"
                                            min="1"
                                            max={user?.xp || 0}
                                            autoFocus
                                        />
                                        <span className="text-indigo-400 font-bold ml-1">XP</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-2">
                                        Your Balance: <span className="text-white font-bold">{user?.xp || 0} XP</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={transferLoading || !transferAmount}
                                    className="btn-primary w-full flex justify-center items-center gap-2 py-3 text-base bg-indigo-600 hover:bg-indigo-500"
                                >
                                    {transferLoading ? (
                                        <>Sending...</>
                                    ) : (
                                        <><Gift size={18} /> Send XP</>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>



            {/* Chat Modal */}
            <AnimatePresence>
                {showChatModal && chatFriend && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh]"
                        >
                            {/* Header */}
                            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                                        {chatFriend.profilePicture ? <img src={chatFriend.profilePicture} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full"><User size={16} /></div>}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white leading-tight">{chatFriend.username}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            {isChatLoading ? 'Connecting...' : 'Online'}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setShowChatModal(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {messages.length === 0 && !isChatLoading && (
                                    <div className="text-center text-slate-500 py-10 text-xs">Start the conversation! 👋</div>
                                )}
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender._id === user._id || msg.sender === user._id; // Handle populated vs unpopulated
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe
                                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                                    : 'bg-slate-700 text-slate-200 rounded-bl-none'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Auto-scroll anchor */}
                                <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl shadow-lg transition-all active:scale-95"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Friends Modal */}
            <AnimatePresence>
                {showFriendsModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <div className="bg-indigo-500/20 p-2 rounded-xl">
                                        <UserCheck className="text-indigo-400" size={24} />
                                    </div>
                                    Friends
                                </h2>
                                <button onClick={() => setShowFriendsModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-700 bg-slate-800/30">
                                <button
                                    onClick={() => setFriendTab('search')}
                                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${friendTab === 'search' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    Search
                                </button>
                                <button
                                    onClick={() => setFriendTab('requests')}
                                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${friendTab === 'requests' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    Requests
                                </button>
                                <button
                                    onClick={() => setFriendTab('friends')}
                                    className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors border-b-2 ${friendTab === 'friends' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    My Friends
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
                                {friendTab === 'search' && (
                                    <div className="space-y-6">
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                                                    placeholder="Find specific username..."
                                                    className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-600 font-medium"
                                                />
                                            </div>
                                            <button
                                                onClick={searchUsers}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={loadingFriends}
                                            >
                                                {loadingFriends ? <Clock className="animate-spin" /> : 'Search'}
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {searchResults.length === 0 && !loadingFriends && searchQuery && (
                                                <div className="text-center text-slate-500 py-8">No users found.</div>
                                            )}
                                            {searchResults.map(u => (
                                                <div key={u._id} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                                                            {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={16} /></div>}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white">{u.username}</div>
                                                            <div className="text-xs text-slate-400 flex gap-2">
                                                                <span>Level {Math.floor((u.xp || 0) / 1000) + 1}</span>
                                                                <span>•</span>
                                                                <span className="text-orange-400 flex items-center gap-1"><Flame size={10} /> {u.overallStreak}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {u.status === 'friend' ? (
                                                            <span className="text-green-400 text-xs font-bold px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">Friend</span>
                                                        ) : u.status === 'pending' ? (
                                                            <button
                                                                onClick={() => handleCancelRequest(u._id)}
                                                                className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleSendRequest(u._id)}
                                                                className="text-xs font-bold text-indigo-400 hover:text-white px-4 py-1.5 bg-indigo-500/10 hover:bg-indigo-600 rounded-lg border border-indigo-500/30 transition-all"
                                                            >
                                                                Add Friend
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {friendTab === 'requests' && (
                                    <div className="space-y-3">
                                        {friendRequests.length === 0 && (
                                            <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                    <User className="text-slate-600" size={24} />
                                                </div>
                                                <p>No pending requests.</p>
                                            </div>
                                        )}
                                        {friendRequests.map(req => {
                                            const u = req.from; // Populated user object
                                            if (!u) return null;
                                            return (
                                                <div key={req._id} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                                                            {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={16} /></div>}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white">{u.username}</div>
                                                            <div className="text-xs text-slate-400">wants to be your friend</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAcceptRequest(u._id)}
                                                            className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg shadow-lg"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRequest(u._id)}
                                                            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg"
                                                        >
                                                            Ignore
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {friendTab === 'friends' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {myFriends.length === 0 && (
                                            <div className="col-span-full text-center text-slate-500 py-10">You haven't added any friends yet.</div>
                                        )}
                                        {myFriends.map(f => (
                                            <div key={f._id} className="bg-slate-800/30 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden shrink-0">
                                                    {f.profilePicture ? <img src={f.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={20} /></div>}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{f.username}</div>
                                                    <div className="text-xs text-slate-400 flex gap-2 mt-0.5">
                                                        <span className="flex items-center gap-1"><Flame size={10} className="text-orange-500" /> {f.overallStreak} Day Streak</span>
                                                    </div>
                                                    <div className="text-xs text-indigo-400 mt-1 font-bold">
                                                        {f.xp} XP
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openTransferModal(f)}
                                                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors"
                                                    title="Gift XP"
                                                >
                                                    <Gift size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openChat(f)}
                                                    className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-white/5 relative"
                                                    title="Chat"
                                                >
                                                    <MessageSquare size={18} />
                                                    {unreadCounts[f._id] > 0 && (
                                                        <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
                                                            {unreadCounts[f._id]}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fixed Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-7xl mx-auto space-y-8"
            >
                {/* Navbar */}
                <motion.nav variants={itemVariants} className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 justify-between items-center sticky top-4 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-tr from-orange-500 to-red-600 p-2 rounded-xl shadow-lg shadow-orange-500/20">
                            <Flame className="text-white fill-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">StreakGame</h1>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block -mt-1">Rank Up</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6 ml-auto">
                        {/* User Stats (Hidden on mobile) */}
                        <div className="hidden md:flex flex-col text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Login</span>
                            <span className="text-xs font-bold text-green-400">
                                {user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleDateString() : 'New User'}
                            </span>
                        </div>

                        <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

                        <div className="flex items-center gap-3">
                            {user.role !== 'admin' && (
                                <button
                                    onClick={() => {
                                        setShowFriendsModal(true);
                                        setFriendTab('search');
                                    }}
                                    className="p-2.5 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5 relative"
                                    title="Friends"
                                >
                                    <UserCheck size={20} />
                                    {((user.friendRequests && user.friendRequests.length > 0) || Object.values(unreadCounts).some((c: number) => c > 0)) && (
                                        <span className="absolute top-2 right-2.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Notification Bell */}
                            <NotificationBell token={localStorage.getItem('auth-token')} />

                            {/* Clans Button */}
                            <button
                                onClick={() => navigate('/clans')}
                                className="p-2.5 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                                title="Clans"
                            >
                                <Users size={20} />
                            </button>

                            {user.role !== 'admin' && (
                                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]">
                                    <Trophy size={16} className="text-yellow-500 fill-yellow-500/20" />
                                    <span className="text-sm font-bold text-yellow-400"><CountUp value={user.xp || 0} /> XP</span>
                                </div>
                            )}


                            {user.role === 'admin' && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105"
                                >
                                    <Shield size={16} /> Admin Panel
                                </button>
                            )}

                            <button
                                onClick={() => setShowProfileModal(true)}
                                className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700/80 text-white pl-2 pr-4 py-1.5 rounded-full border border-white/10 transition-all group"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 p-[2px]">
                                    {user?.profilePicture ? (
                                        <img src={user.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-slate-900" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                            <User size={16} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-bold group-hover:text-indigo-300 transition-colors hidden sm:inline">
                                    {user?.username}
                                </span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="p-2.5 text-slate-400 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </motion.nav>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Main) */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">

                        {/* Welcome Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">{user.username}</span>
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 text-lg">Ready to keep your streak alive?</p>
                            </div>

                            {/* Quick Action / Overall Streak for User */}
                            {user.role !== 'admin' && (
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 p-4 rounded-2xl flex items-center gap-4 backdrop-blur-md"
                                >
                                    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl shadow-lg shadow-orange-500/30">
                                        <Flame size={24} className="text-white fill-white" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-orange-200 font-bold uppercase tracking-wider">Overall Streak</div>
                                        <div className="text-3xl font-black text-white">{user.overallStreak} <span className="text-sm font-normal text-orange-200/50">Days</span></div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Risk Meter Section */}
                        {user.role !== 'admin' && riskAnalysis && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <RiskMeter
                                    score={riskAnalysis.score}
                                    level={riskAnalysis.level}
                                    factors={riskAnalysis.factors}
                                />
                            </motion.div>
                        )}

                        {/* Pending Rewards Alert */}
                        <AnimatePresence>
                            {user.unclaimedRewards && user.unclaimedRewards.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-[1px] shadow-xl shadow-indigo-600/20"
                                >
                                    <div className="bg-slate-900/90 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                                            <Star size={100} className="text-white" />
                                        </div>

                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="bg-indigo-500/20 p-4 rounded-full border border-indigo-500/50">
                                                <Star className="text-indigo-400 fill-indigo-400 animate-pulse" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Reward Ready!</h3>
                                                <p className="text-slate-300">You earned <span className="text-white font-bold">{user.unclaimedRewards[0].xp} XP</span> for {user.unclaimedRewards[0].reason}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await api.post('/auth/claim-reward');
                                                    if (res.data.success) {
                                                        toast.success(`Reward Claimed! +${res.data.xpGained} XP`);
                                                        await refreshUser();
                                                    }
                                                } catch (err: any) {
                                                    toast.error(err.response?.data || 'Failed to claim');
                                                }
                                            }}
                                            className="relative z-10 bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2 whitespace-nowrap"
                                        >
                                            Claim Reward <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Royal Pass Section - LIST OF PASSES */}
                        {user.role !== 'admin' && royalPasses.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Crown className="text-amber-500" /> Available Royal Passes
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {royalPasses.map(pass => (
                                        <RoyalPassCard
                                            key={pass._id}
                                            pass={pass}
                                            user={user}
                                            refreshUser={refreshUser}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* If no passes, maybe show a placeholder or nothing? Leaving empty for now as requested. */}
                        {user.role !== 'admin' && royalPasses.length === 0 && (
                            <div className="text-slate-500 text-sm italic">No active Royal Passes available.</div>
                        )}

                        {/* Seasons Grid Section */}
                        <div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                <Zap className="text-indigo-500 fill-indigo-500" />
                                {user?.role === 'admin' ? 'Manage Seasons' : 'Your Active Seasons'}
                            </h3>

                            {activeSeasons.length === 0 ? (
                                <div className="glass-panel p-10 rounded-2xl text-center">
                                    <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="text-slate-500" />
                                    </div>
                                    <p className="text-slate-400 font-medium">No active seasons at the moment.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {activeSeasons
                                        .sort((a, b) => {
                                            const streakA = user.seasonStreaks?.find((s: any) => s.seasonId === a._id)?.streak || 0;
                                            const streakB = user.seasonStreaks?.find((s: any) => s.seasonId === b._id)?.streak || 0;
                                            return streakB - streakA;
                                        })
                                        .map((season) => {
                                            const seasonStreak = user.seasonStreaks?.find((s: any) => s.seasonId === season._id);
                                            const streakCount = seasonStreak ? seasonStreak.streak : 0;
                                            const today = new Date(); today.setHours(0, 0, 0, 0);
                                            const start = new Date(season.startDate); start.setHours(0, 0, 0, 0);
                                            const end = new Date(season.endDate); end.setHours(23, 59, 59, 999);
                                            const isActive = today >= start && today <= end;
                                            const theme = getSeasonTheme(season._id);

                                            return (
                                                <motion.div
                                                    key={season._id}
                                                    variants={itemVariants}
                                                    whileHover={{ y: -5, scale: 1.02 }}
                                                    onClick={() => handleSeasonClick(season)}
                                                    className={`p-6 rounded-2xl border-l-4 cursor-pointer relative overflow-hidden group transition-all duration-300 ${theme.styles.cardBg} ${theme.styles.border} ${theme.styles.shadow} glass-card-hover backdrop-blur-md border`}
                                                >

                                                    {/* Card Header */}
                                                    <div className="flex justify-between items-start mb-6 z-10 relative">
                                                        <div>
                                                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 opacity-70 ${theme.styles.textAccent}`}>Season</div>
                                                            <h4 className="text-2xl font-bold text-white leading-tight">{season.name}</h4>
                                                            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-300">
                                                                <Calendar size={12} className="opacity-70" />
                                                                {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                                                            {isActive ? 'Active' : 'Ended'}
                                                        </div>
                                                    </div>

                                                    {/* Card Body - Stats */}
                                                    <div className="flex items-end gap-3 z-10 relative">
                                                        <span className={`text-6xl font-black ${theme.styles.textAccent} drop-shadow-lg`}>
                                                            {user.role === 'admin' ? (season.userCount || 0) : streakCount}
                                                        </span>
                                                        <div className="mb-3">
                                                            <div className="text-sm font-bold text-white leading-none mb-1">
                                                                {user.role === 'admin' ? 'Participants' : 'Day Streak'}
                                                            </div>
                                                            <div className="text-xs text-slate-400">Keep it up!</div>
                                                        </div>
                                                    </div>

                                                    {/* Action Button Overlay */}
                                                    {user.role !== 'admin' && isActive && (
                                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                                                            <div className={`px-4 py-2 rounded-lg font-bold text-sm shadow-lg ${theme.styles.badgeBg} ${theme.styles.badgeText} border border-white/10`}>
                                                                Check In
                                                            </div>
                                                        </div>
                                                    )}



                                                    {/* Decor */}
                                                    <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity ${theme.styles.blobColor}`} />
                                                </motion.div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                    </motion.div>

                    {/* Right Column (Sidebar) */}
                    <motion.div variants={itemVariants} className="hidden lg:block lg:col-span-1 space-y-8 h-fit sticky top-24">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-indigo-500/20 group cursor-pointer" onClick={() => navigate('/chat')}>
                            <div className="absolute top-0 right-0 p-4 opacity-20 transform rotate-12 group-hover:rotate-0 transition-all duration-500">
                                <MessageSquare size={80} className="text-white fill-white/20" />
                            </div>
                            <div className="relative z-10 text-white">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
                                    <Users size={24} />
                                </div>
                                <h3 className="text-2xl font-bold mb-1">Group Chat</h3>
                                <p className="text-indigo-100 text-sm mb-4 max-w-[80%]">Connect with your squad and plan your next streak!</p>
                                <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 group-hover:gap-3 transition-all">
                                    Open Chat <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>

                        <Leaderboard />
                        {user?.role !== 'admin' && <SpinWheel />}

                        {/* Footer / Links */}
                        <div className="text-center pt-8 border-t border-white/5">
                            <p className="text-slate-500 text-xs">© 2024 StreakGame. All rights reserved.</p>
                            <div className="flex justify-center gap-4 mt-2">
                                <a href="#" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Privacy</a>
                                <a href="#" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Terms</a>
                                <a href="#" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Help</a>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </motion.div>

            {/* Login Modal */}
            <AnimatePresence>
                {showLoginModal && selectedSeason && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${getSeasonTheme(selectedSeason._id).styles.buttonGradient}`} />
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-8">
                                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${getSeasonTheme(selectedSeason._id).styles.badgeBg}`}>
                                    <Flame size={32} className={getSeasonTheme(selectedSeason._id).styles.textAccent} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Ready to Check In?</h2>
                                <p className="text-slate-400 text-sm px-4">
                                    Claim your daily streak for
                                    <span className={`font-bold ml-1 ${getSeasonTheme(selectedSeason._id).styles.textAccent}`}>{selectedSeason.name}</span>
                                </p>
                            </div>

                            {checkInMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl mb-6 text-sm text-center font-bold flex items-center justify-center gap-2 ${checkInMessage.includes('success') ? 'bg-green-500/20 text-green-400 border border-green-500/20' : checkInMessage.includes('Already') ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20'}`}
                                >
                                    {checkInMessage}
                                </motion.div>
                            )}

                            <form onSubmit={handleCheckInSubmit} className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={checkingIn}
                                    className={`btn-primary w-full flex justify-center items-center gap-2 mt-6 py-4 text-lg bg-gradient-to-r ${getSeasonTheme(selectedSeason._id).styles.buttonGradient}`}
                                >
                                    {checkingIn ? (
                                        <>Checking In...</>
                                    ) : (
                                        <><Flame size={20} /> Confirm Check In</>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-xs text-slate-500 mt-6">
                                Keep the streak alive! 🔥
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Dashboard;
