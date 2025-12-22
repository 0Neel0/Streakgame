import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, LogIn, Search, Shield, X, ArrowLeft, Mail, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Clan {
    _id: string;
    name: string;
    description: string;
    admin: {
        _id: string;
        username: string;
        profilePicture?: string;
    };
    memberCount: number;
    seasonId?: {
        name: string;
        startDate: string;
        endDate: string;
    } | null;
    createdAt: string;
}

const Clans: React.FC = () => {
    const [clans, setClans] = useState<Clan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newClan, setNewClan] = useState({ name: '', description: '', seasonId: '' });
    const [joinClanId, setJoinClanId] = useState('');
    const [invites, setInvites] = useState<any[]>([]);
    const navigate = useNavigate();

    const token = localStorage.getItem('auth-token');

    // Fix user ID retrieval
    let userId = localStorage.getItem('userId');
    try {
        const storedUser = localStorage.getItem('user-data');
        if (storedUser && !userId) {
            userId = JSON.parse(storedUser)._id;
        }
    } catch (e) { }

    useEffect(() => {
        fetchUserClans();
        fetchUserClans();
        fetchInvites();
    }, []);

    const fetchInvites = async () => {
        try {
            const response = await axios.get(`${API_URL}/clan/user/invites`, {
                headers: { 'auth-token': token }
            });
            setInvites(response.data);
        } catch (err) {
            console.error('Error fetching invites:', err);
        }
    };

    const fetchUserClans = async () => {
        try {
            const response = await axios.get(`${API_URL}/clan/user/all`, {
                headers: { 'auth-token': token }
            });
            setClans(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching clans:', err);
            setLoading(false);
        }
    };

    const handleCreateClan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/clan/create`, newClan, {
                headers: { 'auth-token': token }
            });
            setShowCreateModal(false);
            setNewClan({ name: '', description: '', seasonId: '' });
            fetchUserClans();
        } catch (err: any) {
            alert(err.response?.data || 'Failed to create clan');
        }
    };

    const handleJoinClan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/clan/${joinClanId}/join`, {}, {
                headers: { 'auth-token': token }
            });
            setShowJoinModal(false);
            setJoinClanId('');
            fetchUserClans();
        } catch (err: any) {
            alert(err.response?.data || 'Failed to join clan');
        }
    };

    const handleLeaveClan = async (clanId: string) => {
        if (!confirm('Are you sure you want to leave this clan?')) return;
        try {
            await axios.post(`${API_URL}/clan/${clanId}/leave`, {}, {
                headers: { 'auth-token': token }
            });
            fetchUserClans();
        } catch (err: any) {
            alert(err.response?.data || 'Failed to leave clan');
        }
    };

    const handleDeleteClan = async (clanId: string) => {
        if (!confirm('Are you sure you want to delete this clan? This cannot be undone.')) return;
        try {
            await axios.delete(`${API_URL}/clan/${clanId}`, {
                headers: { 'auth-token': token }
            });
            fetchUserClans();
        } catch (err: any) {
            alert(err.response?.data || 'Failed to delete clan');
        }
    };

    const handleAcceptInvite = async (clanId: string) => {
        try {
            await axios.post(`${API_URL}/clan/${clanId}/accept-invite`, {}, {
                headers: { 'auth-token': token }
            });
            toast.success('Joined clan!');
            fetchUserClans();
            fetchInvites();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to join');
        }
    };

    const handleRejectInvite = async (clanId: string) => {
        try {
            await axios.post(`${API_URL}/clan/${clanId}/reject-invite`, {}, {
                headers: { 'auth-token': token }
            });
            toast.success('Invitation rejected');
            fetchInvites();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to reject');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-purple-400 font-medium">Loading your clans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 md:p-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </motion.button>

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6"
                >
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">
                            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                                My Clans
                            </span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg">Manage your squads and dominate the seasons</p>
                    </div>

                    <div className="flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all"
                        >
                            <Plus size={20} />
                            Create Clan
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowJoinModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-bold transition-all text-slate-700 dark:text-white shadow-sm"
                        >
                            <LogIn size={20} />
                            Join Clan
                        </motion.button>
                    </div>
                </motion.div>

                {/* Pending Invites Section */}
                {invites.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                            <Mail className="text-indigo-500" /> Pending Invites
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {invites.map((invite) => (
                                <div key={invite._id} className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10 backdrop-blur-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{invite.clan?.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Invited by <span className="text-indigo-500 font-bold">@{invite.invitedBy?.username}</span></p>
                                        </div>
                                        <Users size={20} className="text-indigo-400" />
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => handleAcceptInvite(invite.clan._id)}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Check size={16} /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleRejectInvite(invite.clan._id)}
                                            className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Content Section */}
                <AnimatePresence mode="wait">
                    {clans.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700"
                        >
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <Users size={40} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Clans Yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">
                                Join forces with other players to track streaks together and climb the leaderboards.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-2 bg-purple-600 rounded-lg font-medium hover:bg-purple-500 transition-colors text-white"
                                >
                                    Create Your Own
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {clans.map((clan, index) => (
                                <motion.div
                                    key={clan._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
                                >
                                    {/* Admin Badge */}
                                    {clan.admin._id === userId && (
                                        <div className="absolute top-4 right-4 animate-pulse">
                                            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full px-3 py-1 flex items-center gap-1.5">
                                                <Shield size={12} className="text-yellow-600 dark:text-yellow-400" />
                                                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">Admin</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 text-xl font-bold text-white">
                                            {clan.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                                            {clan.name}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 min-h-[40px]">
                                            {clan.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    {clan.seasonId && (
                                        <div className="mb-6 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)] dark:shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">Active Season</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{clan.seasonId.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                            <Users size={16} />
                                            <span className="font-medium">{clan.memberCount} Members</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/clan/${clan._id}`)}
                                                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium rounded-lg transition-colors"
                                            >
                                                View
                                            </button>
                                            {clan.admin._id === userId ? (
                                                <button
                                                    onClick={() => handleDeleteClan(clan._id)}
                                                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors"
                                                    title="Delete Clan"
                                                >
                                                    <X size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleLeaveClan(clan._id)}
                                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-medium rounded-lg transition-colors"
                                                    title="Leave Clan"
                                                >
                                                    <LogOutIcon />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div >

            {/* Create Clan Modal */}
            <AnimatePresence>
                {
                    showCreateModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                            onClick={() => setShowCreateModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-900/20"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                                    Create New Clan
                                </h2>
                                <form onSubmit={handleCreateClan} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Clan Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newClan.name}
                                            onChange={(e) => setNewClan({ ...newClan, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
                                            placeholder="e.g. The Streak Masters"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Description</label>
                                        <textarea
                                            value={newClan.description}
                                            onChange={(e) => setNewClan({ ...newClan, description: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none h-32 text-slate-900 dark:text-white"
                                            placeholder="What is your clan about?"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all"
                                        >
                                            Create Clan
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Join Clan Modal */}
            <AnimatePresence>
                {
                    showJoinModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                            onClick={() => setShowJoinModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-blue-900/20"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                                    Join a Clan
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-6">Enter the Clan ID provided by an admin</p>

                                <form onSubmit={handleJoinClan} className="space-y-5">
                                    <div>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
                                            <input
                                                type="text"
                                                required
                                                value={joinClanId}
                                                onChange={(e) => setJoinClanId(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono text-slate-900 dark:text-white"
                                                placeholder="Paste Clan ID here"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowJoinModal(false)}
                                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                                        >
                                            Join Squad
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
};

// Helper icon
const LogOutIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);

export default Clans;
