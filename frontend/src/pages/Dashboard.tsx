import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Flame, Calendar, Trophy, LogOut, Lock, X, Shield, User, Crown, ArrowRight, Zap, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSeasonTheme } from '../utils/theme';
import toast from 'react-hot-toast';
import XPPopup from '../components/XPPopup';
import ProfileModal from '../components/ProfileModal';
import Leaderboard from '../components/Leaderboard';
import SpinWheel from '../components/SpinWheel';

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

const RoyalPassCard: React.FC<{ user: any, refreshUser: () => Promise<void>, setXpReward: (xp: number) => void, setShowXPPopup: (show: boolean) => void }> = ({ user, refreshUser, setXpReward, setShowXPPopup }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isRenewable, setIsRenewable] = useState(false);
    const [config, setConfig] = useState({ minStreak: 3, minSeasons: 3 });

    useEffect(() => {
        // Fetch Config
        const fetchConfig = async () => {
            try {
                const res = await api.get('/auth/settings');
                if (res.data) setConfig(res.data);
            } catch (err) {
                console.error("Failed to fetch RP settings", err);
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        const updateTimer = () => {
            // console.log('RoyalPass debug:', { hasClaimed: user.hasClaimedRoyalPass, lastClaim: user.lastRoyalPassClaimDate });

            const qualifyingSeasons = user.seasonStreaks?.filter((s: any) => s.streak >= config.minStreak).length || 0;
            const isEligible = qualifyingSeasons >= config.minSeasons;

            if (user.hasClaimedRoyalPass) {
                if (user.lastRoyalPassClaimDate) {
                    const lastClaim = new Date(user.lastRoyalPassClaimDate);
                    const now = new Date();
                    const renewalDate = new Date(lastClaim.getTime() + (10 * 24 * 60 * 60 * 1000)); // +10 days
                    const diffTime = renewalDate.getTime() - now.getTime();

                    // console.log('Timer debug:', { now, lastClaim, renewalDate, diffTime });

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
                } else {
                    // Claimed but no date (Legacy) -> Allow renewed claim
                    setIsRenewable(true);
                    setTimeLeft('');
                }
            } else if (!user.hasClaimedRoyalPass && isEligible) {
                setIsRenewable(true);
            } else {
                setIsRenewable(false); // Not eligible
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [user, config]);

    const handleClaimPass = async () => {
        try {
            const res = await api.post('/auth/claim-royal-pass');
            if (res.data.success) {
                // setXpReward(res.data.xpGained);
                // setShowXPPopup(true);
                await refreshUser();
                toast.success('Royal Pass Activated!');
            }
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to claim');
        }
    };

    const qualifyingSeasons = user.seasonStreaks?.filter((s: any) => s.streak >= config.minStreak).length || 0;
    const isEligible = qualifyingSeasons >= config.minSeasons;

    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass-panel bg-slate-900 rounded-2xl p-6 md:p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-300 to-yellow-600 rounded-2xl transform rotate-3 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Crown size={40} className="text-white fill-white/20" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Royal Pass</h3>
                            <p className="text-slate-400 max-w-xs text-sm">Unlock the ultimate status by maintaining {config.minStreak}+ day streaks in {config.minSeasons} different seasons.</p>
                        </div>
                    </div>

                    {/* Logic Branching */}
                    {user.hasClaimedRoyalPass && !isRenewable ? (
                        <div className="flex flex-col items-center">
                            <div className="bg-yellow-500/20 text-yellow-400 px-6 py-2 rounded-full font-bold border border-yellow-500/50 flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                <Crown size={18} className="fill-current" />
                                Pass Active
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-slate-400">
                                <Clock size={14} />
                                <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
                                    {timeLeft}
                                </span>
                            </div>
                        </div>
                    ) : (isEligible && isRenewable) ? (
                        <button
                            onClick={handleClaimPass}
                            className="bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Crown size={20} className="fill-current" />
                            Claim Royal Pass
                        </button>
                    ) : (
                        <div className="text-center bg-slate-800/50 p-4 rounded-xl border border-white/5 min-w-[140px]">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Progress</div>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-3xl font-black text-white">{qualifyingSeasons}</span>
                                <span className="text-sm text-slate-500 font-bold">/ {config.minSeasons}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [activeSeasons, setActiveSeasons] = useState<any[]>([]);

    // Modal State
    const [selectedSeason, setSelectedSeason] = useState<any>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [checkInMessage, setCheckInMessage] = useState('');
    const [checkingIn, setCheckingIn] = useState(false);

    // XP Data
    const [xpReward, setXpReward] = useState(0);
    const [showXPPopup, setShowXPPopup] = useState(false);

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
        fetchSeasons();
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
            setLoginEmail('');
            setLoginPassword('');
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCheckingIn(true);
        setCheckInMessage('');

        if (loginEmail !== user?.email) {
            setCheckInMessage('Please use your current account email.');
            setCheckingIn(false);
            return;
        }

        try {
            // 1. Verify Credentials
            const loginRes = await api.post('/auth/login', { email: loginEmail, password: loginPassword });

            // 2. Check-in
            const res = await api.post(`/season/${selectedSeason._id}/checkin`, {});

            // 3. Success Feedback
            setCheckInMessage(res.data.message || 'Checked in successfully!');

            // Check XP (From Global Login AND Season Check-in)
            const globalXp = loginRes.data.xpGained || 0;
            const seasonXp = res.data.xpGained || 0;
            const totalXpGained = globalXp + seasonXp;

            if (totalXpGained > 0) {
                setXpReward(totalXpGained);
                setShowXPPopup(true);
            }

            // 4. Update Streak Data (refresh user context)
            await refreshUser();

            // Close after delay
            setTimeout(() => {
                setShowLoginModal(false);
            }, 1500);

        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data;
            setCheckInMessage(typeof msg === 'string' ? msg : 'Login failed. Check password.');
        } finally {
            setCheckingIn(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 relative overflow-x-hidden font-sans selection:bg-indigo-500/30">
            <XPPopup xp={xpReward} isOpen={showXPPopup} onClose={() => setShowXPPopup(false)} />
            <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

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
                <motion.nav variants={itemVariants} className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 justify-between items-center sticky top-4 z-50 backdrop-blur-xl bg-slate-900/60 border-white/10">
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
                                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]">
                                    <Trophy size={16} className="text-yellow-500 fill-yellow-500/20" />
                                    <span className="text-sm font-bold text-yellow-400">{user.xp || 0} XP</span>
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
                                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">{user.username}</span>
                                </h2>
                                <p className="text-slate-400 text-lg">Ready to keep your streak alive?</p>
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
                                                        setXpReward(res.data.xpGained);
                                                        setShowXPPopup(true);
                                                        await refreshUser();
                                                        toast.success('Reward Claimed!');
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

                        {/* Royal Pass Section */}
                        {user.role !== 'admin' && <RoyalPassCard user={user} refreshUser={refreshUser} setXpReward={setXpReward} setShowXPPopup={setShowXPPopup} />}

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
                                    <Lock size={32} className={getSeasonTheme(selectedSeason._id).styles.textAccent} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Check In Required</h2>
                                <p className="text-slate-400 text-sm px-4">
                                    Verify your identity to claim your streak for
                                    <span className={`font-bold ml-1 ${getSeasonTheme(selectedSeason._id).styles.textAccent}`}>{selectedSeason.name}</span>
                                </p>
                            </div>

                            {checkInMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl mb-6 text-sm text-center font-bold flex items-center justify-center gap-2 ${checkInMessage.includes('success') ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20'}`}
                                >
                                    {checkInMessage}
                                </motion.div>
                            )}

                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="input-field bg-slate-800/50 focus:bg-slate-800 transition-colors"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                                    <input
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="input-field bg-slate-800/50 focus:bg-slate-800 transition-colors"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={checkingIn}
                                    className={`btn-primary w-full flex justify-center items-center gap-2 mt-6 py-4 text-lg bg-gradient-to-r ${getSeasonTheme(selectedSeason._id).styles.buttonGradient}`}
                                >
                                    {checkingIn ? (
                                        <>Verifying...</>
                                    ) : (
                                        <><Lock size={20} /> Check In Now</>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-xs text-slate-500 mt-6">
                                Secure Check-in System v1.0
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
