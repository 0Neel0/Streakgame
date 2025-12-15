import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Calendar, Users, ArrowLeft, Lock, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSeasonTheme } from '../utils/theme';
import XPPopup from '../components/XPPopup';

interface Season {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

interface SeasonUser {
    _id: string;
    username: string;
    streak: number;
    lastLogin: string;
    profilePicture?: string;
}

const SeasonDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [season, setSeason] = useState<Season | null>(null);
    const [seasonUsers, setSeasonUsers] = useState<SeasonUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [currentStreak, setCurrentStreak] = useState(0);

    const [showLogin, setShowLogin] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [checkingIn, setCheckingIn] = useState(false);

    // XP Data
    const [xpReward, setXpReward] = useState(0);
    const [showXPPopup, setShowXPPopup] = useState(false);

    const fetchSeasonDetails = async () => {
        try {
            const res = await api.get(`/season/${id}`);
            setSeason(res.data);

            // If user has streak in this season, set it
            if (user && user.seasonStreaks) {
                const s = user.seasonStreaks.find((st: any) => st.seasonId === id);
                if (s) setCurrentStreak(s.streak);
            }
        } catch (err) {
            console.error(err);
            setMessage('Failed to load season details');
        }

        // If admin, fetch users (Separate try-catch)
        if (user?.role === 'admin') {
            try {
                const usersRes = await api.get(`/season/${id}/users`);
                setSeasonUsers(usersRes.data);
            } catch (err) {
                console.error("Failed to load season users", err);
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchSeasonDetails();
    }, [id, user]);

    const handleSeasonLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCheckingIn(true);
        setMessage('');

        try {
            // 1. Verify credentials (re-login)
            const loginRes = await api.post('/auth/login', { email: loginEmail, password: loginPassword });

            // 2. Perform Check-in
            const res = await api.post(`/season/${id}/checkin`, {});

            setMessage('Logged in successfully! Streak Updated.');
            if (res.data.streak) {
                setCurrentStreak(res.data.streak);
            }

            if (loginRes.data.xpGained > 0) {
                setXpReward(loginRes.data.xpGained);
                setShowXPPopup(true);
            }

            setShowLogin(false);
            setLoginEmail('');
            setLoginPassword('');

            // Clear message after 3s
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data;
            setMessage(typeof msg === 'string' ? msg : 'Login failed. Please check credentials.');
        } finally {
            setCheckingIn(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
    if (!season) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Season not found</div>;

    // Normalize dates for day-level comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(season.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(season.endDate);
    end.setHours(23, 59, 59, 999);

    const isActive = today >= start && today <= end;
    const theme = season ? getSeasonTheme(season._id) : getSeasonTheme('default');

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 relative overflow-hidden font-sans selection:bg-indigo-500/30">
            <XPPopup xp={xpReward} isOpen={showXPPopup} onClose={() => setShowXPPopup(false)} />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-30 ${theme.styles.blobColor}`} />
                <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-20 ${theme.styles.blobColor}`} />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group"
                >
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </div>
                    <span className="font-medium">Back to Dashboard</span>
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative p-8 md:p-12 rounded-[2rem] mb-8 overflow-hidden glass-panel ${theme.styles.border}`}
                >
                    {/* Decorative Header BG */}
                    <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme.styles.buttonGradient}`} />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border ${isActive ? theme.styles.badgeBg + ' ' + theme.styles.badgeText : 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                                {isActive ? <><Zap size={12} className="fill-current" /> Season Active</> : 'Season Ended'}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">{season.name}</h1>
                            <p className={`flex items-center gap-2 text-lg font-medium ${theme.styles.textAccent} opacity-80`}>
                                <Calendar size={20} />
                                {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Stats Summary */}
                        <div className="flex gap-4">
                            <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-xl border border-white/5 text-center min-w-[100px]">
                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Items</div>
                                <div className="text-2xl font-bold text-white">-</div>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-xl border border-white/5 text-center min-w-[100px]">
                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Participants</div>
                                <div className="text-2xl font-bold text-white">{seasonUsers.length || (user?.role === 'admin' ? 0 : '-')}</div>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-6 p-4 rounded-xl text-center font-bold relative overflow-hidden backdrop-blur-md ${message.includes('fail') || message.includes('Login failed') ? 'bg-red-500/20 text-red-200 ring-1 ring-red-500/30' : 'bg-green-500/20 text-green-200 ring-1 ring-green-500/30'}`}
                        >
                            {message}
                        </motion.div>
                    )}
                </motion.div>

                {/* User View: Check-in / Login */}
                {user?.role !== 'admin' && isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel p-8 md:p-12 rounded-[2.5rem] text-center flex flex-col items-center justify-center gap-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        <div className="relative">
                            <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl relative z-10 bg-slate-900 border-4 ${theme.styles.border.replace('border-', 'border-')}`}>
                                <div className={`absolute inset-0 rounded-full opacity-20 blur-xl ${theme.styles.blobColor}`} />
                                <span className={`text-6xl font-black ${theme.styles.textAccent}`}>{currentStreak}</span>
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-200 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 whitespace-nowrap z-20">
                                Current Streak
                            </div>
                        </div>

                        <div className="max-w-md mx-auto">
                            <h2 className="text-3xl font-bold text-white mb-2">Keep the Flame Burning!</h2>
                            <p className="text-slate-400">Check in daily to increase your streak and earn exclusive rewards for this season.</p>
                        </div>

                        {!showLogin ? (
                            <button
                                onClick={() => setShowLogin(true)}
                                className={`group relative btn-primary flex items-center justify-center gap-3 px-10 py-5 text-xl bg-gradient-to-r ${theme.styles.buttonGradient}`}
                            >
                                <Lock size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold">Login to Check-in</span>
                                <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
                            </button>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                onSubmit={handleSeasonLogin}
                                className="w-full max-w-sm space-y-4 bg-slate-800/50 p-8 rounded-2xl border border-white/10 backdrop-blur-xl"
                            >
                                <h3 className="text-lg font-bold mb-6 flex items-center justify-center gap-2">
                                    <Lock size={16} className="text-slate-400" /> Verify Credentials
                                </h3>

                                <div className="space-y-1 text-left">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="Confirm Email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="input-field bg-slate-900/80"
                                        required
                                    />
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="input-field bg-slate-900/80"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowLogin(false)}
                                        className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors font-bold text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={checkingIn}
                                        className={`flex-1 py-3 rounded-xl font-bold bg-gradient-to-r text-white shadow-lg ${theme.styles.buttonGradient} hover:brightness-110 transition-all`}
                                    >
                                        {checkingIn ? 'Verifying...' : 'Check-in'}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </motion.div>
                )}

