import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, FileText, Image as ImageIcon } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, refreshUser } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [description, setDescription] = useState(user?.description || '');
    const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/update', {
                username,
                description,
                profilePicture
            });
            await refreshUser();
            toast.success('Profile updated successfully!');
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-lg bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl relative"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            <User className="text-indigo-400" /> Edit Profile
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Profile Picture Preview */}
                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-500/30 bg-slate-900 relative">
                                    {profilePicture ? (
                                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                                            <User size={32} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="input-field !pl-10 w-full"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Profile Picture URL</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                    <input
                                        type="url"
                                        value={profilePicture}
                                        onChange={(e) => setProfilePicture(e.target.value)}
                                        className="input-field !pl-10 w-full"
                                        placeholder="https://example.com/image.png"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-slate-400 block mb-1">About Me</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="input-field !pl-10 w-full min-h-[100px] py-3"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary flex justify-center items-center gap-2 mt-4"
                            >
                                <Save size={18} />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;
