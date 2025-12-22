import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [friends, setFriends] = useState<any[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
        }
    }, [isOpen]);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const res = await api.get('/friends/list');
            setFriends(res.data);
        } catch (err) {
            console.error("Failed to fetch friends", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleFriend = (friendId: string) => {
        if (selectedFriends.includes(friendId)) {
            setSelectedFriends(prev => prev.filter(id => id !== friendId));
        } else {
            setSelectedFriends(prev => [...prev, friendId]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (selectedFriends.length === 0) {
            toast.error("Select at least one friend");
            return;
        }

        setCreating(true);
        try {
            await api.post('/groups/create', {
                name,
                description,
                members: selectedFriends
            });
            toast.success("Group created!");
            onGroupCreated();
            onClose();
            setName('');
            setDescription('');
            setSelectedFriends([]);
        } catch (err: any) {
            toast.error(err.response?.data || "Failed to create group");
        } finally {
            setCreating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="text-indigo-400" /> Create Group
                            </h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Group Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="e.g. Weekend Squad"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Add Members</label>
                                    <div className="bg-slate-950/30 rounded-xl border border-slate-700/50 overflow-hidden max-h-60 overflow-y-auto">
                                        {loading ? (
                                            <div className="p-4 text-center text-slate-500 text-sm">Loading friends...</div>
                                        ) : friends.length === 0 ? (
                                            <div className="p-4 text-center text-slate-500 text-sm">No friends found.</div>
                                        ) : (
                                            <div className="divide-y divide-slate-800">
                                                {friends.map(friend => (
                                                    <div
                                                        key={friend._id}
                                                        onClick={() => toggleFriend(friend._id)}
                                                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${selectedFriends.includes(friend._id) ? 'bg-indigo-500/10' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                                                {friend.profilePicture ? <img src={friend.profilePicture} className="w-full h-full object-cover" /> : null}
                                                            </div>
                                                            <span className={`font-medium ${selectedFriends.includes(friend._id) ? 'text-indigo-400' : 'text-slate-300'}`}>
                                                                {friend.username}
                                                            </span>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedFriends.includes(friend._id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                                                            {selectedFriends.includes(friend._id) && <Check size={12} className="text-white" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 text-right">{selectedFriends.length} selected</p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-700 bg-slate-800/50">
                                <button
                                    type="submit"
                                    disabled={creating || !name || selectedFriends.length === 0}
                                    className="w-full btn-primary bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    {creating ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateGroupModal;
