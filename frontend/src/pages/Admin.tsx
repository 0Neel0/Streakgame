import React, { useEffect, useState } from 'react';
import DatePickerWrapper from '../components/DatePickerWrapper';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Users, CalendarPlus, ArrowLeft, Loader, Trophy, Edit2, Trash2, X, AlertTriangle, Crown, Calendar, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreakUser {
    _id: string;
    username: string;
    overallStreak: number;
    xp?: number;
    hasClaimedRoyalPass?: boolean;
    seasonStreaks?: { seasonId: string; streak: number }[];
}

const Admin = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<StreakUser[]>([]);
    const [seasons, setSeasons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Season Form
    const [seasonName, setSeasonName] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [message, setMessage] = useState('');

    // Edit/Delete State
    const [editingSeason, setEditingSeason] = useState<any>(null);
    const [deletingSeason, setDeletingSeason] = useState<any>(null);
    const [deleteEffectiveDate, setDeleteEffectiveDate] = useState<Date | null>(new Date());
    const [deleteOption, setDeleteOption] = useState<'immediate' | 'date'>('date');

    // Filter State
    const [viewRoyalPass, setViewRoyalPass] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Sort State
    const [sortBy, setSortBy] = useState<'default' | 'streak' | 'xp'>('default');
    const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

    // Royal Pass Config
    const [rpConfig, setRpConfig] = useState({ minStreak: 3, minSeasons: 3, xpReward: 200 });

    const fetchData = async () => {
        try {
            const [usersRes, seasonsRes, settingsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/seasons'),
                api.get('/admin/settings')
            ]);
            setUsers(usersRes.data);
            setSeasons(seasonsRes.data);
            if (settingsRes.data?.royalPassConfig) {
                setRpConfig(settingsRes.data.royalPassConfig);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/admin/settings', { royalPassConfig: rpConfig });
            setMessage('Settings Updated Successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Failed to update settings');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/season', {
                name: seasonName,
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString()
            });
            setMessage('Season Data Created Successfully!');
            fetchData();
            setSeasonName('');
            setStartDate(null);
            setEndDate(null);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error creating season');
        }
    };

    const handleEditClick = (season: any) => {
        setEditingSeason({
            ...season,
            startDate: new Date(season.startDate),
            endDate: new Date(season.endDate)
        });
    };

    const handleUpdateSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSeason) return;

        try {
            await api.put(`/admin/season/${editingSeason._id}`, {
                name: editingSeason.name,
                startDate: editingSeason.startDate.toISOString(),
                endDate: editingSeason.endDate.toISOString()
            });
            setMessage('Season Updated Successfully!');
            setEditingSeason(null);
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Failed to update season');
        }
    };

    const handleDeleteClick = (season: any) => {
        setDeletingSeason(season);
        setDeleteEffectiveDate(new Date());
        setDeleteOption('date');
    };

    const handleProcessDelete = async () => {
        if (!deletingSeason) return;

        try {
            if (deleteOption === 'immediate') {
                await api.delete(`/admin/season/${deletingSeason._id}`);
                setMessage('Season Deleted Successfully!');
            } else {
                await api.put(`/admin/season/${deletingSeason._id}`, {
                    name: deletingSeason.name,
                    startDate: deletingSeason.startDate,
                    endDate: deleteEffectiveDate?.toISOString()
                });
                setMessage(`Season ended on selected date.`);
            }
            setDeletingSeason(null);
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Operation failed');
        }
    };


    if (user?.role !== 'admin') {
        return <div className="p-10 text-white">Access Denied</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 relative overflow-x-hidden font-sans selection:bg-indigo-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-2 rounded-lg">
                            <Crown size={20} className="text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-bold">Admin Console</h1>
                    </div>
                </div>


                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Create Season Form */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="glass-panel p-6 rounded-3xl"
                        >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <CalendarPlus className="text-blue-500" size={20} />
                                </div>
                                Create Season
                            </h2>
                            {message && (
                                <div className={`p-3 rounded-xl mb-6 text-sm font-bold text-center ${message.includes('Error') || message.includes('Fail') ? 'bg-red-500/20 text-red-200 border border-red-500/20' : 'bg-green-500/20 text-green-200 border border-green-500/20'}`}>
                                    {message}
                                </div>
                            )}
                            <form onSubmit={handleCreateSeason} className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Season Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={seasonName}
                                        onChange={(e) => setSeasonName(e.target.value)}
                                        placeholder="e.g. Winter Championship 2024"
                                        required
                                    />
                                </div>
                                <div>
                                    <DatePickerWrapper
                                        label="Start Date"
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        placeholderText="Select start date"
                                    />
                                </div>
                                <div>
                                    <DatePickerWrapper
                                        label="End Date"
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        placeholderText="Select end date"
                                    />
                                </div>
                                <button className="btn-primary" type="submit">Create New Season</button>
                            </form>
                        </motion.div>

                        {/* ROYAL PASS CONFIG */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="glass-panel p-6 rounded-3xl"
                        >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <Crown className="text-amber-500" size={20} />
                                </div>
                                Royal Pass Settings
                            </h2>
                            <form onSubmit={handleUpdateSettings} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Min Streak (Days)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={rpConfig.minStreak}
                                        onChange={(e) => setRpConfig({ ...rpConfig, minStreak: parseInt(e.target.value) })}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Min Seasons Count</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={rpConfig.minSeasons}
                                        onChange={(e) => setRpConfig({ ...rpConfig, minSeasons: parseInt(e.target.value) })}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">XP Reward Amount</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={rpConfig.xpReward}
                                        onChange={(e) => setRpConfig({ ...rpConfig, xpReward: parseInt(e.target.value) })}
                                        min="0"
                                    />
                                </div>
                                <button className="btn-primary" type="submit">Update Settings</button>
                            </form>
                        </motion.div>
                    </div>

                    {/* Right Column: Seasons List & Users */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Seasons List */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="glass-panel p-6 rounded-3xl"
                        >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <Trophy className="text-yellow-500" size={20} />
                                </div>
                                Manage Seasons
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {seasons.map((s: any) => {
                                    const isActive = new Date() >= new Date(s.startDate) && new Date() <= new Date(s.endDate);
                                    const isSelected = selectedSeasonId === s._id;
                                    return (
                                        <div
                                            key={s._id}
                                            className={`p-4 rounded-xl transition-all duration-300 border relative group ${isSelected ? 'bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'}`}
                                        >
                                            <div
                                                onClick={() => setSelectedSeasonId(isSelected ? null : s._id)}
                                                className="cursor-pointer relative z-10"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className={`font-bold text-lg truncate pr-8 ${isSelected ? 'text-white' : 'text-slate-200'}`}>{s.name}</h3>
                                                    {isActive && <span className="absolute top-0 right-0 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-500/20">Active</span>}
                                                </div>

                                                <div className="text-xs text-slate-400 flex flex-col gap-1 mb-3">
                                                    <span>Start: {new Date(s.startDate).toLocaleDateString()}</span>
                                                    <span>End: {new Date(s.endDate).toLocaleDateString()}</span>
                                                </div>

                                                <div className={`text-xs font-bold transition-colors ${isSelected ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                                                    {isSelected ? 'Viewing Stats' : 'Click to View Stats'}
                                                </div>
                                            </div>

                                            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(s); }}
                                                    className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/20"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(s); }}
                                                    className="p-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/20"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {seasons.length === 0 && <p className="text-slate-500 text-sm text-center col-span-2">No seasons created.</p>}
                            </div>
                        </motion.div>

                        {/* Users List */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="glass-panel p-6 rounded-3xl min-h-[500px]"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                <h2 className="text-xl font-bold flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <Users className="text-indigo-500" size={20} />
                                    </div>
                                    {selectedSeasonId ? (
                                        <div className="flex flex-col">
                                            <span>Results: {seasons.find(s => s._id === selectedSeasonId)?.name}</span>
                                            <button
                                                onClick={() => setSelectedSeasonId(null)}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 text-left font-normal flex items-center gap-1"
                                            >
                                                <X size={12} /> Clear Filter
                                            </button>
                                        </div>
                                    ) : 'All User Streaks'}
                                </h2>

                                <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setSortBy(sortBy === 'streak' ? 'default' : 'streak')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${sortBy === 'streak' ? 'bg-orange-500/20 text-orange-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Streak {sortBy === 'streak' && '↓'}
                                    </button>
                                    <button
                                        onClick={() => setSortBy(sortBy === 'xp' ? 'default' : 'xp')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${sortBy === 'xp' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        XP {sortBy === 'xp' && '↓'}
                                    </button>
                                    <button
                                        onClick={() => setViewRoyalPass(!viewRoyalPass)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${viewRoyalPass ? 'bg-yellow-500/20 text-yellow-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <Crown size={12} />
                                        {viewRoyalPass ? 'Royal Only' : 'All users'}
                                    </button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-20"><Loader className="animate-spin text-indigo-500" /></div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {(() => {
                                        let displayUsers = [...users];

                                        if (selectedSeasonId) {
                                            displayUsers = displayUsers.filter(u => u.seasonStreaks?.some(ss => ss.seasonId === selectedSeasonId));
                                        }

                                        if (viewRoyalPass) {
                                            displayUsers = displayUsers.filter(u => u.hasClaimedRoyalPass);
                                        }

                                        if (searchQuery) {
                                            displayUsers = displayUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));
                                        }

                                        displayUsers.sort((a, b) => {
                                            const getStreak = (u: StreakUser) => selectedSeasonId
                                                ? (u.seasonStreaks?.find(ss => ss.seasonId === selectedSeasonId)?.streak || 0)
                                                : u.overallStreak;

                                            if (sortBy === 'streak' || sortBy === 'default') {
                                                if (sortBy === 'default' && !selectedSeasonId) return 0; // Keep default order if no sort
                                                return getStreak(b) - getStreak(a);
                                            } else if (sortBy === 'xp') {
                                                return (b.xp || 0) - (a.xp || 0);
                                            }
                                            return 0;
                                        });

                                        if (displayUsers.length === 0) {
                                            return <div className="col-span-full text-center py-12 text-slate-500 text-sm flex flex-col items-center gap-2"><Filter size={32} className="opacity-20" /> No users found matching filters.</div>;
                                        }

                                        return displayUsers.map(u => {
                                            const displayStreak = selectedSeasonId
                                                ? (u.seasonStreaks?.find(ss => ss.seasonId === selectedSeasonId)?.streak || 0)
                                                : u.overallStreak;

                                            return (
                                                <div key={u._id} className="bg-slate-800/30 border border-transparent hover:border-white/5 p-3 rounded-xl flex items-center justify-between group hover:bg-slate-800/60 transition-all">
                                                    <div className="overflow-hidden mr-2">
                                                        <div className="font-bold truncate flex items-center gap-2" title={u.username}>
                                                            {u.username}
                                                            {u.hasClaimedRoyalPass && <Crown size={12} className="text-yellow-500 fill-yellow-500/20" />}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                                                            XP: {u.xp || 0}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg ${selectedSeasonId ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-orange-500 to-red-600'}`}>
                                                        {displayStreak} d
                                                    </span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </motion.div>
                    </div >
                </div >
            </div >

            {/* Edit Modal - Styling */}
            <AnimatePresence>
                {editingSeason && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl relative"
                        >
                            <button
                                onClick={() => setEditingSeason(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-bold mb-6">Edit Season</h2>
                            <form onSubmit={handleUpdateSeason} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Season Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={editingSeason.name}
                                        onChange={(e) => setEditingSeason({ ...editingSeason, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <DatePickerWrapper
                                    label="Start Date"
                                    selected={editingSeason.startDate}
                                    onChange={(date) => setEditingSeason({ ...editingSeason, startDate: date })}
                                />
                                <DatePickerWrapper
                                    label="End Date"
                                    selected={editingSeason.endDate}
                                    onChange={(date) => setEditingSeason({ ...editingSeason, endDate: date })}
                                />
                                <button className="btn-primary mt-4" type="submit">Update Season</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Delete Modal - Styling */}
            <AnimatePresence>
                {deletingSeason && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl relative"
                        >
                            <button
                                onClick={() => setDeletingSeason(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-red-400">
                                <AlertTriangle /> End Season?
                            </h2>
                            <p className="text-slate-400 mb-6 text-sm">
                                Choose how you want to remove <strong>{deletingSeason.name}</strong>.
                            </p>

                            <div className="space-y-4">
                                <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${deleteOption === 'date' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-800/50 border-transparent hover:border-slate-600'}`}>
                                    <input
                                        type="radio"
                                        name="deleteOption"
                                        checked={deleteOption === 'date'}
                                        onChange={() => setDeleteOption('date')}
                                        className="form-radio text-blue-500"
                                    />
                                    <div>
                                        <div className="font-bold text-white">Soft End (Recommended)</div>
                                        <div className="text-xs text-slate-400">Set end date to today. Keeps history.</div>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${deleteOption === 'immediate' ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-800/50 border-transparent hover:border-slate-600'}`}>
                                    <input
                                        type="radio"
                                        name="deleteOption"
                                        checked={deleteOption === 'immediate'}
                                        onChange={() => setDeleteOption('immediate')}
                                        className="form-radio text-red-500"
                                    />
                                    <div>
                                        <div className="font-bold text-red-300">Hard Delete</div>
                                        <div className="text-xs text-slate-400">Permanently remove from database.</div>
                                    </div>
                                </label>

                                {deleteOption === 'date' && (
                                    <div className="pt-2 pl-2">
                                        <DatePickerWrapper
                                            label="Select End Date"
                                            selected={deleteEffectiveDate}
                                            onChange={(date) => setDeleteEffectiveDate(date)}
                                            placeholderText="Pick deletion date"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setDeletingSeason(null)}
                                        className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors font-bold text-slate-300 border border-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleProcessDelete}
                                        className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors shadow-lg ${deleteOption === 'immediate' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {deleteOption === 'immediate' ? 'Delete Forever' : 'Set End Date'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </div >
    );
};

export default Admin;
