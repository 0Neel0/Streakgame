import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Trophy } from 'lucide-react';

interface XPPopupProps {
    xp: number;
    isOpen: boolean;
    onClose: () => void;
}

const XPPopup: React.FC<XPPopupProps> = ({ xp, isOpen, onClose }) => {
    const [isClaiming, setIsClaiming] = useState(false);

    // Generate random particles
    const particles = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        angle: (i * 360) / 12,
        delay: Math.random() * 0.2,
    }));

    const handleClaim = () => {
        setIsClaiming(true);
        setTimeout(() => {
            onClose();
            setIsClaiming(false);
        }, 1000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={isClaiming ? { scale: 1.05 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative max-w-sm w-full"
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full" />

                        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1 rounded-[32px] shadow-2xl overflow-hidden">
                            {/* Inner Border/Container */}
                            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-[28px] p-8 text-center relative overflow-hidden group">

                                {/* Background Decorations */}
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/40 to-transparent" />
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
                                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />

                                {!isClaiming && (
                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-20 hover:bg-white/10 p-2 rounded-full"
                                    >
                                        <X size={20} />
                                    </button>
                                )}

                                <div className="relative z-10 flex flex-col items-center">
                                    {/* Icon Container */}
                                    <div className="relative mb-6">
                                        <motion.div
                                            animate={isClaiming ?
                                                { rotate: 360, scale: 0, opacity: 0 } :
                                                { y: [0, -10, 0] }
                                            }
                                            transition={isClaiming ? { duration: 0.5 } : { repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                            className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-orange-500/30 border border-white/20"
                                        >
                                            <Trophy size={48} className="text-yellow-950 drop-shadow-md" />
                                        </motion.div>

                                        {/* Sparkle Decoration */}
                                        <motion.div
                                            animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute -top-2 -right-2 text-yellow-300"
                                        >
                                            <Sparkles size={24} />
                                        </motion.div>
                                    </div>

                                    <AnimatePresence mode='wait'>
                                        {!isClaiming ? (
                                            <motion.div
                                                key="content"
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="w-full"
                                            >
                                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Level Up!</h2>
                                                <p className="text-slate-400 text-sm font-medium mb-8">You've hit a 5-day streak milestone!</p>

                                                <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 mb-8">
                                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Reward</div>
                                                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400">
                                                        +{xp} XP
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleClaim}
                                                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group-hover:brightness-110"
                                                >
                                                    <Sparkles size={18} className="text-yellow-200" />
                                                    Claim Reward
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="success"
                                                className="absolute inset-0 flex flex-col items-center justify-center h-full"
                                            >
                                                {/* Explosion Particles */}
                                                {particles.map((p) => (
                                                    <motion.div
                                                        key={p.id}
                                                        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                                                        animate={{
                                                            opacity: 0,
                                                            x: Math.cos(p.angle * (Math.PI / 180)) * 150,
                                                            y: Math.sin(p.angle * (Math.PI / 180)) * 150,
                                                            scale: 0
                                                        }}
                                                        transition={{ duration: 0.8, ease: "easeOut", delay: p.delay }}
                                                        className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                                                    />
                                                ))}

                                                {/* Shockwave Ring */}
                                                <motion.div
                                                    initial={{ opacity: 0.5, scale: 0 }}
                                                    animate={{ opacity: 0, scale: 4 }}
                                                    transition={{ duration: 1 }}
                                                    className="absolute w-20 h-20 border-4 border-yellow-400 rounded-full"
                                                />

                                                <motion.div
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ type: "spring", bounce: 0.5 }}
                                                    className="relative z-10"
                                                >
                                                    <div className="text-yellow-400 text-6xl font-black drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                                                        +{xp}
                                                    </div>
                                                    <div className="text-white font-bold mt-2 text-xl">Claimed!</div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default XPPopup;
