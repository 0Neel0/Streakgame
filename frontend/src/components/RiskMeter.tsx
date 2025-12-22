import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Zap, TrendingUp, AlertOctagon, Activity } from 'lucide-react';

interface RiskMeterProps {
    score: number;
    level: string;
    factors: string[];
    loading?: boolean;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level, factors, loading }) => {
    // Determine Theme based on Score
    const getTheme = (s: number) => {
        if (s < 40) return {
            color: 'emerald',
            main: 'text-emerald-400',
            bg: 'bg-emerald-500',
            gradient: 'from-emerald-500 to-green-400',
            glow: 'shadow-emerald-500/20',
            icon: ShieldCheck,
            label: 'Safe Zone'
        };
        if (s < 70) return {
            color: 'amber',
            main: 'text-amber-400',
            bg: 'bg-amber-500',
            gradient: 'from-amber-500 to-orange-400',
            glow: 'shadow-amber-500/20',
            icon: Activity,
            label: 'Caution'
        };
        return {
            color: 'rose',
            main: 'text-rose-500',
            bg: 'bg-rose-500',
            gradient: 'from-rose-500 to-red-600',
            glow: 'shadow-rose-500/30',
            icon: AlertOctagon,
            label: 'Critical'
        };
    };

    const theme = getTheme(score);
    const Icon = theme.icon;

    // Circle config
    const radius = 36;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    if (loading) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 h-[200px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider animate-pulse">Analyzing Risk...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-lg dark:shadow-xl`}>
            {/* Ambient Glow */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 bg-${theme.color}-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-${theme.color}-500/20 transition-colors`}></div>

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={14} className="text-slate-500 dark:text-slate-400" />
                        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Streak Risk</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>
                            {level}
                        </h2>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-${theme.color}-500/10 border border-${theme.color}-500/20`}>
                    <Icon size={14} className={theme.main} />
                    <span className={`text-xs font-bold ${theme.main}`}>{theme.label}</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Gauge */}
                <div className="relative w-24 h-24 shrink-0">
                    {/* Background Ring */}
                    <div className="absolute inset-0 rounded-full border-[6px] border-slate-100 dark:border-slate-800"></div>

                    <svg
                        height={radius * 2 + 10}
                        width={radius * 2 + 10}
                        className="transform -rotate-90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            stroke="currentColor"
                            fill="transparent"
                            strokeWidth={stroke}
                            strokeDasharray={circumference + ' ' + circumference}
                            style={{ strokeDashoffset }}
                            r={normalizedRadius}
                            cx={radius + 5}
                            cy={radius + 5}
                            strokeLinecap="round"
                            className={theme.main}
                        />
                    </svg>

                    {/* Percentage Center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{score}%</span>
                        <span className="text-[10px] text-slate-500 font-medium">RISK</span>
                    </div>

                    {/* Glowing Pulse for High Risk */}
                    {score > 70 && (
                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping pointer-events-none"></div>
                    )}
                </div>

                {/* Factors List */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Contributing Factors</p>
                    <div className="space-y-2">
                        {factors.slice(0, 3).map((factor, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + (i * 0.1) }}
                                className="flex items-center gap-2.5"
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${theme.bg} shadow-[0_0_8px_currentColor]`}></div>
                                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium truncate">{factor}</span>
                            </motion.div>
                        ))}
                        {factors.length === 0 && (
                            <p className="text-sm text-slate-600 italic">No significant risk factors detected.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning Message for High Risk */}
            {score > 70 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 flex items-center gap-3 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                    <AlertTriangle size={18} className="text-red-400 shrink-0 relative z-10" />
                    <p className="text-xs font-semibold text-red-800 dark:text-red-200 relative z-10 leading-relaxed">
                        Your streak is in immediate danger. <span className="text-red-900 dark:text-white underline decoration-red-400 underline-offset-2 cursor-pointer">Check in now</span> to save it.
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default RiskMeter;
