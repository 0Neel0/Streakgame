import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Flame, Calendar, Users, ArrowLeft, CheckCircle, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSeasonTheme } from '../utils/theme';



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
            await api.post('/auth/login', { email: loginEmail, password: loginPassword });

            // 2. Perform Check-in
            const res = await api.post(`/season/${id}/checkin`, {});

            setMessage('Logged in successfully! Streak Updated.');
            if (res.data.streak) {
                setCurrentStreak(res.data.streak);
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

    if (loading) return <div className="text-white p-10 flex justify-center">Loading...</div>;
    if (!season) return <div className="text-white p-10">Season not found</div>;

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
        <div className="min-h-screen bg-slate-900 text-white p-6 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className={`absolute top-[10%] right-[10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-20 ${theme.styles.blobColor}`} />
                <div className={`absolute bottom-[10%] left-[10%] w-[30%] h-[30%] rounded-full blur-[100px] opacity-20 ${theme.styles.blobColor}`} />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={20} /> Back
                </button>

                <div className={`p-8 rounded-3xl mb-8 backdrop-blur-lg border shadow-xl ${theme.styles.cardBg} ${theme.styles.border} ${theme.styles.shadow}`}>
                    <h1 className="text-4xl font-bold mb-2 text-white">{season.name}</h1>
                    <p className={`flex items-center gap-2 ${theme.styles.textAccent}`}>
                        <Calendar size={18} />
                        {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                    </p>

                    <div className="mt-6 flex items-center gap-4">
                        {isActive ? (
                            <div className={`px-4 py-2 rounded-lg font-bold border ${theme.styles.badgeBg} ${theme.styles.badgeText} border-white/10`}>
                                Season Active
                            </div>
                        ) : (
                            <div className="bg-slate-700 text-slate-400 px-4 py-2 rounded-lg font-bold">
                                Season Inactive
                            </div>
                        )}
                    </div>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-4 p-4 rounded-lg text-center font-bold ${message.includes('fail') || message.includes('Login failed') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-400'}`}
                        >
                            {message}
                        </motion.div>
                    )}
                </div>

                {/* User View: Check-in / Login */}
                {user?.role !== 'admin' && isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-10 rounded-3xl text-center flex flex-col items-center justify-center gap-6"
                    >
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="text-5xl font-bold">{currentStreak}</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Your Season Streak</h2>
                            <p className="text-slate-400">Login to update your streak!</p>
                        </div>

                        {!showLogin ? (
                            <button
                                onClick={() => setShowLogin(true)}
                                className="btn-primary flex items-center gap-2 px-8 py-4 text-lg"
                            >
                                <Lock size={20} /> Login to Season
                            </button>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                onSubmit={handleSeasonLogin}
                                className="w-full max-w-sm space-y-4 bg-white/5 p-6 rounded-xl border border-white/10"
                            >
                                <h3 className="text-lg font-bold mb-4">Verify Credentials</h3>
                                <input
                                    type="email"
                                    placeholder="Confirm Email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="input-field"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="input-field"
                                    required
                                />

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowLogin(false)}
                                        className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={checkingIn}
                                        className="flex-1 btn-primary"
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
                        className="glass-panel p-6 rounded-2xl"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Users className="text-indigo-500" /> Season Participants
                        </h2>

                        <div className="space-y-2">
                            <div className="grid grid-cols-3 text-sm text-slate-400 font-bold px-4 pb-2 border-b border-white/10">
                                <span>Username</span>
                                <span className="text-center">Streak</span>
                                <span className="text-right">Last Login</span>
                            </div>
                            {seasonUsers
                                .sort((a, b) => b.streak - a.streak)
                                .map((u, i) => (
                                    <motion.div
                                        key={u._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="grid grid-cols-3 items-center bg-white/5 p-4 rounded-xl"
                                    >
                                        <div className="font-bold">{u.username}</div>
                                        <div className="text-center">
                                            <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full font-bold">
                                                {u.streak}
                                            </span>
                                        </div>
                                        <div className="text-right text-slate-400 text-sm">
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                                        </div>
                                    </motion.div>
                                ))}
                            {seasonUsers.length === 0 && <p className="text-center text-slate-500 py-4">No participants yet.</p>}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SeasonDetails;
