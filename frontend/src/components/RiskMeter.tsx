import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface RiskMeterProps {
    score: number;
    level: string;
    factors: string[];
    loading?: boolean;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level, factors, loading }) => {
    // Color mapping
    const getColor = (s: number) => {
        if (s < 40) return { main: 'text-green-500', bg: 'bg-green-500', border: 'border-green-200' };
        if (s < 70) return { main: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-200' };
        return { main: 'text-red-500', bg: 'bg-red-500', border: 'border-red-200' };
    };

    const color = getColor(score);
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    if (loading) return <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />;

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Streak Risk</h3>
                    <p className={`text-2xl font-black mt-1 ${color.main}`}>{level}</p>
                </div>
                <div className={`p-2 rounded-full bg-opacity-10 ${color.bg}`}>
                    {score < 40 ? <ShieldCheck size={20} className={color.main} /> : <AlertTriangle size={20} className={color.main} />}
                </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
                {/* Circular Progress */}
                <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-gray-100"
                        />
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeLinecap="round"
                            className={color.main}
                            style={{ strokeDasharray: circumference }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                        {score}%
                    </div>
                </div>

                {/* Factors */}
                <div className="flex-1 space-y-1">
                    <p className="text-xs text-gray-400 mb-2">Primary Factors:</p>
                    {factors.slice(0, 2).map((factor, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                            <div className={`w-1 h-1 rounded-full ${color.bg}`} />
                            {factor}
                        </div>
                    ))}
                </div>
            </div>

            {score > 70 && (
                <div className="mt-3 text-[10px] text-center bg-red-50 text-red-600 py-1.5 px-2 rounded-lg font-bold animate-pulse">
                    ⚠️ Check in now to save your streak!
                </div>
            )}
        </div>
    );
};

export default RiskMeter;
