import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Flame, Calendar, Trophy, LogOut, Lock, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSeasonTheme } from '../utils/theme';

const Dashboard = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [activeSeasons, setActiveSeasons] = useState<any[]>([]);

    // Modal State
    // Modal State
    const [selectedSeason, setSelectedSeason] = useState<any>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [checkInMessage, setCheckInMessage] = useState('');
    const [checkingIn, setCheckingIn] = useState(false);

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
    }, []);

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

        // Basic validation
        if (loginEmail !== user?.email) {
            setCheckInMessage('Please use your current account email.');
            setCheckingIn(false);
            return;
        }

        try {
            // 1. Verify Credentials
            await api.post('/auth/login', { email: loginEmail, password: loginPassword });

            // 2. Check-in
            const res = await api.post(`/season/${selectedSeason._id}/checkin`, {});

            // 3. Success Feedback
            setCheckInMessage(res.data.message || 'Checked in successfully!');

            // 4. Update Streak Data (refresh user context)
            await refreshUser();

            // Close after delay
            if (res.data.message?.includes('Already')) {
                setTimeout(() => {
                    setShowLoginModal(false);
                }, 2000);
            } else {
                setTimeout(() => {
                    setShowLoginModal(false);
                }, 1500);
            }

        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data;
            setCheckInMessage(typeof msg === 'string' ? msg : 'Login failed. Check password.');
        } finally {
            setCheckingIn(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />
            </div>

            <nav className="relative z-10 flex justify-between items-center mb-10 glass-panel p-4 rounded-xl">
                <div className="flex items-center gap-2">
                    <Flame className="text-orange-500" />
                    <h1 className="text-xl font-bold">StreakGame</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <span className="text-xs text-slate-400 block font-normal">Last Global Login</span>
                        <span className="text-sm font-semibold text-green-400">
                            {user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleDateString() : 'Never'}
                        </span>
                    </div>
                    <span className="text-slate-300">Hello, <span className="font-bold text-white">{user.username}</span></span>
                    {user.role === 'admin' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105"
                        >
                            <Shield size={16} /> Admin Panel
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-200 px-4 py-2 rounded-lg transition-all border border-white/10 hover:border-red-500/30"
                    >
                        <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </nav>

            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                {/* Overall Streak Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-8 rounded-3xl text-center bg-gradient-to-br from-orange-500/20 to-red-600/20"
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-600/40 mb-4"
                    >
                        <Flame size={48} className="text-white fill-white" />
                    </motion.div>
                    <h2 className="text-5xl font-bold text-white mb-2">{user.overallStreak} <span className="text-2xl font-normal text-slate-300">Days</span></h2>
                    <p className="text-slate-400">Current Overall Streak</p>
                </motion.div>

                {/* Active Seasons */}
                <div>
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Trophy className="text-yellow-500" /> {user?.role === 'admin' ? 'All Seasons (Admin View)' : 'Active Seasons'}
                    </h3>

                    {activeSeasons.length === 0 ? (
                        <div className="text-center py-10 glass-panel rounded-xl text-slate-400">
                            No active seasons right now.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {activeSeasons
                                .sort((a, b) => {
                                    const streakA = user.seasonStreaks?.find((s: any) => s.seasonId === a._id)?.streak || 0;
                                    const streakB = user.seasonStreaks?.find((s: any) => s.seasonId === b._id)?.streak || 0;
                                    return streakB - streakA;
                                })
                                .map((season) => {
                                    // Find user streak for this season
                                    const seasonStreak = user.seasonStreaks?.find((s: any) => s.seasonId === season._id);
                                    const streakCount = seasonStreak ? seasonStreak.streak : 0;

                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const start = new Date(season.startDate);
                                    start.setHours(0, 0, 0, 0);
                                    const end = new Date(season.endDate);
                                    end.setHours(23, 59, 59, 999);

                                    const isActive = today >= start && today <= end;
                                    const theme = getSeasonTheme(season._id);

                                    return (
                                        <motion.div
                                            key={season._id}
                                            whileHover={{ y: -5 }}
                                            onClick={() => handleSeasonClick(season)}
                                            className={`p-6 rounded-2xl border-l-4 cursor-pointer backdrop-blur-lg border shadow-xl relative overflow-hidden group transition-all duration-300 ${theme.styles.cardBg} ${theme.styles.border} ${theme.styles.shadow}`}
                                        >
                                            <div className="flex justify-between items-start mb-4 z-10 relative">
                                                <div>
                                                    <h4 className={`text-xl font-bold text-white transition-colors flex items-center gap-2`}>
                                                        {season.name}
                                                        {isActive && <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className={`w-2 h-2 rounded-full ${theme.styles.textAccent.replace('text-', 'bg-')}`} />}
                                                    </h4>
                                                    <p className="text-sm text-slate-300 flex items-center gap-1 mt-1">
                                                        <Calendar size={14} className={theme.styles.textAccent} />
                                                        {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isActive ? `${theme.styles.badgeBg} ${theme.styles.badgeText}` : 'bg-slate-700/50 text-slate-400'}`}>
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2 z-10 relative">
                                                <span className={`text-5xl font-extrabold ${theme.styles.textAccent}`}>{streakCount}</span>
                                                <span className="text-slate-300 mb-2 font-medium">Day Streak</span>
                                            </div>

                                            {/* Abstract Decoration */}
                                            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-30 ${theme.styles.blobColor}`} />

                                            {
                                                user.role !== 'admin' && (
                                                    <div className={`mt-6 text-sm text-center py-2 rounded-lg font-bold transition-all ${theme.styles.badgeBg} ${theme.styles.badgeText} group-hover:brightness-125`}>
                                                        Check-in Now
                                                    </div>
                                                )
                                            }
                                        </motion.div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {/* Login Modal */}
            <AnimatePresence>
                {showLoginModal && selectedSeason && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl relative"
                        >
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-2xl font-bold mb-2">Login to {selectedSeason.name}</h2>
                            <p className="text-slate-400 mb-6 text-sm">Verify your credentials to check-in for this season.</p>

                            {checkInMessage && (
                                <div className={`p-3 rounded-lg mb-4 text-sm text-center font-bold ${checkInMessage.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-300'}`}>
                                    {checkInMessage}
                                </div>
                            )}

                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="input-field w-full"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="input-field w-full"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>


                                <button
                                    type="submit"
                                    disabled={checkingIn}
                                    className="btn-primary w-full flex justify-center items-center gap-2 mt-4"
                                >
                                    <Lock size={18} />
                                    {checkingIn ? 'Verifying...' : 'Check In'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Dashboard;
