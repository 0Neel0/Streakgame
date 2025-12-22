import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Copy, Calendar, Trophy, UserMinus, Crown, Edit, Megaphone, X, Check, AlertTriangle, UserPlus, Search, MessageCircle, Send, Gift } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Member {
    _id: string;
    username: string;
    profilePicture?: string;
    xp?: number;
    overallStreak?: number;
}

interface ClanDetails {
    _id: string;
    name: string;
    description: string;
    admin: {
        _id: string;
        username: string;
        profilePicture?: string;
        email?: string;
    };
    members: Member[];
    seasonId?: {
        _id: string;
        name: string;
        startDate: string;
        endDate: string;
    } | null;
    activeSeasons?: {
        _id: string;
        name: string;
        startDate: string;
        endDate: string;
    }[];
    createdAt: string;
}

const ClanDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [clan, setClan] = useState<ClanDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Admin Actions State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<{ name: string, description: string, activeSeasons: string[] }>({
        name: '',
        description: '',
        activeSeasons: []
    });
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [activeSeasons, setActiveSeasons] = useState<any[]>([]);

    // Invite State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [friends, setFriends] = useState<any[]>([]);
    const [inviteSearch, setInviteSearch] = useState('');

    // Chat State
    const [activeTab, setActiveTab] = useState<'members' | 'chat'>('members');
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState<any>(null);

    // XP Transfer State
    const [isXPModalOpen, setIsXPModalOpen] = useState(false);
    const [xpTargetUser, setXpTargetUser] = useState<Member | null>(null);
    const [xpAmount, setXpAmount] = useState('');

    const token = localStorage.getItem('auth-token');

    // Retrieval of userId from user-data if not explicitly set
    let userId = localStorage.getItem('userId');
    let userRole = '';
    try {
        const storedUser = localStorage.getItem('user-data');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (!userId) userId = parsed._id;
            userRole = parsed.role || '';
        }
    } catch (e) { console.error('Error parsing user data', e); }

    useEffect(() => {
        // Socket Connection
        const newSocket = io(API_URL.replace('/api', '')); // Assuming socket is at root
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        fetchClanDetails();
        fetchActiveSeasons();
        fetchFriends();
        if (activeTab === 'chat') {
            fetchMessages();
        }
    }, [id, activeTab]);

    useEffect(() => {
        if (socket && id) {
            socket.emit('join_room', `clan_${id}`);

            socket.on('new_clan_message', (msg: any) => {
                if (msg.clan === id) {
                    setMessages(prev => [...prev, msg]);
                }
            });

            return () => {
                socket.off('new_clan_message');
            };
        }
    }, [socket, id]);

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`${API_URL}/clan/${id}/messages`, {
                headers: { 'auth-token': token }
            });
            setMessages(response.data);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    useEffect(() => {
        fetchClanDetails();
        fetchActiveSeasons();
        fetchFriends();
    }, [id]);

    const fetchFriends = async () => {
        try {
            const response = await axios.get(`${API_URL}/friends/list`, {
                headers: { 'auth-token': token }
            });
            setFriends(response.data);
        } catch (err) {
            console.error('Error fetching friends:', err);
        }
    };

    const fetchActiveSeasons = async () => {
        try {
            // Fetch ALL active seasons, not just currently running ones, to allow setup
            const response = await axios.get(`${API_URL}/season`, {
                headers: { 'auth-token': token }
            });
            setActiveSeasons(response.data);
        } catch (err) {
            console.error('Error fetching seasons:', err);
        }
    };

    const fetchClanDetails = async () => {
        try {
            const response = await axios.get(`${API_URL}/clan/${id}`, {
                headers: { 'auth-token': token }
            });
            setClan(response.data);
            setEditForm({
                name: response.data.name,
                description: response.data.description,
                activeSeasons: response.data.activeSeasons ? response.data.activeSeasons.map((s: any) => s._id) : (response.data.seasonId ? [response.data.seasonId._id] : [])
            });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching clan details:', err);
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!confirm(`Are you sure you want to remove ${memberName} from the clan?`)) return;
        try {
            await axios.delete(`${API_URL}/clan/${id}/member/${memberId}`, {
                headers: { 'auth-token': token }
            });
            toast.success('Member removed');
            fetchClanDetails();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to remove member');
        }
    };

    const handleUpdateClan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/clan/${id}`, {
                name: editForm.name,
                description: editForm.description,
                activeSeasons: editForm.activeSeasons
            }, {
                headers: { 'auth-token': token }
            });
            toast.success('Clan updated successfully');
            setIsEditModalOpen(false);
            fetchClanDetails();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to update clan');
        }
    };

    const handleInviteFriend = async (friendId: string) => {
        try {
            await axios.post(`${API_URL}/clan/${id}/invite`, { targetUserId: friendId }, {
                headers: { 'auth-token': token }
            });
            toast.success('Invitation sent!');
            // Update local state to hide invite button for this user if we want, or just toast
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to invite friend');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await axios.post(`${API_URL}/clan/${id}/messages`, { content: newMessage }, {
                headers: { 'auth-token': token }
            });
            setNewMessage('');
            // Message will be added via socket
        } catch (err: any) {
            toast.error('Failed to send message');
        }
    };

    const handleTransferXP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!xpTargetUser || !xpAmount) return;

        try {
            const response = await axios.post(`${API_URL}/clan/${id}/transfer-xp`, {
                targetUserId: xpTargetUser._id,
                amount: parseInt(xpAmount)
            }, {
                headers: { 'auth-token': token }
            });
            toast.success(response.data.message);
            setIsXPModalOpen(false);
            setXpAmount('');
            setXpTargetUser(null);
            // Refresh clan details to update XP balance if needed, though strictly we might want to update local state optimistically
            fetchClanDetails();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to transfer XP');
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/clan/${id}/announce`, { message: broadcastMessage }, {
                headers: { 'auth-token': token }
            });
            toast.success('Announcement sent to all members');
            setIsBroadcastModalOpen(false);
            setBroadcastMessage('');
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to send announcement');
        }
    };

    const handleTransferOwnership = async (newAdminId: string, memberName: string) => {
        if (!confirm(`⚠️ DANGER: Are you sure you want to transfer ownership to ${memberName}? You will lose admin privileges.`)) return;
        try {
            await axios.post(`${API_URL}/clan/${id}/transfer`, { newAdminId }, {
                headers: { 'auth-token': token }
            });
            toast.success('Ownership transferred');
            fetchClanDetails();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to transfer ownership');
        }
    };

    const handleSquadCheckIn = async () => {
        // Allow check-in if either activeSeasons exist OR legacy seasonId exists
        const hasActiveSeasons = clan?.activeSeasons && clan.activeSeasons.length > 0;
        const hasLegacySeason = clan?.seasonId;

        if (!hasActiveSeasons && !hasLegacySeason) return;

        try {
            const response = await axios.post(`${API_URL}/clan/${id}/checkin`, {}, {
                headers: { 'auth-token': token }
            });
            toast.success(response.data.message);
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to check in squad');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Clan ID copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!clan) {
        return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Clan not found</div>;
    }

    const isClanOwner = String(clan.admin._id).trim() === String(userId).trim();
    const isSystemAdmin = userRole === 'admin';
    const isAdmin = isClanOwner || isSystemAdmin;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 md:p-8 relative overflow-hidden transition-colors duration-300">
            {/* Background Decorations */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10 w-full">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/clans')}
                    className="flex items-center gap-2 mb-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Clans
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 shadow-2xl transition-all"
                >
                    {/* Hero Header */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/40 dark:to-indigo-900/40 p-8 flex flex-col justify-end overflow-hidden group">
                        <div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                                    {clan.name}
                                    {isAdmin && (
                                        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 rounded-full">
                                            <Crown size={16} className="text-yellow-400" />
                                            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider hidden sm:inline">Admin</span>
                                        </div>
                                    )}
                                </h1>
                                <p className="text-slate-600 dark:text-purple-200/80 text-lg max-w-2xl">{clan.description}</p>
                            </div>

                            {isAdmin && (
                                <div className="flex flex-wrap gap-2 relative z-50 mt-4 md:absolute md:bottom-8 md:right-8">
                                    <button
                                        onClick={() => setIsInviteModalOpen(true)}
                                        className="p-3 bg-indigo-500 hover:bg-indigo-600 hover:scale-105 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all shadow-lg shadow-indigo-500/20"
                                        title="Invite Friends"
                                    >
                                        <div className="flex items-center gap-2">
                                            <UserPlus size={20} />
                                            <span className="hidden lg:inline text-sm font-bold">Invite</span>
                                        </div>
                                    </button>
                                    {((clan.seasonId && clan.seasonId._id) || (clan.activeSeasons && clan.activeSeasons.length > 0)) ? (
                                        <button
                                            onClick={handleSquadCheckIn}
                                            className="p-3 bg-green-500/80 hover:bg-green-500 hover:scale-105 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all shadow-lg shadow-green-500/20"
                                            title="Squad Check-in (Check in everyone)"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Check size={20} />
                                                <span className="hidden lg:inline text-sm font-bold">Squad Check-in</span>
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="p-3 bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl shadow-lg shadow-yellow-500/20 animate-pulse border-2 border-yellow-300"
                                            title="Assign a Season to enable Check-in"
                                        >
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle size={20} />
                                                <span className="inline text-sm font-bold">ASSIGN SEASON</span>
                                            </div>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="p-3 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all border border-white/10"
                                        title="Edit Clan Details"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={() => setIsBroadcastModalOpen(true)}
                                        className="p-3 bg-indigo-500/80 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white rounded-xl backdrop-blur-md transition-all shadow-lg shadow-indigo-500/20"
                                        title="Broadcast Announcement"
                                    >
                                        <Megaphone size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
                        <div className="bg-white dark:bg-slate-900/80 p-6 flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Members</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{clan.members.length}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900/80 p-6 flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Created</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{new Date(clan.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900/80 p-6 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group"
                            onClick={() => copyToClipboard(clan._id)}>
                            <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <Copy size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Clan ID</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white truncate font-mono">{clan._id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Season Info (if exists) */}
                    {(clan.seasonId || (clan.activeSeasons && clan.activeSeasons.length > 0)) && (
                        <div className="p-6 bg-purple-50 dark:bg-purple-900/10 border-t border-purple-200 dark:border-purple-500/20">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)] dark:shadow-[0_0_10px_rgba(74,222,128,0.5)] animate-pulse"></div>
                                <span className="font-semibold text-purple-700 dark:text-purple-300">
                                    Active Seasons:
                                    {clan.activeSeasons && clan.activeSeasons.length > 0
                                        ? clan.activeSeasons.map(s => s.name).join(', ')
                                        : (clan.seasonId ? clan.seasonId.name : 'Unknown')}
                                </span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-1">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'members' ? 'text-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        MEMBERS
                        {activeTab === 'members' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'chat' ? 'text-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        CLAN CHAT
                        {activeTab === 'chat' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
                    </button>
                </div>

                {/* Members List */}
                {activeTab === 'members' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Users className="text-purple-600 dark:text-purple-400" />
                            Clan Members
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clan.members.map((member, index) => (
                                <motion.div
                                    key={member._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-purple-300 dark:hover:border-slate-700 transition-all shadow-sm hover:shadow-md"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            {member.profilePicture ? (
                                                <img
                                                    src={member.profilePicture}
                                                    alt={member.username}
                                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-bold ring-2 ring-slate-100 dark:ring-slate-800 text-white">
                                                    {member.username[0].toUpperCase()}
                                                </div>
                                            )}
                                            {member._id === clan.admin._id && (
                                                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border border-white dark:border-slate-900 shadow-lg" title="Admin">
                                                    <Crown size={12} className="text-slate-900" />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                {member.username}
                                                {member._id === clan.admin._id && (
                                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 rounded uppercase font-bold tracking-wider border border-yellow-500/20 hidden sm:inline-block">Admin</span>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Trophy size={12} className="text-purple-500 dark:text-purple-400" />
                                                    {member.xp || 0} XP
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                                    {member.overallStreak || 0} Streak
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setXpTargetUser(member);
                                                setIsXPModalOpen(true);
                                            }}
                                            className="p-2 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group-hover:opacity-100 opacity-100" // Always show or use group-hover
                                            title="Send XP"
                                        >
                                            <Gift size={18} />
                                        </button>
                                        {isAdmin && member._id !== clan.admin._id && (
                                            <>
                                                <button
                                                    onClick={() => handleTransferOwnership(member._id, member.username)}
                                                    className="p-2 text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Transfer Ownership"
                                                >
                                                    <Crown size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveMember(member._id, member.username)}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Remove Member"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}


                {/* Chat Area */}
                {activeTab === 'chat' && (
                    <div className="flex flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-900/60 dark:to-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl" style={{ height: '650px' }}>
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center gap-3 shadow-lg">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <MessageCircle size={20} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg">Clan Chat</h3>
                                <p className="text-xs text-white/70">{clan.members.length} members</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/30"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#6366f1 transparent'
                            }}
                            ref={(el) => {
                                if (el && messages.length > 0) {
                                    el.scrollTop = el.scrollHeight;
                                }
                            }}
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-center"
                                    >
                                        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                                            <MessageCircle size={40} className="text-indigo-500 dark:text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No messages yet</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Start the conversation with your clan!</p>
                                    </motion.div>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender?._id === userId;
                                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                    const showAvatar = !prevMsg || prevMsg.sender?._id !== msg.sender?._id;

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${!showAvatar ? 'mt-1' : 'mt-4'}`}
                                        >
                                            <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                                {/* Avatar */}
                                                <div className={`w-8 h-8 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                                    {msg.sender?.profilePicture ? (
                                                        <img
                                                            src={msg.sender.profilePicture}
                                                            alt={msg.sender.username}
                                                            className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-md"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-800 shadow-md">
                                                            {msg.sender?.username?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Message Bubble */}
                                                <div className={`relative group`}>
                                                    {showAvatar && !isMe && (
                                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-2">
                                                            {msg.sender?.username}
                                                        </p>
                                                    )}
                                                    <div className={`px-4 py-3 rounded-2xl shadow-md transition-all hover:shadow-lg ${isMe
                                                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white rounded-br-md'
                                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md border border-slate-200 dark:border-slate-700'
                                                        }`}>
                                                        <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <p className={`text-[10px] ${isMe ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-3.5 outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <motion.button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-700 dark:disabled:to-slate-700 text-white rounded-2xl transition-all shadow-lg disabled:shadow-none disabled:cursor-not-allowed"
                                >
                                    <Send size={20} />
                                </motion.button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* XP Transfer Modal */}
            <AnimatePresence>
                {isXPModalOpen && xpTargetUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
                        >
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 mb-4">
                                Send XP to {xpTargetUser.username}
                            </h3>
                            <form onSubmit={handleTransferXP}>
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Enter amount (e.g. 50)"
                                        value={xpAmount}
                                        onChange={(e) => setXpAmount(e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsXPModalOpen(false)}
                                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl transition-colors"
                                    >
                                        Send XP
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            {/* Modal Gradient Background */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-purple-600/20 to-blue-600/20 blur-2xl pointer-events-none"></div>

                            <div className="relative p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Edit className="text-purple-500 dark:text-purple-400" size={24} />
                                            Edit Clan Details
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update your clan's public information</p>
                                    </div>
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white" />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdateClan} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="group">
                                            <label className="block text-xs font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-wider mb-1.5 ml-1">Clan Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-4 pr-4 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                    placeholder="Enter clan name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="block text-xs font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                                            <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-3 pl-4 pr-4 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner min-h-[100px] resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                placeholder="What is your clan about?"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-wider mb-2 ml-1">Active Seasons</label>
                                            <div className="bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-800 p-2 max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                                                {activeSeasons.length > 0 ? activeSeasons.map(season => {
                                                    const isSelected = editForm.activeSeasons?.includes(season._id);
                                                    return (
                                                        <label
                                                            key={season._id}
                                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${isSelected
                                                                ? 'bg-purple-100 dark:bg-purple-600/20 border-purple-300 dark:border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.1)]'
                                                                : 'bg-white dark:bg-slate-800/40 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                                    <Trophy size={14} className={isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                                                                </div>
                                                                <div>
                                                                    <p className={`text-sm font-semibold ${isSelected ? 'text-purple-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{season.name}</p>
                                                                    <p className="text-[10px] text-slate-500">Ends {new Date(season.endDate).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-300 dark:border-slate-600'
                                                                }`}>
                                                                {isSelected && <Check size={12} className="text-white" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    const isChecked = e.target.checked;
                                                                    setEditForm(prev => ({
                                                                        ...prev,
                                                                        activeSeasons: isChecked
                                                                            ? [...(prev.activeSeasons || []), season._id]
                                                                            : (prev.activeSeasons || []).filter((id: string) => id !== season._id)
                                                                    }));
                                                                }}
                                                            />
                                                        </label>
                                                    );
                                                }) : (
                                                    <div className="text-center py-6 text-slate-500">
                                                        <Calendar size={24} className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">No active seasons available</p>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2 ml-1 flex items-center gap-1">
                                                <AlertTriangle size={12} />
                                                Participating in seasons allows for Squad Check-ins.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="px-5 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <Check size={18} />
                                            Save Details
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Broadcast Modal */}
            <AnimatePresence>
                {isBroadcastModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            {/* Accent Top Bar */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg">
                                                <Megaphone size={20} className="text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            Broadcast
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 ml-11">Send a notification to all clan members</p>
                                    </div>
                                    <button onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleBroadcast} className="space-y-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-xl flex items-start gap-3">
                                        <div className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full shrink-0">
                                            <Users className="text-indigo-600 dark:text-indigo-400" size={14} />
                                        </div>
                                        <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">
                                            This message will be sent to <span className="text-indigo-900 dark:text-white font-semibold">{clan.members.length - 1} members</span>. They will receive a notification immediately.
                                        </p>
                                    </div>

                                    <div>
                                        <textarea
                                            value={broadcastMessage}
                                            onChange={(e) => setBroadcastMessage(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all p-4 min-h-[140px] resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                            placeholder="Example: Hey team! Don't forget to check in for the season finale! 🏆"
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsBroadcastModalOpen(false)}
                                            className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <Megaphone size={18} />
                                            Send Broadcast
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Invite Modal */}
            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Invite Friends</h3>
                                <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search friends..."
                                    value={inviteSearch}
                                    onChange={(e) => setInviteSearch(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 pl-10 pr-4 py-3 rounded-xl border border-transparent focus:border-indigo-500 outline-none text-slate-900 dark:text-white transition-all"
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {friends
                                    .filter(f => !clan.members.find((m: any) => m._id === f._id))
                                    .filter(f => f.username.toLowerCase().includes(inviteSearch.toLowerCase()))
                                    .length === 0 ? (
                                    <div className="text-center text-slate-500 py-8">
                                        No friends found to invite.
                                    </div>
                                ) : (
                                    friends
                                        .filter(f => !clan.members.find((m: any) => m._id === f._id))
                                        .filter(f => f.username.toLowerCase().includes(inviteSearch.toLowerCase()))
                                        .map(friend => (
                                            <div key={friend._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                                        {friend.profilePicture ? (
                                                            <img src={friend.profilePicture} alt={friend.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold">{friend.username[0]}</span>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{friend.username}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleInviteFriend(friend._id)}
                                                    className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    Invite
                                                </button>
                                            </div>
                                        ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ClanDetails;
