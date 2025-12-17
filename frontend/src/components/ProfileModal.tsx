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
                            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 p-2 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            <User className="text-indigo-400" /> Edit Profile
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Profile Picture Upload Section */}
                            <div className="flex flex-col items-center justify-center mb-8">
                                <div className="relative group cursor-pointer">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500/30 bg-slate-900 relative shadow-2xl shadow-indigo-500/20 group-hover:border-indigo-500 transition-all duration-300">
                                        {profilePicture ? (
                                            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                                                <User size={48} />
                                            </div>
                                        )}

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                            <ImageIcon className="text-white drop-shadow-lg" size={32} />
                                        </div>
                                    </div>

                                    {/* Upload Trigger */}
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append('avatar', file);

                                            // Show loading state specifically for image
                                            const toastId = toast.loading('Uploading image...');

                                            try {
                                                const res = await api.post('/auth/upload-avatar', formData, {
                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                });
                                                setProfilePicture(res.data.profilePicture);
                                                toast.success('Image uploaded!', { id: toastId });
                                            } catch (err: any) {
                                                console.error(err);
                                                toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
                                            }
                                        }}
                                    />

                                    <div className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full border-4 border-slate-800 shadow-lg group-hover:bg-indigo-500 transition-colors">
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">+</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm mt-3 font-medium">Click to change profile picture</p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-sm font-medium text-slate-300 block mb-2 uppercase tracking-wider">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-10 p-3 transition-all placeholder:text-slate-600"
                                            placeholder="Your unique username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-300 block mb-2 uppercase tracking-wider">About Me</label>
                                    <div className="relative group">
                                        <div className="absolute top-3 left-3 pointer-events-none">
                                            <FileText className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                        </div>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-10 p-3 min-h-[120px] transition-all placeholder:text-slate-600 resize-none"
                                            placeholder="Write something about yourself..."
                                        />
                                    </div>
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
