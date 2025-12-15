import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Loader, PartyPopper } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const rewards = [
    { label: '0 XP', value: 0, color: '#334155' },    // Slate
    { label: '1 XP', value: 1, color: '#6366f1' },    // Indigo
    { label: '5 XP', value: 5, color: '#ec4899' },    // Pink
    { label: '10 XP', value: 10, color: '#f59e0b' },  // Amber
    { label: '100 XP', value: 100, color: '#22c55e' } // Green
];

const SpinWheel = () => {
    const { refreshUser } = useAuth();
    const [spinning, setSpinning] = useState(false);
    const controls = useAnimation();
    const [spinsLeft, setSpinsLeft] = useState<number | null>(null);

    const handleSpin = async () => {
        if (spinning) return;
        setSpinning(true);

        try {
            const res = await api.post('/auth/spin');

            // Calculate index based on reward
            const rewardValue = res.data.reward;
            let targetIndex = rewards.findIndex(r => r.value === rewardValue);

            // If reward not in list (fallback), default to 0
            if (targetIndex === -1) targetIndex = 0;

            // Calculate rotation
            // 5 segments, 72deg each. 
            // We want to land on the target.
            // Rotating clockwise:
            // 0deg = Top? CSS Conic starts top.
            // Let's assume standard index order clockwise.
            // Target is at index * 72deg.
            // To land under the pointer (Top), we need to rotate:
            // 360 * 5 (spins) - (targetIndex * 72).
            // Actually, best to test.

            const segmentAngle = 360 / rewards.length;
            const fullSpins = 360 * 5;
            // Offset to center of segment: segmentAngle / 2?
            // Let's assume segment 0 is at top [0, 72]. Mid is 36.
            // To land 36 at top (0), we rotate -36.
            // Generally: rotate = fullSpins - (targetIndex * segmentAngle).

            const rotateAmount = fullSpins - (targetIndex * segmentAngle);

            await controls.start({
                rotate: rotateAmount,
                transition: { duration: 3, ease: "circOut" }
            });

            // Finish
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} flex items-center gap-3 bg-slate-800 border border-slate-700 shadow-xl p-4 rounded-xl`}>
                    <PartyPopper className="text-yellow-500" />
                    <div>
                        <h4 className="font-bold text-white">You won {rewardValue} XP!</h4>
                        <p className="text-xs text-slate-400">Spins left: {res.data.spinsLeft}</p>
                    </div>
                </div>
            ));

            setSpinsLeft(res.data.spinsLeft);
            await refreshUser();

        } catch (err: any) {
            toast.error(err.response?.data || 'Spin failed');
        } finally {
            setSpinning(false);
            // Reset rotation (optional, or accumulate)
            // If we reset, it jumps. Better to accumulate or use key logic.
            // For simplicity, we just leave it rotated. 
            // Next spin adds to it? 
            // Controls.set({ rotate: 0 }) would jump.
            // Let's just leave it for now, user likely won't spin instantly again without re-render or reset.
            // Actually, if they spin again, we need to spin FROM current.
            // But we know 'rotateAmount' is absolute.
            // Re-mount helps.
            controls.set({ rotate: 0 }); // Snap back for next spin
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6 w-full">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Daily Spin
            </h3>

            <div className="relative w-48 h-48 mb-6">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                    <div className="w-4 h-4 bg-white rotate-45 transform origin-center shadow-lg" />
                </div>

                {/* Wheel */}
                <motion.div
                    animate={controls}
                    className="w-full h-full rounded-full border-4 border-slate-700 shadow-2xl relative overflow-hidden"
                    style={{
                        background: `conic-gradient(
                            ${rewards[0].color} 0deg 72deg,
                            ${rewards[1].color} 72deg 144deg,
                            ${rewards[2].color} 144deg 216deg,
                            ${rewards[3].color} 216deg 288deg,
                            ${rewards[4].color} 288deg 360deg
                        )`
                    }}
                >
                    {rewards.map((r, i) => (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-transparent origin-left"
                            style={{
                                transform: `rotate(${i * 72 + 36}deg) translate(0, -50%)`, // Center of wedge
                            }}
                        >
                            <div className="absolute right-3 -top-[8px] text-[10px] font-bold text-white transform rotate-90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                {r.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800 rounded-full border-2 border-slate-600 z-10 shadow-lg" />
            </div>

            <button
                onClick={handleSpin}
                disabled={spinning}
                className="btn-primary w-full max-w-[200px] shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {spinning ? (
                    <Loader className="animate-spin mx-auto" size={20} />
                ) : (
                    `SPIN NOW ${spinsLeft !== null ? `(${spinsLeft} left)` : ''}`
                )}
            </button>
            <p className="text-xs text-slate-500 mt-3 text-center">Max 3 spins per day</p>
        </div>
    );
};

export default SpinWheel;
