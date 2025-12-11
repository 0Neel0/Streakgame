import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import PasswordStrength from '../components/PasswordStrength';
import { UserPlus, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('user');

    const navigate = useNavigate();

    const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;
    const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z]+(?:\.[a-z]+)+$/;
    const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).+$/;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!USERNAME_REGEX.test(username)) {
            toast.error('Username must contain only letters, numbers, and underscores.');
            return;
        }

        if (!EMAIL_REGEX.test(email)) {
            toast.error('Invalid email format. Must be lowercase and valid domain.');
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            toast.error('Password must contain uppercase, lowercase, number, and special character.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            await api.post('/auth/register', { username, email, password, role });
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err: any) {
            // Handle if backend sends string or object
            const msg = err.response?.data;
            const errorMsg = msg?.message || (typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Registration failed');
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10 p-8 glass-panel rounded-2xl"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/50"
                    >
                        <UserPlus size={32} className="text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                        Create Account
                    </h2>
                    <p className="text-slate-400 mt-2">Start your streak journey today</p>
                </div>



                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field !pl-14"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field !pl-14"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field !pl-14"
                                required
                            />
                        </div>
                        <PasswordStrength password={password} />
                    </div>

                    {password && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="overflow-hidden"
                        >
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field !pl-14"
                                    required
                                />
                            </div>
                        </motion.div>
                    )}

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Select Role</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 cursor-pointer border rounded-lg p-3 text-center transition-all ${role === 'user' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="user"
                                    checked={role === 'user'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="hidden"
                                />
                                User
                            </label>
                            <label className={`flex-1 cursor-pointer border rounded-lg p-3 text-center transition-all ${role === 'admin' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={role === 'admin'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="hidden"
                                />
                                Admin
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary flex items-center justify-center gap-2 group">
                        Sign Up
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="text-center mt-6 text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-all">
                        Login
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
