import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, Trophy, XCircle, Target, Flame, AlertTriangle, Users, Check, X as XIcon, Swords } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Bet {
    _id: string;
    amount: number;
    multiplier: number;
    status: 'active' | 'won' | 'lost';
    streakAtBet: number;
    createdAt: string;
    resolvedAt?: string;
    betType?: string;
    opponentId?: any;
    challengerId?: any;
    challengeStatus?: string;
    betEndDate?: string;
}

interface BetStats {
    totalBets: number;
    won: number;
    lost: number;
    winRate: string;
    totalWon: number;
    totalLost: number;
    netProfit: number;
}

interface Friend {
    _id: string;
    username: string;
    profilePicture?: string;
    overallStreak?: number;
    xp?: number;
}

const Betting: React.FC = () => {
    const [activeBet, setActiveBet] = useState<Bet | null>(null);
    const [betHistory, setBetHistory] = useState<Bet[]>([]);
    const [betStats, setBetStats] = useState<BetStats | null>(null);
    const [userXP, setUserXP] = useState(0);
    const [showBetModal, setShowBetModal] = useState(false);
    const [betAmount, setBetAmount] = useState(10);
    const [betEndDate, setBetEndDate] = useState('');
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<'solo' | 'friends'>('solo');

    // Friend challenges
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [pendingChallenges, setPendingChallenges] = useState<{ incoming: Bet[], outgoing: Bet[] }>({ incoming: [], outgoing: [] });
    const [activeChallenges, setActiveChallenges] = useState<Bet[]>([]);

    const token = localStorage.getItem('auth-token');

    useEffect(() => {
        fetchUserData();
        fetchActiveBet();
        fetchBetHistory();
        fetchFriends();
        fetchPendingChallenges();
        fetchActiveChallenges();
    }, []);

    const fetchUserData = async () => {
        try {
            const userData = localStorage.getItem('user-data');
            if (userData) {
                const user = JSON.parse(userData);
                setUserXP(user.xp || 0);
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    };

    const fetchActiveBet = async () => {
        try {
            const response = await axios.get(`${API_URL}/bet/active`, {
                headers: { 'auth-token': token }
            });
            setActiveBet(response.data);
        } catch (err) {
            console.error('Error fetching active bet:', err);
        }
    };

    const fetchBetHistory = async () => {
        try {
            const response = await axios.get(`${API_URL}/bet/history`, {
                headers: { 'auth-token': token }
            });
            setBetHistory(response.data.bets);
            setBetStats(response.data.stats);
        } catch (err) {
            console.error('Error fetching bet history:', err);
        }
    };


    const fetchFriends = async () => {
        try {
            const response = await axios.get(`${API_URL}/friends/list`, {
                headers: { 'auth-token': token }
            });
            // Friends API returns an array of friend objects directly
            const acceptedFriends = response.data || [];
            setFriends(acceptedFriends);
        } catch (err) {
            console.error('Error fetching friends:', err);
        }
    };

    const fetchPendingChallenges = async () => {
        try {
            const response = await axios.get(`${API_URL}/challenge/challenges/pending`, {
                headers: { 'auth-token': token }
            });
            setPendingChallenges(response.data);
        } catch (err) {
            console.error('Error fetching pending challenges:', err);
        }
    };

    const fetchActiveChallenges = async () => {
        try {
            const response = await axios.get(`${API_URL}/challenge/challenges/active`, {
                headers: { 'auth-token': token }
            });
            setActiveChallenges(response.data);
        } catch (err) {
            console.error('Error fetching active challenges:', err);
        }
    };

    const handleCreateBet = async () => {
        if (betAmount < 10) {
            toast.error('Minimum bet is 10 XP');
            return;
        }

        if (!betEndDate) {
            toast.error('Please select an end date');
            return;
        }

        const maxBet = Math.floor(userXP * 0.5);
        if (betAmount > maxBet) {
            toast.error(`Maximum bet is ${maxBet} XP (50% of your balance)`);
            return;
        }

        setCreating(true);
        try {
            const response = await axios.post(`${API_URL}/bet/create`, {
                amount: betAmount,
                endDate: betEndDate
            }, {
                headers: { 'auth-token': token }
            });

            toast.success(response.data.message);
            setActiveBet(response.data.bet);
            setUserXP(response.data.newBalance);
            setShowBetModal(false);
            setBetAmount(10);
            setBetEndDate('');
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to create bet');
        } finally {
            setCreating(false);
        }
    };

    const handleSendChallenge = async () => {
        if (!selectedFriend) {
            toast.error('Select a friend first');
            return;
        }

        if (!betEndDate) {
            toast.error('Please select an end date');
            return;
        }

        setCreating(true);
        try {
            const response = await axios.post(`${API_URL}/challenge/challenge`, {
                friendId: selectedFriend._id,
                amount: betAmount,
                endDate: betEndDate
            }, {
                headers: { 'auth-token': token }
            });

            toast.success(response.data.message);
            setShowChallengeModal(false);
            setSelectedFriend(null);
            setBetAmount(10);
            setBetEndDate('');
            fetchPendingChallenges();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to send challenge');
        } finally {
            setCreating(false);
        }
    };

    const handleAcceptChallenge = async (challengeId: string) => {
        try {
            const response = await axios.post(`${API_URL}/challenge/accept/${challengeId}`, {}, {
                headers: { 'auth-token': token }
            });
            toast.success(response.data.message);
            setUserXP(response.data.newBalance);
            fetchPendingChallenges();
            fetchActiveChallenges();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to accept challenge');
        }
    };

    const handleDeclineChallenge = async (challengeId: string) => {
        try {
            await axios.post(`${API_URL}/challenge/decline/${challengeId}`, {}, {
                headers: { 'auth-token': token }
            });
            toast.success('Challenge declined');
            fetchPendingChallenges();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to decline challenge');
        }
    };

    const maxBet = Math.floor(userXP * 0.5);

    // Calculate min and max dates for date picker
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const maxDateObj = new Date();
    maxDateObj.setDate(maxDateObj.getDate() + 30);

    // Calculate days for selected end date
    const calculateDays = () => {
        if (!betEndDate) return 0;
        const today = new Date();
        const end = new Date(betEndDate);
        return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-red-50/20 dark:from-slate-950 dark:via-orange-950/20 dark:to-red-950/20 p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 mb-2 flex items-center gap-3">
                        <Target size={48} />
                        Risk-Reward Mode
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Bet XP on maintaining your streak, alone or against friends!
                    </p>
                </motion.div>

                {/* Current XP */}
                <div className="mb-6 bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 inline-block">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Your XP Balance</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{userXP} <span className="text-lg text-slate-500">XP</span></p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('solo')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'solo'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                            : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        Solo Bets
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'friends'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                            : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                            }`}
                    >
                        <Users size={20} />
                        Friend Challenges
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'solo' ? (
                    <div>
                        {activeBet ? (
                            <ActiveBetCard bet={activeBet} />
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-white mb-8 shadow-2xl"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                        <DollarSign size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">No Active Bet</h2>
                                        <p className="text-white/80">Ready to take a risk?</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBetModal(true)}
                                    className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-orange-50 transition-all flex items-center gap-2"
                                >
                                    <Target size={20} />
                                    Place Bet
                                </button>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Challenge a Friend */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white mb-6 shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <Swords size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Challenge a Friend</h2>
                                    <p className="text-white/80">Winner takes all!</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowChallengeModal(true)}
                                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-50 transition-all"
                            >
                                Send Challenge
                            </button>
                        </motion.div>

                        {/* Pending Challenges */}
                        {pendingChallenges.incoming.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Incoming Challenges</h3>
                                <div className="space-y-3">
                                    {pendingChallenges.incoming.map((challenge) => (
                                        <div key={challenge._id} className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800 shadow-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                                        <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{challenge.challengerId.username}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">Wagered {challenge.amount} XP</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAcceptChallenge(challenge._id)}
                                                        className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition flex items-center gap-2"
                                                    >
                                                        <Check size={16} />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineChallenge(challenge._id)}
                                                        className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition flex items-center gap-2"
                                                    >
                                                        <XIcon size={16} />
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active Challenges */}
                        {activeChallenges.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Active Challenges</h3>
                                <div className="space-y-3">
                                    {activeChallenges.map((challenge) => {
                                        const currentUserId = localStorage.getItem('user-data') ? JSON.parse(localStorage.getItem('user-data')!).id : null;
                                        const opponent = challenge.challengerId._id === currentUserId ? challenge.opponentId : challenge.challengerId;
                                        return (
                                            <div key={challenge._id} className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <p className="font-bold text-lg">VS {opponent.username}</p>
                                                        <p className="text-sm text-white/80">Pot: {challenge.amount * 2} XP</p>
                                                    </div>
                                                    <Swords size={32} />
                                                </div>
                                                <p className="text-sm text-white/90">First to break their streak loses!</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {pendingChallenges.outgoing.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Pending (Waiting for Response)</h3>
                                <div className="space-y-2">
                                    {pendingChallenges.outgoing.map((challenge) => (
                                        <div key={challenge._id} className="bg-white dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 opacity-60">
                                            <p className="text-slate-900 dark:text-white">Challenged {challenge.opponentId.username} • {challenge.amount} XP</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Stats Cards */}
                {betStats && betStats.totalBets > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <StatCard icon={<Trophy className="text-yellow-500" />} label="Win Rate" value={`${betStats.winRate}%`} />
                        <StatCard icon={<TrendingUp className="text-green-500" />} label="Total Won" value={`${betStats.totalWon} XP`} />
                        <StatCard icon={<XCircle className="text-red-500" />} label="Total Lost" value={`${betStats.totalLost} XP`} />
                        <StatCard
                            icon={<DollarSign className={betStats.netProfit >= 0 ? "text-green-500" : "text-red-500"} />}
                            label="Net Profit"
                            value={`${betStats.netProfit >= 0 ? '+' : ''}${betStats.netProfit} XP`}
                        />
                    </div>
                )}

                {/* Bet History */}
                <div className="bg-white dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Bet History</h2>
                    {betHistory.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-8">No bets yet. Place your first bet to get started!</p>
                    ) : (
                        <div className="space-y-2">
                            {betHistory.map((bet) => (
                                <BetHistoryItem key={bet._id} bet={bet} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bet Creation Modal */}
            <AnimatePresence>
                {showBetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Place Your Bet</h2>

                            {/* End Date Picker */}
                            <div className="mb-6">
                                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 block">Select End Date:</label>
                                <DatePicker
                                    selected={betEndDate ? new Date(betEndDate) : null}
                                    onChange={(date: Date | null) => setBetEndDate(date ? date.toISOString().split('T')[0] : '')}
                                    minDate={tomorrow}
                                    maxDate={maxDateObj}
                                    dateFormat="MMMM d, yyyy"
                                    placeholderText="Select a date"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none"
                                    calendarClassName="dark:bg-slate-800"
                                />
                                {betEndDate && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        Duration: <span className="font-bold text-orange-600 dark:text-orange-400">{calculateDays()} days</span>
                                    </p>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 block">Bet Amount: {betAmount} XP</label>
                                <input
                                    type="range"
                                    min="10"
                                    max={maxBet}
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>10 XP</span>
                                    <span>{maxBet} XP (max)</span>
                                </div>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400" />
                                    <p className="font-bold text-orange-900 dark:text-orange-300 text-sm">Risk & Reward</p>
                                </div>
                                <p className="text-sm text-orange-800 dark:text-orange-400">
                                    <span className="font-bold text-green-600 dark:text-green-400">Win:</span> +{betAmount * 2} XP<br />
                                    <span className="font-bold text-red-600 dark:text-red-400">Lose:</span> -{betAmount} XP
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowBetModal(false);
                                        setBetAmount(10);
                                    }}
                                    className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateBet}
                                    disabled={creating}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                                >
                                    {creating ? 'Placing...' : 'Confirm Bet'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Friend Challenge Modal */}
            <AnimatePresence>
                {showChallengeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Challenge a Friend</h2>

                            {/* Friend Selector */}
                            <div className="mb-6">
                                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 block">Select Friend</label>
                                <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                                    {friends.length === 0 ? (
                                        <p className="text-slate-500 dark:text-slate-400 text-center py-4">No friends available</p>
                                    ) : (
                                        friends.map((friend) => (
                                            <button
                                                key={friend._id}
                                                onClick={() => setSelectedFriend(friend)}
                                                className={`w-full p-3 rounded-xl text-left transition-all ${selectedFriend?._id === friend._id
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                <p className="font-bold">{friend.username}</p>
                                                <p className="text-xs opacity-80">Streak: {friend.overallStreak || 0}</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Challenge End Date */}
                            <div className="mb-6">
                                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 block">Challenge Until:</label>
                                <DatePicker
                                    selected={betEndDate ? new Date(betEndDate) : null}
                                    onChange={(date: Date | null) => setBetEndDate(date ? date.toISOString().split('T')[0] : '')}
                                    minDate={tomorrow}
                                    maxDate={maxDateObj}
                                    dateFormat="MMMM d, yyyy"
                                    placeholderText="Select a date"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
                                    calendarClassName="dark:bg-slate-800"
                                />
                                {betEndDate && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        Duration: <span className="font-bold text-indigo-600 dark:text-indigo-400">{calculateDays()} days</span>
                                    </p>
                                )}
                            </div>

                            {/* Bet Amount */}
                            <div className="mb-6">
                                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 block">Bet Amount: {betAmount} XP</label>
                                <input
                                    type="range"
                                    min="10"
                                    max={maxBet}
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>10 XP</span>
                                    <span>{maxBet} XP (max)</span>
                                </div>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Swords size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    <p className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Challenge Rules</p>
                                </div>
                                <p className="text-sm text-indigo-800 dark:text-indigo-400">
                                    First to break their streak loses!<br />
                                    Winner gets <span className="font-bold">{betAmount * 2} XP</span>
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowChallengeModal(false);
                                        setSelectedFriend(null);
                                        setBetAmount(10);
                                    }}
                                    className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendChallenge}
                                    disabled={creating || !selectedFriend}
                                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                                >
                                    {creating ? 'Sending...' : 'Send Challenge'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Active Bet Card Component
const ActiveBetCard: React.FC<{ bet: Bet }> = ({ bet }) => {
    const today = new Date();
    const endDate = bet.betEndDate ? new Date(bet.betEndDate) : null;
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white mb-8 shadow-2xl"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Flame size={32} className="animate-pulse" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Active Bet</h2>
                    <p className="text-white/80">Maintain your streak to win!</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">Bet Amount</p>
                    <p className="text-3xl font-bold">{bet.amount} XP</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">Potential Win</p>
                    <p className="text-3xl font-bold text-green-300">{bet.amount * bet.multiplier} XP</p>
                </div>
            </div>
            {endDate && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                    <p className="text-white/70 text-sm mb-1">Bet Until</p>
                    <p className="text-xl font-bold">{endDate.toLocaleDateString()}</p>
                    <p className="text-sm text-white/80 mt-1">
                        {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Ends today!'}
                    </p>
                </div>
            )}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-white/70">
                    {daysRemaining > 0
                        ? `Keep checking in for ${daysRemaining} more ${daysRemaining === 1 ? 'day' : 'days'} to win!`
                        : 'Check in today to complete your bet!'}
                </p>
            </div>
        </motion.div>
    );
};

// Stat Card Component
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2">
            {icon}
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{label}</p>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
);

// Bet History Item Component
const BetHistoryItem: React.FC<{ bet: Bet }> = ({ bet }) => {
    const displayDate = bet.resolvedAt || bet.createdAt;
    const dateStr = displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A';

    return (
        <div className={`p-4 rounded-xl border-2 ${bet.status === 'won' ? 'border-green-500/50 bg-green-50 dark:bg-green-900/20' : 'border-red-500/50 bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {bet.status === 'won' ? (
                        <Trophy className="text-green-600 dark:text-green-400" size={24} />
                    ) : (
                        <XCircle className="text-red-600 dark:text-red-400" size={24} />
                    )}
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                            {bet.status === 'won' ? `+${bet.amount * bet.multiplier} XP` : `-${bet.amount} XP`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Bet: {bet.amount} XP • {dateStr}
                        </p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${bet.status === 'won' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {bet.status === 'won' ? 'WON' : 'LOST'}
                </span>
            </div>
        </div>
    );
};

export default Betting;
