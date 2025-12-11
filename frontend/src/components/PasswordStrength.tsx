import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface PasswordStrengthProps {
    password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
    const strength = useMemo(() => {
        let score = 0;
        if (!password) return 0;

        // Criteria
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[@$!%*?&]/.test(password);

        // Points for complexity
        if (hasLower) score += 1;
        if (hasUpper) score += 1;
        if (hasNumber) score += 1;
        if (hasSpecial) score += 1;

        // Points for length (0.5 per char up to 2 points max bonus?)
        // User said length can be anything, but usually longer is stronger.
        // Let's just add a small bonus for length > 5
        if (password.length > 5) score += 1;

        return Math.min(score, 5); // Max score 5
    }, [password]);

    const getStrengthInfo = (score: number) => {
        switch (score) {
            case 0: return { label: 'Enter Password', color: 'bg-slate-700' };
            case 1: return { label: 'Very Weak', color: 'bg-red-500' };
            case 2: return { label: 'Weak', color: 'bg-orange-500' };
            case 3: return { label: 'Medium', color: 'bg-yellow-500' };
            case 4: return { label: 'Strong', color: 'bg-lime-500' };
            case 5: return { label: 'Very Strong', color: 'bg-green-500' };
            default: return { label: 'Weak', color: 'bg-red-500' };
        }
    };

    const { label, color } = getStrengthInfo(strength);

    return (
        <div className="w-full mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Password Strength</span>
                <span className="text-xs text-slate-300 font-medium">{password ? label : ''}</span>
            </div>
            <div className="flex gap-1 h-1.5 w-full">
                {[1, 2, 3, 4, 5].map((level) => (
                    <motion.div
                        key={level}
                        initial={{ opacity: 0.5, scaleX: 0 }}
                        animate={{
                            opacity: strength >= level ? 1 : 0.2,
                            scaleX: 1,
                            backgroundColor: strength >= level ? '' : '#334155' // slate-700 for inactive
                        }}
                        className={`flex-1 rounded-full text-transparent transition-colors duration-300 ${strength >= level ? color : 'bg-slate-700'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default PasswordStrength;
