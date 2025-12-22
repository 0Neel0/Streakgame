import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, User, Plus, Search, MessageSquare, ArrowLeft, Info, X, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import CreateGroupModal from '../components/CreateGroupModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Chat = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends');
    const [friends, setFriends] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null); // Friend or Group object
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileListVisible, setIsMobileListVisible] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    // Socket.io: Listen for new messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: any) => {
            // Check if message belongs to current chat
            // For DM: if sender matches selected friend, or if I sent it (though I might have added it optimistically or via API response)
            // For Group: if group ID matches selected group

            if (!selectedChat) return;

            const isGroup = selectedChat.type === 'group';
            const chatMatch = isGroup
                ? message.group === selectedChat._id
                : (message.sender._id === selectedChat._id || message.recipient === selectedChat._id);

            // Avoid duplicating messages if API response already added it (you might want to adjust API logic or here)
            // Current approach: API adds it, so we might get duplicates if we just append. 
            // Better: relying on socket for all incoming, and only append self-sent via API response?
            // Or simpler: Check if message ID exists.

            if (chatMatch) {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, selectedChat]);


    const fetchContacts = async () => {
        try {
            const [friendsRes, groupsRes] = await Promise.all([
                api.get('/friends/list'),
                api.get('/groups')
            ]);
            setFriends(friendsRes.data);
            setGroups(groupsRes.data);
        } catch (err) {
            console.error("Failed to fetch contacts", err);
        }
    };

    const handleChatSelect = (chat: any, type: 'friend' | 'group') => {
        setSelectedChat({ ...chat, type });
        setIsMobileListVisible(false);
        setMessages([]);
        setNewMessage('');
        setSelectedFile(null);
        fetchMessages(chat._id, type);

        // Join group room if it's a group chat
        if (type === 'group' && socket) {
            socket.emit('join_group', chat._id);
        }
    };

    const fetchMessages = async (id: string, type: 'friend' | 'group') => {
        setLoading(true);
        try {
            const endpoint = type === 'group'
                ? `/groups/${id}/messages`
                : `/chat/history/${id}`;
            const res = await api.get(endpoint);
            setMessages(res.data);

            if (type === 'friend') {
                // Mark as read for DM
                api.post('/chat/read', { friendId: id });
            }
        } catch (err) {
            console.error("Failed to fetch messages", err);
            toast.error("Failed to load chat history");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 50 * 1024 * 1024) {
                toast.error("File too large (max 50MB)");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !selectedChat) return;

        const endpoint = selectedChat.type === 'group' ? '/groups/message' : '/chat/send';

        const formData = new FormData();
        if (newMessage.trim()) formData.append('content', newMessage);
        if (selectedFile) formData.append('file', selectedFile);
        if (selectedChat.type === 'friend') {
            formData.append('recipientId', selectedChat._id);
        } else {
            formData.append('groupId', selectedChat._id);
        }

        try {
            const res = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error(err);
            toast.error("Failed to send message");
        }
    };



    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const filteredList = activeTab === 'friends'
        ? friends.filter(f => f.username.toLowerCase().includes(searchQuery.toLowerCase()))
        : groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (

        <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans relative selection:bg-blue-100">
            <CreateGroupModal
                isOpen={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                onGroupCreated={fetchContacts}
            />

            {/* Sidebar */}
            <div className={`${isMobileListVisible ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-gray-200 bg-white shrink-0 absolute md:relative z-20 h-full shadow-sm`}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">StreakChat</h1>
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-500"
                        />
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${activeTab === 'friends' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Friends
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${activeTab === 'groups' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Groups
                        </button>
                    </div>

                    {activeTab === 'groups' && (
                        <motion.button
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            onClick={() => setShowCreateGroup(true)}
                            className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 border-dashed rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                        >
                            <Plus size={16} /> New Group
                        </motion.button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {filteredList.map(item => (
                        <div
                            key={item._id}
                            onClick={() => handleChatSelect(item, activeTab === 'friends' ? 'friend' : 'group')}
                            className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${selectedChat?._id === item._id
                                ? 'bg-blue-50 border border-blue-100'
                                : 'hover:bg-gray-50 border border-transparent'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border ${selectedChat?._id === item._id ? 'border-blue-200 bg-blue-100 text-blue-600' : 'border-gray-200 bg-gray-100 text-gray-500'}`}>
                                {activeTab === 'friends' ? (
                                    item.profilePicture ? <img src={item.profilePicture} className="w-full h-full object-cover" /> : <User size={18} />
                                ) : (
                                    <Users size={18} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold truncate text-sm ${selectedChat?._id === item._id ? 'text-blue-900' : 'text-gray-700'}`}>
                                    {activeTab === 'friends' ? item.username : item.name}
                                </h3>
                                {activeTab === 'groups' ? (
                                    <p className={`text-xs truncate ${selectedChat?._id === item._id ? 'text-blue-600/70' : 'text-gray-500'}`}>
                                        {item.members?.length} members
                                    </p>
                                ) : (
                                    <p className={`text-xs truncate ${selectedChat?._id === item._id ? 'text-blue-600/70' : 'text-gray-500'}`}>
                                        Click to chat
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredList.length === 0 && (
                        <div className="text-center text-gray-400 py-10 text-sm">
                            No {activeTab} found.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white relative w-full ${!isMobileListVisible ? 'flex' : 'hidden md:flex'}`}>
                {/* Chat Header */}
                {selectedChat ? (
                    <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileListVisible(true)} className="md:hidden text-gray-500 hover:text-gray-800">
                                <ArrowLeft size={22} />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-500">
                                {selectedChat.type === 'friend' ? <User size={18} /> : <Users size={18} />}
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 text-base leading-tight">
                                    {selectedChat.type === 'friend' ? selectedChat.username : selectedChat.name}
                                </h2>
                                {selectedChat.type === 'group' && (
                                    <p className="text-xs text-gray-500">{selectedChat.members.length} members</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <button className="p-2 hover:bg-gray-50 rounded-lg hover:text-gray-600 transition-colors"><Info size={20} /></button>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center flex-col text-gray-400 gap-4 bg-gray-50/50">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                            <MessageSquare size={32} className="text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-500">Select a chat to start messaging</p>
                    </div>
                )}

                {/* Messages */}
                {selectedChat && (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender._id === user?._id || msg.sender === user?._id;
                                    const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender._id !== msg.sender._id); // Simple consecutive check

                                    return (
                                        <motion.div
                                            key={msg._id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} group items-end gap-2`}
                                        >
                                            {!isMe && (
                                                <div className={`w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden mb-0.5 ${!showAvatar ? 'opacity-0' : ''}`}>
                                                    {(msg.sender.profilePicture) ?
                                                        <img src={msg.sender.profilePicture} className="w-full h-full object-cover" />
                                                        : <User size={14} className="text-gray-500" />}
                                                </div>
                                            )}
                                            <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {!isMe && selectedChat.type === 'group' && showAvatar && (
                                                    <span className="text-[10px] font-semibold text-gray-500 ml-1 mb-1">{msg.sender.username}</span>
                                                )}
                                                <div
                                                    className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${isMe
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                                        }`}
                                                >
                                                    {msg.fileUrl && (
                                                        <div className="mb-2 overflow-hidden rounded-lg bg-black/5">
                                                            {msg.fileType === 'image' ? (
                                                                <img src={msg.fileUrl} alt="Attachment" className="max-w-full cursor-pointer" />
                                                            ) : msg.fileType === 'video' ? (
                                                                <video src={msg.fileUrl} controls className="max-w-full" />
                                                            ) : msg.fileType === 'document' ? (
                                                                <a
                                                                    href={msg.fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`flex items-center gap-3 p-3 min-w-[180px] transition-colors ${isMe ? 'bg-blue-700/50 hover:bg-blue-700/70 border-blue-500/30 border' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 border'}`}
                                                                >
                                                                    <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-white shadow-sm border border-gray-100 text-blue-500'}`}>
                                                                        <FileText size={20} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 text-left">
                                                                        <p className="font-medium truncate text-sm">Attachment</p>
                                                                        <p className="text-[10px] opacity-70 uppercase tracking-widest mt-0.5">Document</p>
                                                                    </div>
                                                                </a>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                    <p>{msg.content}</p>
                                                </div>
                                                <span className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-all px-1">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-20">
                            <form onSubmit={handleSendMessage} className={`relative bg-gray-50 border border-gray-200 rounded-2xl transition-all duration-200 ${newMessage.length > 0 || selectedFile ? 'ring-2 ring-blue-500/10 border-blue-500/50' : 'focus-within:border-gray-300'}`}>
                                <AnimatePresence>
                                    {selectedFile && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                            className="px-3 pt-3 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2 pr-3 text-xs font-medium text-blue-700">
                                                <FileText size={14} />
                                                <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-2 p-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        accept="image/*,video/*,.pdf,.doc,.docx"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        title="Attach file"
                                    >
                                        <Plus size={20} />
                                    </button>

                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={`Message...`}
                                        className="flex-1 bg-transparent border-none text-gray-900 focus:ring-0 placeholder:text-gray-400 py-2 px-2"
                                        autoFocus
                                    />

                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() && !selectedFile}
                                        className={`p-2 rounded-xl flex items-center justify-center transition-all duration-200 ${newMessage.trim() || selectedFile
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform hover:-translate-y-0.5'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Chat;
