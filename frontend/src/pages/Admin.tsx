import React, { useEffect, useState } from 'react';
import DatePickerWrapper from '../components/DatePickerWrapper';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Users, CalendarPlus, ArrowLeft, Loader, Trophy, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreakUser {
    _id: string;
    username: string;
    overallStreak: number;
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

    const fetchData = async () => {
        try {
            const [usersRes, seasonsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/seasons')
            ]);
            setUsers(usersRes.data);
            setSeasons(seasonsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
                // "Delete from date" => Update endDate to the selected date
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
        <div className="min-h-screen bg-slate-900 text-white p-6 relative">
            <div className="max-w-6xl mx-auto">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Create Season Form */}
                    <div className="lg:col-span-1 space-y-8">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="glass-panel p-6 rounded-2xl"
                        >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CalendarPlus className="text-blue-500" /> Create Season
                            </h2>
                            {message && (
                                <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('Error') || message.includes('Fail') ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                                    {message}
                                </div>
                            )}
                            <form onSubmit={handleCreateSeason} className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Season Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={seasonName}
                                        onChange={(e) => setSeasonName(e.target.value)}
                                        placeholder="e.g. Winter 2024"
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
                                <button className="btn-primary" type="submit">Create Season</button>
                            </form>
                        </motion.div>
                    </div>

                    {/* Right Column: Seasons List & Users */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Seasons List */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="glass-panel p-6 rounded-2xl"
                        >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Trophy className="text-yellow-500" /> Manage Seasons
                            </h2>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {seasons.map((s: any) => {
                                    const isActive = new Date() >= new Date(s.startDate) && new Date() <= new Date(s.endDate);
                                    return (
                                        <div
                                            key={s._id}
                                            className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-colors flex justify-between items-center group"
                                        >
                                            <div onClick={() => navigate(`/season/${s._id}`)} className="cursor-pointer flex-1">
                                                <div className="font-bold text-lg flex items-center gap-2">
                                                    {s.name}
                                                    {isActive && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>}
                                                </div>
                                                <div className="text-sm text-slate-400">
                                                    {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditClick(s)}
                                                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                                    title="Edit Season"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(s)}
                                                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                                    title="Delete / End Season"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {seasons.length === 0 && <p className="text-slate-500 text-sm text-center">No seasons created.</p>}
                            </div>
                        </motion.div>

                        {/* Users List */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="glass-panel p-6 rounded-2xl"
                        >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Users className="text-indigo-500" /> User Streaks
                            </h2>
                            {loading ? (
                                <div className="flex justify-center"><Loader className="animate-spin" /></div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {users.map((u) => (
                                        <div key={u._id} className="bg-white/5 p-3 rounded-lg flex items-center justify-between">
                                            <span className="font-bold truncate" title={u.username}>{u.username}</span>
                                            <span className="bg-gradient-to-r from-orange-500 to-red-600 px-2 py-1 rounded text-xs font-bold">
                                                {u.overallStreak}d
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingSeason && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl relative"
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
                                    <label className="text-sm text-slate-400 block mb-1">Season Name</label>
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
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {deletingSeason && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl relative"
                        >
                            <button
                                onClick={() => setDeletingSeason(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-red-400">
                                <AlertTriangle /> Delete / End Season
                            </h2>
                            <p className="text-slate-400 mb-6">
                                You can either delete the season immediately or set an end date after which it will be removed/inactive.
                            </p>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-blue-500/50 transition-colors">
                                    <input
                                        type="radio"
                                        name="deleteOption"
                                        checked={deleteOption === 'date'}
                                        onChange={() => setDeleteOption('date')}
                                        className="form-radio text-blue-500"
                                    />
                                    <div>
                                        <div className="font-bold">End on Date (Soft Delete)</div>
                                        <div className="text-xs text-slate-400">Season remains active until this date, then becomes inactive.</div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer border border-transparent hover:border-red-500/50 transition-colors">
                                    <input
                                        type="radio"
                                        name="deleteOption"
                                        checked={deleteOption === 'immediate'}
                                        onChange={() => setDeleteOption('immediate')}
                                        className="form-radio text-red-500"
                                    />
                                    <div>
                                        <div className="font-bold text-red-300">Delete Immediately</div>
                                        <div className="text-xs text-slate-400">Permanently removes the season and all check-ins.</div>
                                    </div>
                                </label>

                                {deleteOption === 'date' && (
                                    <div className="pt-2 pl-8">
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
                                        className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleProcessDelete}
                                        className={`flex-1 py-2 rounded-lg font-bold transition-colors ${deleteOption === 'immediate' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {deleteOption === 'immediate' ? 'Delete Forever' : 'Set End Date'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Admin;