                {/* Admin View: User List */}
                {user?.role === 'admin' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-6 rounded-3xl"
                    >
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <Users className="text-indigo-400" size={24} />
                                </div>
                                Season Participants
                            </h2>
                            <div className="text-sm font-bold text-slate-400 bg-slate-800/50 px-4 py-2 rounded-full border border-white/5">
                                Total: {seasonUsers.length}
                            </div>
                        </div>


                        <div className="space-y-3">
                            <div className="grid grid-cols-12 text-xs text-slate-500 uppercase font-bold px-6 pb-4 border-b border-white/5 tracking-wider">
                                <span className="col-span-5">User</span>
                                <span className="col-span-3 text-center">Streak</span>
                                <span className="col-span-4 text-right">Last Login</span>
                            </div>

                            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {seasonUsers
                                    .sort((a, b) => b.streak - a.streak)
                                    .map((u, i) => (
                                        <motion.div
                                            key={u._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="grid grid-cols-12 items-center bg-slate-800/30 hover:bg-slate-800/60 p-4 rounded-xl border border-transparent hover:border-white/5 transition-all group"
                                        >
                                            <div className="col-span-5 font-bold text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
                                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs">
                                                        {u.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                </div>
                                                {u.username}
                                            </div>
                                            <div className="col-span-3 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-lg font-bold text-xs ${u.streak > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/10' : 'bg-slate-700 text-slate-400'}`}>
                                                    {u.streak} Days
                                                </span>
                                            </div>
                                            <div className="col-span-4 text-right text-slate-400 text-sm font-medium flex items-center justify-end gap-2">
                                                {u.lastLogin ? (
                                                    <><Clock size={12} className="opacity-50" /> {new Date(u.lastLogin).toLocaleDateString()}</>
                                                ) : 'Never'}
                                            </div>
                                        </motion.div>
                                    ))}
                                {seasonUsers.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users className="mx-auto text-slate-700 mb-4" size={48} />
                                        <p className="text-slate-500 font-medium">No participants found in this season.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SeasonDetails;
