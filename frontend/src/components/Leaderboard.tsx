import { useEffect, useState } from 'react';
import { Trophy, Flame, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';

interface LeaderboardUser {
    _id: string;
    username: string;
    xp?: number;
    overallStreak?: number;
    profilePicture?: string;
}

const Leaderboard = () => {
    const [activeTab, setActiveTab] = useState<'xp' | 'streak'>('xp');
    const [topXP, setTopXP] = useState<LeaderboardUser[]>([]);
    const [topStreak, setTopStreak] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/auth/leaderboard');
                setTopXP(res.data.topXP);
                setTopStreak(res.data.topStreak);
            } catch (err) {
                console.error("Failed to load leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const data = activeTab === 'xp' ? topXP : topStreak;

    return (
        <div className="bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-6 h-fit sticky top-8">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                <Trophy className="text-yellow-600 dark:text-yellow-500" /> Leaderboard
            </h3>

            {/* Tabs */}
            <div className="flex bg-slate-300/50 dark:bg-slate-900/50 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('xp')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'xp' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Top XP
                </button>
                <button
                    onClick={() => setActiveTab('streak')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'streak' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    Top Streaks
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center text-slate-500 py-8">Loading...</div>
                ) : (
                    data.map((user, index) => (
                        <motion.div
                            key={user._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                        >
                            <div className="w-8 h-8 flex items-center justify-center font-bold text-lg relative">
                                {index === 0 && <Crown size={24} className="text-yellow-500 absolute -top-3 -left-2 rotate-[-15deg]" />}
                                <span className={index === 0 ? 'text-yellow-600 dark:text-yellow-400' : index === 1 ? 'text-slate-400 dark:text-slate-300' : index === 2 ? 'text-amber-700 dark:text-amber-600' : 'text-slate-600 dark:text-slate-500'}>
                                    #{index + 1}
                                </span>
                            </div>

                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold overflow-hidden text-slate-700 dark:text-slate-200">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                                ) : (
                                    user.username.substring(0, 2).toUpperCase()
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-bold truncate text-sm text-slate-900 dark:text-white">{user.username}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    {activeTab === 'xp' ? (
                                        <><Trophy size={10} className="text-yellow-600 dark:text-yellow-500" /> {user.xp || 0} XP</>
                                    ) : (
                                        <><Flame size={10} className="text-orange-500" /> {user.overallStreak} days</>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
